import { OpenAI } from "openai";
import { config } from "dotenv";
import { convertPromptToOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as fs from "fs/promises";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { Document } from "@langchain/core/documents";

// Load environment variables
config();

// Initialize OpenAI with API key
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

console.log("ESS Agent Initzialized");

// Global variables to store the vector store and chain
let vectorStore: PineconeStore;
let chain: any;
let conversationHistory: [string, string][] = [];

// Function to initialize or load the vector store
async function initializeVectorStore() {
  console.log("Initializing vector store...");

  const indexName = process.env.PINECONE_INDEX_NAME_ESS_AGENT_NEU!;
  const index = pinecone.Index(indexName);

  try {
    // Check if the index already exists and has vectors
    const indexStats = await index.describeIndexStats();
    if (indexStats.totalRecordCount && indexStats.totalRecordCount > 0) {
      console.log(
        `Existing vectors found in Pinecone index. Total records: ${indexStats.totalRecordCount}`
      );
    } else {
      console.log("No existing vectors found or unable to determine count.");
    }
    // Initialize PineconeStore
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-ada-002",
    });

    vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });
    return vectorStore;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    throw error;
  }
}

// Function to initialize the QA chain
async function initializeChain(vectorStore: PineconeStore) {
  console.log("Initializing chain...");

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.8,
    maxTokens: 2000,
  });

  // Define the prompt template for the AI
  const promptTemplate = PromptTemplate.fromTemplate(`
    Du bist ein erfahrener IT-Support-Spezialist für die Abacus Business Software von Abacus Research AG. 
    Deine Aufgabe ist es, präzise, hilfreiche und professionelle Antworten auf Fragen zu dieser Software zu geben. 
    Beachte dabei folgende Richtlinien:

    Kontext: {context}
    Frage: {input}
    Chat-Verlauf: {chat_history}

    Allgemeine Anweisungen:
    Basiere deine Antworten stets auf dem gegebenen Kontext, den bereitgestellten Artikeln und deinem Wissen über die Abacus-Software.
    Antworte auf Deutsch.
    Beende deine Antwort mit einer Frage, um den Dialog fortzuführen, wenn es angemessen ist.

    Deine Aufgabe:
    Du bist ein Beratungsagent für Kunden, die ESS-Abos lösen möchten. 
    ESS-Abos werden im Zusammenhang mit der Abacus Business Software verwendet und sind für den Zugriff auf das Webportal MyAbacus erforderlich. 
    Im Kontext findest du alle Abos, Regelungen und die dazugehörigen Kosten. Du beantwortest Kundenanfragen und berätst Kunden zum Thema ESS-Abos. 
    Bei Anfragen zu Kosten gibst du gemäss den Preisen der ESS-Abos in der Datei Auskunft.
    Entscheide dich für die günstigere Variante des Abo-Modelles, also entweder für Einzelabos oder Firmenabos.
    Wichtig: Das Firmenabo ist im Preis pro Abo grundsätzlich günstiger, wird jedoch immer für 25 User verrechnet, weshalb die Firmenabos teilweise auch teurer sein können.
    Abos vom Typ Einzelabo können nicht mit dem Typ Firmenabo oder mit Firmenabo-Optionen kombiniert werden.
    Abos vom Typ Fimrmenabo können nicht mit dem Typ Einzelabo oder mit Zusatz Optionen kombiniert werden.
    Empfehle jeweils die insgesamt günstigere Variante.

    Output:
    Stelle die Lizenzkosten der günstigeren Variante (meistens Fimrenabo) übersichtlich in einem Tabellenformat dar.
    Formattiere den Text für React Markdown.

    Antwort:
  `);

  // This chain takes the retrieved documents and combines them with the prompt
  const documentChain = await createStuffDocumentsChain({
    llm: model, // Use the previously defined language model
    prompt: promptTemplate, // Use the custom prompt template we defined earlier
  });

  // This determines how documents are retrieved from the vector store, only fetch documents the first time of a topic
  const retriever = vectorStore.asRetriever({
    searchKwargs: {
      fetchK: 2,
      lambda: 0.5,
    },
    searchType: "mmr", // Use Maximum Marginal Relevance for diverse results
  });

  // This combines the document chain and the retriever
  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain, // Use the document chain we created above
    retriever, // Use the retriever we set up
  });

  return retrievalChain;
}

// Function to ensure the vector store and chain are initialized
async function ensureInitialized() {
  if (!vectorStore || !chain) {
    try {
      vectorStore = await initializeVectorStore();
      chain = await initializeChain(vectorStore);
      console.log("AI and vector store initialized successfully");
    } catch (error) {
      console.error("Error during initialization:", error);
      throw new Error("Failed to initialize AI and vector store");
    }
  }
}

// Updated main function to handle incoming messages
export default async function handleMessage(input: string) {
  try {
    // Ensure the vector store and chain are initialized
    await ensureInitialized();

    // Use the chain to process the query and get a response
    const result = await chain.invoke({
      input,
      chat_history: conversationHistory,
    });

    // Log the retrieved documents for debugging
    console.log(
      "\n\n\n--------------------------------------------------------------------------------------------------------------------------"
    );
    console.log("Abgerufene Dokumente:");

    if (result.context) {
      result.context.forEach((doc: Document, index: number) => {
        console.log(`Dokument ${index + 1}:`);
        console.log(doc.pageContent);
        console.log(
          "\n\n\n--------------------------------------------------------------------------------------------------------------------------"
        );
      });
    } else {
      console.log("Keine Dokumente abgerufen oder Kontext nicht verfügbar.");
    }


    console.log("Response:", result.answer);

    // Update conversation history
    conversationHistory.push([input, result.answer]);

    console.log(
      "\n\n\n--------------------------------------------------------------------------------------------------------------------------"
    );
    console.log("Conversation History:", conversationHistory);

    // Return the generated response
    return result.answer;
  } catch (error) {
    console.error("Error processing query:", error);
    return "Es tut mir leid, aber es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.";
  }
}
