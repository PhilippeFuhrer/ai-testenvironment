import { OpenAI } from "openai";
import { config } from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as fs from 'fs';

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("AI initialized");

// Function to initialize the vector store
async function initializeVectorStore() {
  const text = fs.readFileSync('trainingData/drupal-combined-text-only-better-format.txt', 'utf8');
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await textSplitter.createDocuments([text]);
  
  const embeddings = new OpenAIEmbeddings();
  return await MemoryVectorStore.fromDocuments(docs, embeddings);
}

// Initialize the vector store
let vectorStore: MemoryVectorStore;

// Create the chain
let chain: RetrievalQAChain;

async function initializeChain() {
  vectorStore = await initializeVectorStore();
  const model = new ChatOpenAI({ 
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500
  });
  
  const prompt = PromptTemplate.fromTemplate(`
    You are an expert IT Support Agent specializing in Abacus Business Software by Abacus Research AG. Your role is to provide accurate, helpful, and professional responses to questions about this software. Use the following guidelines:

    1. Context: {context}
    2. Question: {question}

    Instructions:
    - Always base your answers on the provided context and your knowledge about Abacus software.
    - If the context doesn't contain relevant information, use your general knowledge about Abacus software, but clearly state when you're doing so.
    - Provide step-by-step instructions when explaining processes.
    - Use technical terms related to Abacus software, but explain them if they're complex.
    - If you're unsure about any part of your answer, express that uncertainty.
    - Keep your responses concise but informative.
    - If the user's question is unclear, ask for clarification.
    - End your response with a question to encourage further dialogue if appropriate.

    Response:
  `);

  chain = RetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(3),
    {
      prompt,
      returnSourceDocuments: true,
    }
  );
}

// Call this function when your app starts
initializeChain();

export default async function handleMessage(input: string) {
  if (!chain) {
    await initializeChain();
  }

  // Use the chain to get a response
  const result = await chain.call({
    query: input,
  });

  console.log("Query:", input);
  console.log("Response:", result.text);

  return result.text;
}