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

console.log("ISMS Agent Initzialized");

// Global variables to store the vector store and chain
let vectorStore: PineconeStore;
let chain: any;
let embeddings: OpenAIEmbeddings;
let conversationHistory: [string, string][] = [];

// Function to initialize or load the vector store
async function initializeVectorStore() {
  console.log("Initializing vector store...");

  const indexName = process.env.PINECONE_INDEX_NAME_ISMS!;
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
async function initializeChain(vectorStore: PineconeStore) {
  console.log("Initializing chain...");

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
    maxTokens: 4000,
  });

  // Define the prompt template for the AI
  const promptTemplate = PromptTemplate.fromTemplate(` 
    Du bist ein hochqualifizierter Informationssicherheits-Spezialist mit Expertise im Bereich ISMS (Informationssicherheits-Managementsystem). 
    Deine Aufgabe ist es, Fragen zum ISMS der ARCON Informatik AG präzise, kompetent und detailliert zu beantworten.

    Kontext: {context}
    Frage: {input}
    Chat-Verlauf: {chat_history}
    
    Grundsätze für deine Antworten:
    - Verwende primär die Informationen, die du aus dem Confluence-ISMS der ARCON Informatik AG erhalten hast.
    - Stelle sicher, dass deine Antworten den aktuellen Richtlinien und Prozessen des ISMS der ARCON entsprechen.
    - Erkläre komplexe ISMS-Konzepte klar und verständlich, auch für Personen ohne tiefes IT-Sicherheitswissen.
    - Beziehe dich spezifisch auf ARCON-Prozesse, wenn diese in den bereitgestellten Informationen erwähnt werden.
    - Bei fehlenden Informationen weise darauf hin, dass du nur auf Basis der bereitgestellten Confluence-Inhalte antworten kannst und genauere Details im internen ISMS-System der ARCON zu finden sein könnten.
    
    Format deiner Antworten:
    - Antworte immer auf Deutsch.
    - Beginne mit einer prägnanten Zusammenfassung der Antwort.
    - Strukturiere längere Antworten übersichtlich mit Zwischenüberschriften.
    - Verwende bei Bedarf Aufzählungen für bessere Übersichtlichkeit.
    - Schließe komplexere Antworten mit einer kurzen Zusammenfassung ab.
    
    Quellenangabe:
    - Gib die Quelle an, wenn möglich in Form eins URL.
    - Wenn du keine ausreichenden Informationen zu einer Frage hast, kommuniziere das klar und präzise, ohne zu spekulieren.
  `);

  // This chain takes the retrieved documents and combines them with the prompt
  const documentChain = await createStuffDocumentsChain({
    llm: model, // Use the previously defined language model
    prompt: promptTemplate, // Use the custom prompt template we defined earlier
  });

  // This determines how documents are retrieved from the vector store, only fetch documents the first time of a topic
  const retriever = vectorStore.asRetriever({
    searchKwargs: {
      fetchK: conversationHistory.length < 1 ? 3 : 1,
      lambda: conversationHistory.length < 1 ? 0.5 : 1, // More balanced ratio between relevance and diversity
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

// Function to perform a direct similarity search for debugging
async function testSimilaritySearch(query: string) {
  try {
    if (!vectorStore) {
      throw new Error("Vector store not initialized");
    }
    
    console.log("Running direct similarity search for debugging...");
    
    // Diese Methode gibt explizit die Scores zurück
    const results = await vectorStore.similaritySearchWithScore(query, 5);
    
    console.log("Direct similarity search results:");
    results.forEach(([doc, score], index) => {
      console.log(`Result ${index + 1}:`);
      console.log(`Score: ${score}`);
      console.log(`Content: ${doc.pageContent.substring(0, 200)}...`);
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
export default async function handleMessage(input: string, existingHistory: [string, string][] = []) {
  try {
    // Ensure the vector store is initialized and chain is reinitialized
    await ensureInitialized();
    
    // Setze die conversationHistory auf die vom Frontend übergebene Historie
    conversationHistory = existingHistory || [];
    console.log("Conversation History Length: ", conversationHistory.length);
    
    // Log the query embedding for debugging
    console.log("Creating query embedding...");
    const queryEmbedding = await embeddings.embedQuery(input);
    console.log("Query embedding created (first 5 dimensions):", queryEmbedding.slice(0, 5));
    
    // Perform a direct similarity search for debugging
    await testSimilaritySearch(input);
    
    // Use the chain to process the query and get a response
    console.log("Invoking retrieval chain...");
    const result = await chain.invoke({
      input,
      chat_history: conversationHistory,
    });

    // Log the retrieved documents for debugging
    console.log(
      "\n--------------------------------------------------------------------------------------------------------------------------"
    );
    console.log("Abgerufene Dokumente:");

    if (result.context && result.context.length > 0) {
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

    // Füge die aktuelle Interaktion zur Konversationshistorie hinzu
    conversationHistory.push([input, result.answer]);

    console.log("Updated Conversation History Length:", conversationHistory.length);
    console.log("Conversations-Historie " + conversationHistory)

    // Return the generated response  
    return result.answer;
  } catch (error) {
    console.error("Error processing query:", error);
    return "Es tut mir leid, aber es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.";
  }
}