import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto'; // Needed for unique Qdrant IDs
import dotenv from 'dotenv';

dotenv.config();

const client = new QdrantClient({ host: '127.0.0.1', port: 6333 });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const COLLECTION_NAME = 'knowledge_base'; 
const VECTOR_SIZE = 3072;

export async function initCollection() {
    try {
        const { collections } = await client.getCollections();
        const exists = collections.some(c => c.name === COLLECTION_NAME);
        
        if (exists) {
            console.log(`[VectorStore] Collection '${COLLECTION_NAME}' ready.`);
            return;
        }

        console.log(`[VectorStore] Creating new collection: '${COLLECTION_NAME}'...`);
        await client.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,
                distance: 'Cosine',
            },
        });
    } catch (error) {
        console.error('[VectorStore] Connection failed.');
        throw error;
    }
}

// 1. Ask Gemini to turn our text chunk into a vector
async function generateEmbedding(text) {
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
    });
    // The SDK returns an array of embeddings, we just need the values from the first one
    return response.embeddings[0].values;
}

// 2. Loop through our chunks, embed them, and push to Qdrant
export async function addChunks(chunks) {
    console.log(`[VectorStore] Generating embeddings for ${chunks.length} chunks...`);
    
    const points = [];
    for (const chunk of chunks) {
        const vector = await generateEmbedding(chunk.content);
        
        points.push({
            id: crypto.randomUUID(), 
            vector: vector,
            payload: {               // The metadata we get back during a search
                source: chunk.source,
                content: chunk.content,
                chunkIndex: chunk.chunkIndex
            }
        });
    }

    console.log(`[VectorStore] Upserting vectors to Qdrant...`);
    await client.upsert(COLLECTION_NAME, {
        wait: true, // Block execution until Qdrant confirms the write is saved to disk
        points: points
    });
    
    console.log(`[VectorStore] Successfully committed vectors to Qdrant.`);
}