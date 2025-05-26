import { config } from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { HumanMessage } from "@langchain/core/messages";
import { OpenAI, ChatOpenAI } from "@langchain/openai";
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { createRetrieverTool } from "langchain/tools/retriever";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { END } from "@langchain/langgraph";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage } from "@langchain/core/messages";
import { StateGraph } from "@langchain/langgraph";
import { START } from "@langchain/langgraph";

// Load environment variables
config({ path: "../.env" });
new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// ------------------------ Connect Vector store ----------------------------

// Pinecone setup
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
});

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
});

const retriever = vectorStore.asRetriever({
      searchKwargs: {
        fetchK: 5,
        lambda: 0.5,
      },
      searchType: "mmr", // Use Maximum Marginal Relevance for diverse results
});

// --------------------- Agent state ----------------------------

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

const tool = createRetrieverTool(retriever, {
  name: "retrieve_abacus_relevant_information",
  description:
    "Search and return information about the given Abacus question/problem and try to answer it.",
});
const tools = [tool];

const toolNode = new ToolNode<typeof GraphState.State>(tools);

// ---------------------- Nodes and edges -------------------------------

function shouldRetrieve(state: typeof GraphState.State): string {
  const { messages } = state;
  console.log("---DECIDE TO RETRIEVE---");
  const lastMessage = messages[messages.length - 1];

  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length
  ) {
    console.log("---DECISION: RETRIEVE---");
    return "retrieve";
  }
  // If there are no tool calls then we finish.
  return END;
}

async function gradeDocuments(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---GET RELEVANCE---");

  const { messages } = state;
  const tool = {
    name: "give_relevance_score",
    description: "Give a relevance score to the retrieved documents.",
    schema: z.object({
      binaryScore: z.string().describe("Relevance score 'yes' or 'no'"),
    }),
  };

  const prompt = ChatPromptTemplate.fromTemplate(
    `You are a grader assessing relevance of retrieved docs to a user question.
  Here are the retrieved docs:
  \n ------- \n
  {context} 
  \n ------- \n
  Here is the user question: {question}
  If the content of the docs are relevant to the users question, score them as relevant.
  Give a binary score 'yes' or 'no' score to indicate whether the docs are relevant to the question.
  Yes: The docs are relevant to the question.
  No: The docs are not relevant to the question.`
  );

  const model = new ChatOpenAI({
    model: "gpt-4o",
    streaming: true,
    temperature: 0,
  }).bindTools([tool], {
    tool_choice: tool.name,
  });

  const chain = prompt.pipe(model);

  const lastMessage = messages[messages.length - 1];

  const score = await chain.invoke({
    question: messages[0].content as string,
    context: lastMessage.content as string,
  });

  // Log each article
  const articles = (lastMessage.content as string).split("\n\n");
  articles
    .map((article) => article.trim())
    .filter((article) => article.length > 0 && article !== "/")
    .forEach((article, idx) => {
      console.log(`Article ${idx + 1}:`);
      console.log(article);
      console.log(
        "Relevance:",
        score.tool_calls?.[0]?.args?.binaryScore ?? "unknown"
      );
      console.log("---------------------------------------------");
    });

  return {
    messages: [score],
  };
}

function checkRelevance(state: typeof GraphState.State): string {
  console.log("---CHECK RELEVANCE---");

  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (!("tool_calls" in lastMessage)) {
    throw new Error(
      "The 'checkRelevance' node requires the most recent message to contain tool calls."
    );
  }
  const toolCalls = (lastMessage as AIMessage).tool_calls;
  if (!toolCalls || !toolCalls.length) {
    throw new Error("Last message was not a function message");
  }

  if (toolCalls[0].args.binaryScore === "yes") {
    console.log("---DECISION: DOCS RELEVANT---");
    return "yes";
  }
  console.log("---DECISION: DOCS NOT RELEVANT---");
  return "no";
}

async function agent(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---CALL AGENT---");

  const { messages } = state;
  const filteredMessages = messages.filter((message) => {
    if (
      "tool_calls" in message &&
      Array.isArray(message.tool_calls) &&
      message.tool_calls.length > 0
    ) {
      return message.tool_calls[0].name !== "give_relevance_score";
    }
    return true;
  });

  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    streaming: true,
  }).bindTools(tools);

  const response = await model.invoke(filteredMessages);
  return {
    messages: [response],
  };
}

