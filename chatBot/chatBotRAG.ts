import { OpenAI } from "openai";
import { config } from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as fs from 'fs/promises';


//configure environment variables
config();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log("AI initialized");

// Adjust based on OpenAI's rate limits and your need
const BATCH_SIZE = 2000;

// Initialize vector store and chain
let vectorStore: MemoryVectorStore;
let chain: RetrievalQAChain;

// Function to initialize the vector store with batch processing
async function initializeVectorStore() {
  // Read files asynchronously
  const [drupalWiki, j_hr_pdfs] = await Promise.all([
    fs.readFile('trainingData/drupal-combined-text-only-better-format.txt', 'utf8'),
    fs.readFile('trainingData/Export-J-patches-und-support-HR-cleaned.txt', 'utf8')
  ]); 
  const combined = drupalWiki + '\n' + j_hr_pdfs;

  // Split text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 300,
  });
  const docs = await textSplitter.createDocuments([combined]);

  console.log(`Number of chunks created: ${docs.length}`);

  // Create embeddings in batches
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = new MemoryVectorStore(embeddings);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    await vectorStore.addDocuments(batch);
    console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(docs.length / BATCH_SIZE)}`);
  }

  return vectorStore;
}

async function initializeChain() {
  vectorStore = await initializeVectorStore();
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
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
    - Also provide the sources of the informations.
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
}

// Initialize everything when the module is imported, when server is started
(async () => {
  console.log("Initializing AI and vector store...");
  try {
    await initializeChain();
    console.log("AI and vector store initialized successfully");
  } catch (error) {
    console.error("Error initializing AI and vector store:", error);
    process.exit(1);  // Exit the process if initialization fails
  }
})();

// Function to handle incoming messages
export default async function handleMessage(input: string) {
  console.log("Query:", input);

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

  return result.text;
}