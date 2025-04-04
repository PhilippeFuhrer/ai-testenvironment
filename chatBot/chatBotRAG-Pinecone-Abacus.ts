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

console.log("Abacus Agent Initialized");

// Global variables to store the vector store, embeddings, chain and history
let vectorStore: PineconeStore;
let embeddings: OpenAIEmbeddings;
let chain: any;
let conversationHistory: [string, string][] = [];

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
      console.log("Index namespaces:", Object.keys(indexStats.namespaces || {}));
    } else {
      console.log("No existing vectors found or unable to determine count.");
    }
    
    // Initialize embeddings and make it global
    embeddings = new OpenAIEmbeddings({
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
async function initializeChain(vectorStore: PineconeStore, historyLength: number) {
  console.log("Initializing chain...");

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.5,
    maxTokens: 1500,
  });

  // Define the prompt template for the AI
  const promptTemplate = PromptTemplate.fromTemplate(`
    Du bist ein spezialisierter IT-Support-Experte für die Abacus Business Software der Abacus Research AG. 
    Deine Aufgabe ist es, präzise, hilfreiche und professionelle Antworten zu Fragen über diese Software zu geben.

    ### Verfügbare Informationen:
    Kontext: {context}
    Frage: {input}
    Chat-Verlauf: {chat_history}

    ### Richtlinien für deine Antworten:
    - Basiere alle Antworten ausschließlich auf dem bereitgestellten Kontext, den abgerufenen Artikeln und deinem Fachwissen über Abacus-Software.
    - Antworte auf Deutsch in einem klaren, professionellen Stil.
    - Wenn du bereits Informationen zu diesem Thema gegeben hast, konzentriere dich auf neue Aspekte oder Details, die bisher nicht behandelt wurden.
    - Falls keine neuen Informationen verfügbar sind, stelle dies klar dar und schlage verwandte Themen vor, die für den Nutzer interessant sein könnten.
    - Wenn der Kontext oder die abgerufenen Artikel keine relevanten Informationen enthalten, nutze dein allgemeines Wissen über Abacus-Software, aber weise ausdrücklich darauf hin.
    - Biete Schritt-für-Schritt-Anleitungen an, wenn du Prozesse erklärst.
    - Verwende Fachbegriffe im Zusammenhang mit Abacus-Software, erkläre sie jedoch, wenn sie komplex sind.
    - Bei unklaren Fragen bitte um Präzisierung.
    - Beende deine Antwort mit einer weiterführenden Frage, wenn es angemessen ist.

    ### Formatierung:
    - Formatiere den Text für React Markdown.
    - Verwende Überschriften, Aufzählungspunkte und Tabellen zur übersichtlichen Darstellung.
    - Hebe wichtige Informationen hervor (z.B. durch **Fettdruck** oder *Kursivschrift*).
    - Nutze Codeblöcke für Beispielbefehle oder Konfigurationsbeispiele.
    - Falls die Quelle aus den Informatione der Dokuemente stammt, gibt die Quelle den aus den Metadaten an. Bspw. source: "wiki" -> dann ist wiki die Quelle.

  `);

  // This chain takes the retrieved documents and combines them with the prompt
  const documentChain = await createStuffDocumentsChain({
    llm: model, // Use the previously defined language model
    prompt: promptTemplate, // Use the custom prompt template we defined earlier
  });

  // This determines how documents are retrieved from the vector store
    // Dynamically set fetchK based on current conversation history length
    const retriever = vectorStore.asRetriever({
      searchKwargs: {
        fetchK: historyLength < 1 ? 3 : 1,
        lambda: 0.5,
      },
      searchType: "mmr", // Use Maximum Marginal Relevance for diverse results
    });
  
    console.log(`Retriever configured with fetchK: ${historyLength < 1 ? 3 : 1}`);
  
    // This combines the document chain and the retriever
    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain, // Use the document chain we created above
      retriever, // Use the retriever we set up
    });
  
    return retrievalChain;
  }
  
  // Function to ensure the vector store is initialized
  async function ensureVectorStoreInitialized() {
    if (!vectorStore) {
      try {
        vectorStore = await initializeVectorStore();
        console.log("Vector store initialized successfully");
      } catch (error) {
        console.error("Error during vector store initialization:", error);
        throw new Error("Failed to initialize vector store");
      }
    }
  }
  
  // Function to perform a direct similarity search for debugging
  async function testSimilaritySearch(query: string) {
    try {
      if (!vectorStore) {
        throw new Error("Vector store not initialized");
      }
  
      console.log("Running direct similarity search for debugging...");
  
      // Diese Methode gibt explizit die Scores zurück
      const results = await vectorStore.similaritySearchWithScore(query, 3);
  
      console.log("\n--------------------------------------------------------------------------------------------------------------------------\n")
      console.log("Direct similarity search results:");
      results.forEach(([doc, score], index) => {
        console.log(`Result ${index + 1}:`);
        console.log(`Score: ${score}`);
        console.log(`Content: ${doc.pageContent.substring(0, 1000)}...`);
        console.log("---------------------------------");
      });
  
      // Nur die Dokumente zurückgeben für Kompatibilität mit dem Rest des Codes
      return results.map(([doc]) => doc);
    } catch (error) {
      console.error("Error performing similarity search:", error);
      return [];
    }
  }
  
  // Updated main function to handle incoming messages
  export default async function handleMessage(
    input: string,
    existingHistory: [string, string][] = []
  ) {
    try {
      // Set conversation history from the frontend
      conversationHistory = existingHistory || [];
  
      // Ensure vector store is initialized
      await ensureVectorStoreInitialized();
      
      // Initialize chain with the current conversation history length
      // This ensures the retriever uses the correct fetchK value
      const chain = await initializeChain(vectorStore, conversationHistory.length);
  
      // Perform a direct similarity search for debugging
      await testSimilaritySearch(input);
  
      // Use the chain to process the query and get a response
      console.log("Invoking retrieval chain...");
      
      // Convert conversation history to a simple string format that LangChain can process
      const formattedHistory = conversationHistory.map(
        ([question, answer]) => `User: ${question}\nAssistent: ${answer}`
      ).join("\n\n");
      
      const result = await chain.invoke({
        input,
        chat_history: formattedHistory,
      });
  
      // Log the retrieved documents for debugging
      console.log(
        "\n--------------------------------------------------------------------------------------------------------------------------"
      );
      console.log("Abgerufene Dokumente:");
  
      if (result.context && result.context.length > 0) {
        console.log(`Number of documents retrieved: ${result.context.length}`);
        result.context.forEach((doc: Document, index: number) => {
          console.log(`Dokument ${index + 1}:`);
          console.log(`Metadata:`, doc.metadata);
          console.log(doc.pageContent);
          console.log(
            "\n--------------------------------------------------------------------------------------------------------------------------"
          );
        });
      } else {
        console.log("Keine Dokumente abgerufen oder Kontext nicht verfügbar.");
      }
      console.log("Response:", result.answer);
  
      // Add the current interaction to the conversation history
      conversationHistory.push([input, result.answer]);
  
      console.log(
        "Updated Conversation History Length:",
        conversationHistory.length
      );
      console.log("Conversations-Historie:", conversationHistory);
  
      // Return the generated response
      return result.answer;
    } catch (error) {
      console.error("Error processing query:", error);
      return "Es tut mir leid, aber es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.";
    }
  }