async function rewrite(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---TRANSFORM QUERY---");

  const { messages } = state;
  const question = messages[0].content as string;
  const prompt = ChatPromptTemplate.fromTemplate(
    `Look at the input and try to reason about the underlying semantic intent / meaning. \n 
      Here is the initial question:
      \n ------- \n
      {question} 
      \n ------- \n
      Formulate an improved question:`
  );

  // Grader
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    streaming: true,
  });
  const response = await prompt.pipe(model).invoke({ question });
  return {
    messages: [response],
  };
}

async function generate(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---GENERATE---");

  const { messages } = state;
  const question = messages[0].content as string;
  // Extract the most recent ToolMessage
  const lastToolMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg._getType() === "tool");
  if (!lastToolMessage) {
    throw new Error("No tool message found in the conversation history");
  }

  const docs = lastToolMessage.content as string;

  const prompt = ChatPromptTemplate.fromTemplate(`
  Du bist ein spezialisierter IT-Support-Experte für die Abacus Business Software der Abacus Research AG.
  Deine Aufgabe ist es, präzise, hilfreiche und professionelle Antworten zu Fragen über diese Software zu geben.

  Kontext: {context}
  Frage: {question}

  Grundsätze für deine Antworten:
  - Verwende primär die Informationen, die du aus dem Drupal Wiki der ARCON Informatik AG erhalten hast.
  - Antworte auf Deutsch in einem klaren, professionellen Stil.
  - Wenn du bereits Informationen zu diesem Thema gegeben hast, konzentriere dich auf neue Aspekte oder Details, die bisher nicht behandelt wurden.
  - Falls keine neuen Informationen verfügbar sind, stelle dies klar dar und schlage verwandte Themen vor, die für den Nutzer interessant sein könnten.
  - Wenn der Kontext oder die abgerufenen Artikel keine relevanten Informationen enthalten, nutze dein allgemeines Wissen über Abacus-Software, aber weise ausdrücklich darauf hin.
  - Biete Schritt-für-Schritt-Anleitungen an, wenn du Prozesse erklärst.
  - Bei unklaren Fragen bitte um Präzisierung.
  - Beende deine Antwort mit einer weiterführenden Frage, wenn es angemessen ist.

  Format deiner Antworten:
  - Antworte immer auf Deutsch.
  - Beginne mit einer prägnanten Zusammenfassung der Antwort.
  - Strukturiere längere Antworten übersichtlich mit Zwischenüberschriften.
  - Verwende bei Bedarf Aufzählungen für bessere Übersichtlichkeit.
  - Schließe komplexere Antworten mit einer kurzen Zusammenfassung ab.

  Quellenangabe:
  - Gib immer Quelle der Information in Form eins URL an, wenn möglich.
  - Wenn du keine ausreichenden Informationen zu einer Frage hast, kommuniziere das klar und präzise, ohne zu spekulieren.
`);

  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.3,
    streaming: true,
  });

  const ragChain = prompt.pipe(llm);

  const response = await ragChain.invoke({
    context: docs,
    question,
  });

  return {
    messages: [response],
  };
}

// ------------------------ Graph ------------------------------------------

// Define the graph
const workflow = new StateGraph(GraphState)
  .addNode("agent", agent)
  .addNode("retrieve", toolNode)
  .addNode("gradeDocuments", gradeDocuments)
  .addNode("rewrite", rewrite)
  .addNode("generate", generate);

workflow.addEdge(START, "agent");
workflow.addConditionalEdges("agent", shouldRetrieve);
workflow.addEdge("retrieve", "gradeDocuments");
workflow.addConditionalEdges("gradeDocuments", checkRelevance, {
  yes: "generate",
  no: "rewrite",
});
workflow.addEdge("generate", END);
workflow.addEdge("rewrite", "agent");
const app = workflow.compile();

export default async function handleMessage(
  input: string,
  existingHistory: [string, string][] = []
): Promise<string> {
  const messages = [
    ...existingHistory
      .map(([user, assistant]) => [
        new HumanMessage(user),
        new AIMessage(assistant),])
      .flat(),
    new HumanMessage(input),
  ];

  let finalState;
  for await (const output of await app.stream({ messages })) {
    for (const value of Object.values(output)) {
      finalState = value;
    }
  }

  // Extract the latest assistant message as the answer
  const state = finalState as typeof GraphState.State;
  const lastMsg = state.messages[state.messages.length - 1];
  return typeof lastMsg.content === "string"
    ? lastMsg.content
    : JSON.stringify(lastMsg.content);
}
