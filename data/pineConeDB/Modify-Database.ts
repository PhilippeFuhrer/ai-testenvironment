import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import { query } from "express";
import path from "path";

// Load env variables
config({ path: path.resolve(__dirname, "../../.env") });

// Initialize Pinecone with error handling
let pinecone: Pinecone;
try {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not defined in environment variables");
  }

  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
} catch (error) {
  console.error("Error initializing Pinecone:", error);
  process.exit(1);
}

//load all Indexes
async function loadAllIndex() {
  try {
    const indexes = await pinecone.listIndexes();
    console.log("Indexes:", indexes);
  } catch (error) {
    console.error("Error listing indexes:", error);
  }
}

//load an Index
async function loadIndex() {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME_DRUPAL_AND_COURSES;
    if (!indexName) {
      throw new Error(
        "PINECONE_INDEX_NAME is not defined in environment variables"
      );
    }

    const index = pinecone.index(indexName);
    console.log("Index:", index);
  } catch (error) {
    console.error("Error loading index:", error);
  }
}

// delete records by ID
async function deleteRecordsById(targetId: string) {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME_DRUPAL_AND_COURSES;
    if (!indexName) {
      throw new Error(
        "PINECONE_INDEX_NAME is not defined in environment variables"
      );
    }

    const index = pinecone.index(indexName);

    // Delete all vectors with the matching ID
    await index.deleteOne(targetId);

    console.log(`Successfully deleted all records with ID: ${targetId}`);
  } catch (error) {
    console.error("Error deleting records:", error);
    throw error;
  }
}

//delete records by metadata
async function queryAndDeleteBySource(targetSource: string) {
    try {
      const indexName = process.env.PINECONE_INDEX_NAME_DRUPAL_AND_COURSES;
      if (!indexName) {
        throw new Error("PINECONE_INDEX_NAME is not defined in environment variables");
      }
  
      const index = pinecone.index(indexName);
  
      // Create a dummy vector (e.g., all zeros or a random vector) to use in the query
      const queryVector = new Array(1536).fill(0); // Adjust the size to your vector dimension (e.g., 1536)
  
      // Query to fetch vectors with the specific metadata key-value pair: source = targetSource
      const queryResults = await index.query({
        vector: queryVector, // Provide the dummy vector
        filter: { source: targetSource }, // Apply the metadata filter
        topK: 1000, // Number of results to return (adjust as necessary)
        includeMetadata: true, // Include metadata in the results
        includeValues: false, // Do not include the vector values, only metadata
      });
  
      // If there are results, log them and delete the matching records
      if (queryResults.matches && queryResults.matches.length > 0) {
        console.log(`Found ${queryResults.matches.length} vectors with source: ${targetSource}`);
        
        // Extract the vector IDs to delete
        const vectorIds = queryResults.matches.map(match => match.id);
        
        // Delete the matching records by their vector IDs
        await index.deleteMany(vectorIds);
        console.log("All records with the specified metadata have been deleted.");
      } else {
        console.log(`No vectors found with source: ${targetSource}`);
      }
    } catch (error) {
      console.error("Error querying and deleting vectors:", error);
    }
  }

//fetch specific data
async function fetchData(targetFetch: string) {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME_DRUPAL_AND_COURSES;
    if (!indexName) {
      throw new Error();
    }
    const index = pinecone.index(indexName);
    const fetchResult = await index.fetch([targetFetch]);
    console.log(fetchResult.records);
  } catch (error) {
    console.error(error);
  }
}

// Execute functions (npx tsx Modify-Database.ts)
queryAndDeleteBySource("test-001");
