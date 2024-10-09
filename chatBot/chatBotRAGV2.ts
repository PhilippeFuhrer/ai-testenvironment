import { OpenAI } from "openai";
import { config } from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as fs from 'fs';

config();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("AI initialized");

// Function to preprocess and split documents
async function preprocessAndSplitDocuments() {
  const drupalWiki = fs.readFileSync('trainingData/drupal-combined-text-only-better-format.txt', 'utf8');
  const j_hr_pdfs = fs.readFileSync('trainingData/Export-J-patches-und-support-HR-cleaned.txt', 'utf8');
  const combined = drupalWiki + '\n' + j_hr_pdfs;

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 300,
  });
  const docs = await textSplitter.createDocuments([combined]);

  console.log(`Number of chunks created: ${docs.length}`);
  return docs;
}

// Initialize vector store and chain
let vectorStore: Chroma;
let chain: RetrievalQAChain;

async function initializeChain() {
  const embeddings = new OpenAIEmbeddings();

  try {
    console.log("Attempting to load or create vector store...");
    vectorStore = await Chroma.fromExistingCollection(
      new OpenAIEmbeddings(),
      { collectionName: "abacus_knowledge_base" }
    );
    console.log("Vector store loaded successfully.");
  } catch (error) {
    console.log("Error loading vector store:", error);
    console.log("Creating a new vector store...");
    const docs = await preprocessAndSplitDocuments();
    vectorStore = await Chroma.fromDocuments(docs, embeddings, {
      collectionName: "abacus_knowledge_base",
    });
    console.log("New vector store created.");
  }

  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500,
  });

  // Define the prompt template
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
    - End your response with a question to encourage further dialogue if appropriate.

    Response:
  `);

  // Create the QA chain with model, retriever, and prompt
  chain = RetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(3), // retrieving 3 most relevant documents
    {
      prompt,
      returnSourceDocuments: true,
    }
  );

  console.log("Chain initialized successfully.");
}

// Implement caching
const responseCache = new Map();

// Function to handle incoming messages
export default async function handleMessage(input: string) {
  if (!chain) {
    console.log("Initializing chain...");
    await initializeChain();
  }

  console.log("Query:", input);

  // Check cache first
  if (responseCache.has(input)) {
    console.log("Returning cached response");
    return responseCache.get(input);
  }

  // Use the chain to get a response
  const result = await chain.call({
    query: input,
  });

  console.log("Retrieved Documents:");
  result.sourceDocuments.forEach((doc: { pageContent: any; }, index: number) => {
    console.log(`Document ${index + 1}:`);
    console.log(doc.pageContent);
    console.log("---");
  });

  console.log("Response from result.text:", result.text);

  // Cache the response
  responseCache.set(input, result.text);

  return result.text;
}