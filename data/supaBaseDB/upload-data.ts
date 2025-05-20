import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { config } from "dotenv";
import { Document } from "langchain/document";
import path from "path";

// Load env variables
config({ path: path.resolve(__dirname, "../../.env") });

interface Article {
  text: string;
  metadata: {
    source: string;
    articleIndex: number;
    URL?: string;
  };
}

// Reading the file
const filePath = path.join(__dirname, "../Data-for-RAG/drupal_export.txt");
if (!fs.existsSync(filePath)) {
  console.error("File does not exist:", filePath);
  process.exit(1);
}
console.log("File read successfully!");

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
  const newDoc = await fs.promises.readFile(
    filePath,
    "utf8"
  );

  // Split into articles
  const newDocCollection = splitIntoArticles(newDoc);

  // Create documents from articles
  const docs: Article[] = newDocCollection.map((article, index) => ({
    text: article.trim(),
    metadata: {
      source: "Drupal Wiki",
      articleIndex: index,
    },
  }));

  console.log(`Number of articles created: ${docs.length}`);

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const tableName = process.env.SUPABASE_TABLE_NAME!;
  const client = createClient(supabaseUrl, supabaseKey);

  // Create embeddings
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-large",
  });

  // Initialize SupabaseVectorStore
  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client,
    tableName,
    queryName: "match_documents", // or your custom query function name
  });

  // Process documents in batches
  const batchSize = 100;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
        docs.length / batchSize
      )}`
    );

    // Convert Article to Document
    const documents = batch.map(
      (doc) => new Document({ pageContent: doc.text, metadata: doc.metadata })
    );

    // Add documents to vector store
    await vectorStore.addDocuments(documents);
  }

  console.log("Data upload to Supabase complete!");
}

createNewVectorStore().catch(console.error);