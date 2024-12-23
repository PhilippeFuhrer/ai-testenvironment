import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";

config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function loadAllIndex () {
    const indexes = await pinecone.listIndexes();
    console.log(indexes);
}

loadAllIndex();

async function loadIndex () {
    const indexName = process.env.PINECONE_INDEX_NAME!;
    const index = pinecone.index(indexName);
    console.log(index)
}

loadIndex();