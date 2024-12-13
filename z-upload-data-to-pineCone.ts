import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import * as fs from "fs/promises";
import { config } from "dotenv";
import { Document } from "langchain/document";

// Load environmental variables
const result = config();

interface Article {
  text: string;
  metadata: {
    source: string;
    articleIndex: number;
  };
}

function splitIntoArticles(text: string): string[] {
  const articles = text.split(/article----------/);
  const processedArticles: string[] = [];

  for (const article of articles) {
    let remainingText = article.trim();
    while (remainingText.length > 10000) {
      processedArticles.push(remainingText.slice(0, 10000));
      remainingText = remainingText.slice(10000);
    }
    if (remainingText.length > 0) {
      processedArticles.push(remainingText);
    }
  }
  return processedArticles;
}

async function createNewVectorStore() {
  // Read the source file
  const newDoc = await fs.readFile(
    'trainingData/combined-text-article-chunks-cleaned.txt',
    'utf8'
  );

  // Split into articles
  const newDocCollection = splitIntoArticles(newDoc);

  // Create documents from articles: docs = array of articles in the format of the Article interface
  const docs: Article[] = newDocCollection.map((article, index) => ({
    text: article.trim(),
    metadata: {
      source: 'wiki',
      articleIndex: index,
    },
  }));

  console.log(`Number of articles created: ${docs.length}`);

  // Initialize Pinecone client
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  // Check if index exists, if not create it
  console.log("Initializing vector store...");

  const indexName = process.env.PINECONE_INDEX_NAME_DRUPAL_AND_COURSES!;
  const index = pinecone.Index(indexName);

  // Create embeddings
  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
  });

  // Initialize PineconeStore
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    textKey: 'text',
  });

  // Process documents in batches
  const batchSize = 100; // Adjust this value based on your needs
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(docs.length / batchSize)}`);

    // Convert Article to Document
    const documents = batch.map(
      (doc) => new Document({ pageContent: doc.text, metadata: doc.metadata })
    );

    // Add documents to vector store
    await vectorStore.addDocuments(documents);
  }

  console.log('Data upload complete!');
}

createNewVectorStore().catch(console.error);