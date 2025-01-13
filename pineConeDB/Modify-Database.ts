import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import path from "path";

// Load env variables
config({ path: path.resolve(__dirname, "../.env") });

// Debug: Check if env variables are loaded
console.log("API Key loaded:", !!process.env.PINECONE_API_KEY);
console.log("Index Name loaded:", !!process.env.PINECONE_INDEX_NAME);

// Initialize Pinecone with error handling
let pinecone: Pinecone;
try {
    if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY is not defined in environment variables");
    }
    
    pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    });
} catch (error) {
    console.error("Error initializing Pinecone:", error);
    process.exit(1);
}

async function loadAllIndex() {
    try {
        const indexes = await pinecone.listIndexes();
        console.log("Indexes:", indexes);
    } catch (error) {
        console.error("Error listing indexes:", error);
    }
}

async function loadIndex() {
    try {
        const indexName = process.env.PINECONE_INDEX_NAME;
        if (!indexName) {
            throw new Error("PINECONE_INDEX_NAME is not defined in environment variables");
        }
        
        const index = pinecone.index(indexName);
        console.log("Index:", index);
    } catch (error) {
        console.error("Error loading index:", error);
    }
}

// Execute functions
loadAllIndex();
loadIndex();