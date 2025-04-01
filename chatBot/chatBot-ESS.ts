import { OpenAI } from "openai";
import { config } from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
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
let embeddings: OpenAIEmbeddings;
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
    temperature: 0.2,
    maxTokens: 2000,
  });

  // Define the prompt template for the AI
  const promptTemplate = PromptTemplate.fromTemplate(` 
    Du bist ein intelligenter Beratungsagent für Kunden, welche ESS-Abos für das MyAbacus Portal der Abacus Business Software lösen möchten.

    ### Grundprinzipien:
    - Antworte stets auf Deutsch in einem freundlichen, professionellen Tonfall
    - Basiere alle Antworten ausschliesslich auf dem gegebenen Kontext und den bereitgestellten Artikeln
    - ESS-Abos sind für den Zugriff auf das Webportal MyAbacus erforderlich

    ### Verfügbare Informationen:
    Kontext: {context}
    Frage: {input}
    Chat-Verlauf: {chat_history}

    ### Abo-Modelle:
    **Firmenabos:**
    - Werden immer mindestens für 25 User verrechnet
    - Firmenabo-Optionen werden stets für alle User verrechnet (Ausnahme: Firmenabo-Option Spesen Pay-per-Use)
    - Firmenabos können mit Portal-Optionen kombiniert werden
    - **Auch mit Zusatz-Abos vom Typ Einzelabos kombinierbar. Das Zusatz-Abo ist oft günstiger als die Firmenabo-Option, da sie nur für aktive User verrechnet wird.**


    **Einzelabos:**
    - Werden pro User verrechnet, der die Option tatsächlich nutzt
    - Einzelabo-Optionen werden nur für aktive Nutzer berechnet
    - Einzeoabos können nicht mit Portal-Optionen kombiniert werden

    ### Deine Aufgaben:
    1. Analysiere die Kundenanfrage im Detail
    2. Berechne die Kosten für beide Varianten (Firmen- und Einzelabos) basierend auf den Preisen im Kontext
    3. Empfehle die insgesamt günstigere Variante
    4. Stelle die Lizenzkosten der günstigeren Variante in einer übersichtlichen Tabelle dar
    5. Bei fehlenden Informationen (z.B. Anzahl der Nutzer), frage gezielt nach
    6. Beende deine Antwort mit einer weiterführenden Frage, wenn angemessen
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
        fetchK: historyLength < 1 ? 3 : 0,
        lambda: 0.5,
      },
      searchType: "mmr", // Use Maximum Marginal Relevance for diverse results
    });
  
    console.log(`Retriever configured with fetchK: ${historyLength < 1 ? 3 : 0}`);
  
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
  
      // enrich the embedding query, so it can retrieve document to the whole context
      async function createContextualQuery(
        input: string,
        history: [string, string][]
      ) {
        if (history.length > 0) {
          const lastExchange = history[history.length - 1];
          const contextualQuery = `${lastExchange} ${input}`;
          console.log("Using contextual query:", contextualQuery);
          return contextualQuery;
        }
        return input;
      }
  
      // Log the query embedding for debugging
      console.log("Creating query embedding...");
      const contextualQuery = await createContextualQuery(
        input,
        conversationHistory
      );
      const queryEmbedding = await embeddings.embedQuery(contextualQuery);
  
      console.log(
        "Query embedding created (first 5 dimensions):",
        queryEmbedding.slice(0, 5)
      );
  
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