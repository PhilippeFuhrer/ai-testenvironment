import { OpenAI } from "openai";
import { config } from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
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

console.log("AI initialized");

// Global variables to store the vector store and chain
let vectorStore: PineconeStore;
let chain: any;
let conversationHistory: [string, string][] = [];

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Function to initialize or load the vector store
async function initializeVectorStore() {
  console.log("Initializing vector store...");

  const indexName = process.env.PINECONE_INDEX_NAME_DEMO!;
  const index = pinecone.Index(indexName);

  try {
    // Check if the index already exists and has vectors
    const indexStats = await index.describeIndexStats();

    if (indexStats.totalRecordCount && indexStats.totalRecordCount > 0) {
      console.log(
        `Existing vectors found in Pinecone index. Total records: ${indexStats.totalRecordCount}`
      );
    } else {
      console.log(
        "No existing vectors found or unable to determine count. Creating new vector store..."
      );
      await createNewVectorStore(index);
    }

    // Initialize PineconeStore
    const embeddings = new OpenAIEmbeddings();
    vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    return vectorStore;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    throw error;
  }
}

// Function to create a new vector store
async function createNewVectorStore(index: any) {
  // Read multiple source files asynchronously
  const [drupalWiki] = await Promise.all([
    fs.readFile(
      "trainingData/DSG-Demo-cleaned.txt",
      "utf8"
    ),
    /*fs.readFile(
        "trainingData/Export-J-patches-und-support-HR-cleaned.txt",
        "utf8"
      ),
      fs.readFile("trainingData/test.txt", "utf8"),*/
  ]);

  // Function to split text into articles
  function splitIntoArticles(text: string): string[] {
    // Split the text on "article----------"
    const articles = text.split(/article----------/);

    // Process all articles
    const processedArticles: string[] = articles.flatMap(
      (article: string): string[] => {
        const articleParts: string[] = [];
        let remainingText: string = article;

        while (remainingText.length > 10000) {
          articleParts.push(remainingText.slice(0, 10000));
          remainingText = remainingText.slice(10000);
        }

        if (remainingText.length > 0) {
          articleParts.push(remainingText);
        }

        return articleParts;
      }
    );

    return processedArticles;
  }

  // Split each source into articles
  const drupalWikiArticles = splitIntoArticles(drupalWiki);
  //const jHrPdfsArticles = splitIntoArticles(j_hr_pdfs);
  //const testArticles = splitIntoArticles(test);

  // Combine all articles
  const allArticles = [
    ...drupalWikiArticles,
    //...jHrPdfsArticles,
    //...testArticles,
  ];

  // Create documents from articles
  const docs = allArticles.map((article, index) => ({
    pageContent: article.trim(),
    metadata: {
      source: "wiki",
      articleIndex: index,
    },
  }));

  console.log(`Number of articles created: ${docs.length}`);

  // Create embeddings
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-ada-002",
  });

  // Initialize vector store
  let vectorStore: PineconeStore | null = null;

  // Process documents in batches
  const batchSize = 1; // Adjust this value based on your needs
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    console.log(`Processing article ${i + 1} of ${docs.length}`);
    console.log(`Article length: ${batch[0].pageContent.length} characters`);

    if (vectorStore === null) {
      // Initialize the vector store with the first batch
      vectorStore = await PineconeStore.fromDocuments(batch, embeddings, {
        pineconeIndex: index,
        textKey: "text",
      });
    } else {
      // Add subsequent batches to the existing vector store
      await vectorStore.addDocuments(batch);
    }

    console.log(
      `Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
        docs.length / batchSize
      )}`
    );
  }

  if (vectorStore === null) {
    throw new Error("Failed to create vector store");
  }

  console.log("New vector store created in Pinecone");
  return vectorStore;
}

// Function to initialize the QA chain
async function initializeChain(vectorStore: PineconeStore) {
  console.log("Initializing chain...");

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
    maxTokens: 500,
  });

  // Define the prompt template for the AI
  const promptTemplate = PromptTemplate.fromTemplate(`
    You are an expert Compliance Agent specializing in the Swiss Federal Act on Data Protection (FADP) and related regulations. Your role is to provide accurate, helpful, and professional responses to questions about Swiss data privacy laws. Use the following guidelines:
    1. Context: {context}
    2. Question: {input}
    3. Chat History: {chat_history}

    Instructions:
    - When answering specific questions about the Federal Act on Data Protection, cite the corresponding articles to provide accurate and verifiable information.
    - Respond in the German language.
    - If you've already provided information on this topic, focus on new aspects or details not covered before.
    - If there's no new information to provide, clearly state that and suggest related topics the user might be interested in.
    - If the context doesn't contain relevant information, use your general knowledge about Swiss data privacy laws, but clearly state when you're doing so.
    - Provide step-by-step explanations when clarifying legal requirements or compliance processes.
    - Use legal terms related to Swiss data protection, but explain them if they're complex.
    - If you're unsure about any part of your answer, express that uncertainty.
    - If the user's question is unclear, ask for clarification.
    - Provide as much relevant information as possible, including references to specific articles or sections of the FADP when applicable.
    - Also provide the sources of the information, such as official publications or legal commentaries.
    - End your response with a question to encourage further dialogue if appropriate.
    - If asked about practices in other jurisdictions, clarify that your expertise is specifically in Swiss law.

    Response:
`);

  // This chain takes the retrieved documents and combines them with the prompt
  const documentChain = await createStuffDocumentsChain({
    llm: model, // Use the previously defined language model
    prompt: promptTemplate, // Use the custom prompt template we defined earlier
  });

  // This determines how documents are retrieved from the vector store
  const retriever = vectorStore.asRetriever({
    searchKwargs: {
      fetchK: 3, // Fetch 3 documents initially
      lambda: 0.5, // Balance between relevance and diversity
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

    console.log("Query:", input);

    // Use the chain to process the query and get a response
    const result = await chain.invoke({
      input,
      chat_history: conversationHistory,
    });

    // Log the retrieved documents for debugging
    console.log("Abgerufene Dokumente:");
    if (result.context) {
      result.context.forEach((doc: Document, index: number) => {
        console.log(`Dokument ${index + 1}:`);
        console.log(doc.pageContent);
        console.log("---");
      });
    } else {
      console.log("Keine Dokumente abgerufen oder Kontext nicht verfügbar.");
    }

    console.log("Response:", result.answer);

    // Update conversation history
    conversationHistory.push([input, result.answer]);

    // Return the generated response
    return result.answer;
  } catch (error) {
    console.error("Error processing query:", error);
    return "Es tut mir leid, aber es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.";
  }
}
