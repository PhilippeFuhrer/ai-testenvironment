import { OpenAI } from "openai";
import { config } from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { ConversationalRetrievalQAChain, LLMChain, loadQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
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
let chain: ConversationalRetrievalQAChain;
let conversationHistory: [string, string][] = [];

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
  const promptTemplate = PromptTemplate.fromTemplate(`
    You are an expert IT Support Agent specializing in Abacus Business Software by Abacus Research AG. Your role is to provide accurate, helpful, and professional responses to questions about this software. Use the following guidelines:
    1. Context: {context}
    2. Question: {question}
    3. Chat History: {chat_history}

    Instructions:
    - Always base your answers on the provided context and your knowledge about Abacus software.
    - Respond in the German language.
    - If you've already provided information on this topic, focus on new aspects or details not covered before.
    - If there's no new information to provide, clearly state that and suggest related topics the user might be interested in.
    - If the context doesn't contain relevant information, use your general knowledge about Abacus software, but clearly state when you're doing so.
    - Provide step-by-step instructions when explaining processes.
    - Use technical terms related to Abacus software, but explain them if they're complex.
    - If you're unsure about any part of your answer, express that uncertainty.
    - If the user's question is unclear, ask for clarification.
    - Provide as much relevant information as possible.
    - Also provide the sources of the information.
    - End your response with a question to encourage further dialogue if appropriate.

    Response:
  `);

  // Create the retriever
  const retriever = vectorStore.asRetriever({
    searchKwargs: {
      fetchK: 5,
      lambda: 0.5,
    },
    searchType: "mmr" // Use Maximum Marginal Relevance for diverse results
  });

  // Create the question generator chain
  const questionGeneratorTemplate = PromptTemplate.fromTemplate(
    "Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.\n\nChat History:\n{chat_history}\nFollow Up Input: {question}\nStandalone question:"
  );
  const questionGeneratorChain = new LLMChain({
    llm: model,
    prompt: questionGeneratorTemplate
  });

  // Create the combine documents chain
  const qaChain = loadQAChain(model as BaseLanguageModel, { 
    type: "stuff", 
    prompt: promptTemplate 
  });

  // Create and return the ConversationalRetrievalQAChain
  return new ConversationalRetrievalQAChain({
    retriever,
    combineDocumentsChain: qaChain,
    questionGeneratorChain,
    returnSourceDocuments: true,
  });
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

// Main function to handle incoming messages
export default async function handleMessage(input: string) {
  try {
    // Ensure the vector store and chain are initialized
    await ensureInitialized();

    console.log("Query:", input);

    // Use the chain to process the query and get a response
    const result = await chain.call({
      question: input,
      chat_history: conversationHistory,
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

    // Update conversation history
    conversationHistory.push([input, result.text]);

    // Return the generated response
    return result.text;
    
  } catch (error) {
    console.error("Error processing query:", error);
    return "Es tut mir leid, aber es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.";
  }
}