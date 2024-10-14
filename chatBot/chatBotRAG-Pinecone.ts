import { OpenAI } from "openai";
import { config } from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as fs from "fs/promises";

// Load environment variables
config();

// Initialize OpenAI with API key
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("AI initialized");

// Constants
const BATCH_SIZE = 2000; // Number of documents to process in each batch

// Global variables to store the vector store and chain
let vectorStore: PineconeStore;
let chain: RetrievalQAChain;

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Function to initialize or load the vector store
async function initializeVectorStore() {
  console.log("Initializing vector store...");

  const indexName = process.env.PINECONE_INDEX_NAME!;
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
  const [drupalWiki, j_hr_pdfs, test] = await Promise.all([
    fs.readFile(
      "trainingData/drupal-combined-text-only-better-format.txt",
      "utf8"
    ),
    fs.readFile(
      "trainingData/Export-J-patches-und-support-HR-cleaned.txt",
      "utf8"
    ),
    fs.readFile("trainingData/test.txt", "utf8"),
  ]);

  // Combine all source texts
  const combined = drupalWiki + "\n" + j_hr_pdfs + "\n" + test;

  // Split the combined text into manageable chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 300,
  });
  const docs = await textSplitter.createDocuments([combined]);

  console.log(`Number of chunks created: ${docs.length}`);

  // Create embeddings and initialize the vector store
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-ada-002",
  });

  vectorStore = await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex: index,
    textKey: "text",
  });

  console.log("New vector store created in Pinecone");
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
  const prompt = PromptTemplate.fromTemplate(`
    You are an expert IT Support Agent specializing in Abacus Business Software by Abacus Research AG. Your role is to provide accurate, helpful, and professional responses to questions about this software. Use the following guidelines:
    1. Context: {context}
    2. Question: {question}

    Instructions:
    - Always base your answers on the provided context and your knowledge about Abacus software.
    - Respond in the German language.
    - If the context doesn't contain relevant information, use your general knowledge about Abacus software, but clearly state when you're doing so.
    - Provide step-by-step instructions when explaining processes.
    - Use technical terms related to Abacus software, but explain them if they're complex.
    - If you're unsure about any part of your answer, express that uncertainty.
    - If the user's question is unclear, ask for clarification.
    - Provide as much relevant information as possible.
    - Also provide the sources of the informations.
    - End your response with a question to encourage further dialogue if appropriate.

    Response:
  `);

  // Create and return the QA chain
  return RetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(3), // Retrieve the 3 most relevant documents
    {
      prompt,
      returnSourceDocuments: true,
    }
  );
}

// Function to ensure the vector store and chain are initialized
async function ensureInitialized() {
  if (!vectorStore || !chain) {
    vectorStore = await initializeVectorStore();
    chain = await initializeChain(vectorStore);
    console.log("AI and vector store initialized successfully");
  }
}

// Main function to handle incoming messages
export default async function handleMessage(input: string) {
  // Ensure the vector store and chain are initialized
  await ensureInitialized();

  console.log("Query:", input);

  try {
    // Use the chain to process the query and get a response
    const result = await chain!.call({
      query: input,
    });

    // Log the retrieved documents for debugging
    console.log("Retrieved Documents:");
    result.sourceDocuments.forEach(
      (doc: { pageContent: any }, index: number) => {
        console.log(`Document ${index + 1}:`);
        console.log(doc.pageContent);
        console.log("---");
      }
    );

    console.log("Response from result.text:", result.text);

    // Return the generated response
    return result.text;
  } catch (error) {
    console.error("Error processing query:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
