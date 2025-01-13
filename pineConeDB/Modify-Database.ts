import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import path from "path";

// Load env variables
config({ path: path.resolve(__dirname, "../.env") });


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
        const indexName = process.env.PINECONE_INDEX_NAME_DRUPAL_AND_COURSES;
        if (!indexName) {
            throw new Error("PINECONE_INDEX_NAME is not defined in environment variables");
        }
        
        const index = pinecone.index(indexName);
        console.log("Index:", index);
    } catch (error) {
        console.error("Error loading index:", error);
    }
}

async function deleteRecordsById(targetId: string) {
    try {
        const indexName = process.env.PINECONE_INDEX_NAME_DRUPAL_AND_COURSES;
        if (!indexName) {
            throw new Error("PINECONE_INDEX_NAME is not defined in environment variables");
        }
        
        const index = pinecone.index(indexName);
        
        // Delete all vectors with the matching ID
        await index.deleteOne(targetId);
        
        console.log(`Successfully deleted all records with ID: ${targetId}`);
    } catch (error) {
        console.error("Error deleting records:", error);
        throw error; // Re-throw the error for handling by the caller if needed
    }
}

// Execute functions
loadAllIndex();
loadIndex();
deleteRecordsById("3aff65ce-463b-4760-a223-7bfefcab1ae2");