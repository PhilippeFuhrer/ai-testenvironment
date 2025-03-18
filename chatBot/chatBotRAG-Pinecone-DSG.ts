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

console.log("DSG Agent initialized");

// Global variables to store the vector store and chain
let vectorStore: PineconeStore;
let chain: any;
let conversationHistory: [string, string][] = [];
let embeddings: OpenAIEmbeddings;

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Function to initialize or load the vector store
async function initializeVectorStore() {
  console.log("Initializing vector store...");

  const indexName = process.env.PINECONE_INDEX_NAME_DEMO_DSG_ONLY!;
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
    embeddings = new OpenAIEmbeddings();
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
    - Kontext: {context}
    - Frage: {input}
    - Verlauf: {chat_history}

    ## Kernkompetenzen
    - Expertise im Schweizer DSG und zugehörigen Verordnungen
    - Praxisnahe Implementierungsempfehlungen
    - **Kommunikation ausschließlich auf Deutsch**

    ## Antwortstandards
    1. Rechtliche Präzision:
      - DSG-Artikel in Klammern am Satzende zitieren (Art. X Abs. Y DSG)
      - Unterscheidung altes/neues DSG (seit 1.9.2023) kennzeichnen

    2. Quellenangaben:
      - Informationsquellen transparent offenlegen (EDÖB, BGE, Literatur)
      - Korrektes Zitierformat für Gerichtsentscheide verwenden

    3. Struktur:
      - Rechtliche Anforderungen in logische Schritte aufgliedern
      - Bei komplexen Themen hierarchische Gliederung verwenden

    4. Transparenz:
      - Rechtliche Grauzonen explizit kennzeichnen
      - Unsicherheiten offen kommunizieren

    5. Gesprächsführung:
      - Keine Wiederholung bereits besprochener Inhalte
      - Antworten mit weiterführender Frage abschließen

    ## Besonderheiten
    - DSGVO-Unterschiede zum DSG hervorheben
    - Fachbegriffe erläutern
    - Klarstellung bei ausländischem Recht: Expertise primär im Schweizer Recht
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
    console.log("Conversation History Length:", conversationHistory.length);
    
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