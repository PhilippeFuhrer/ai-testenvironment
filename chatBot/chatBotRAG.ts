import { OpenAI } from "openai";
import { config } from "dotenv";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from 'fs';

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("AI initialized");

// Function to initialize the vector store
async function initializeVectorStore() {
  const text = fs.readFileSync('trainingData/drupal-combined-text-only.txt', 'utf8');
  const textSplitter = new CharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 0 });
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
  const model = new ChatOpenAI({ modelName: 'gpt-4' });
  chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
}

// Call this function when your app starts
initializeChain();

export default async function handleMessage(input: string) {
  if (!chain) {
    await initializeChain();
  }

  const systemMessage = "Du bist ein hilfreicher IT-Support Agent, welcher auf die Abacus Business Software der Abacus Research AG spezialisiert ist und Fragen zu diesem Thema professionell beantwortet.";
  
  // Use the chain to get a response
  const result = await chain.call({
    query: input,
    chatHistory: [{ role: "system", content: systemMessage }],
  });

  console.log("Query:", input);
  console.log("Response:", result.text);

  return result.text;
}
