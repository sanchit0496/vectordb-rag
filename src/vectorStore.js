import { QdrantClient } from '@qdrant/js-client-rest';
import ollama from 'ollama';
import crypto from 'crypto';

const client = new QdrantClient({ host: '127.0.0.1', port: 6333 });

// Fresh collection name with the 768 size for Nomic
const COLLECTION_NAME = 'knowledge_local_2'; 
const VECTOR_SIZE = 768; 

export async function initCollection() {
    try {
        const { collections } = await client.getCollections();
        const exists = collections.some(c => c.name === COLLECTION_NAME);
        
        if (exists) {
            console.log(`[VectorStore] Local collection '${COLLECTION_NAME}' ready.`);
            return;
        }

        console.log(`[VectorStore] Creating fresh local collection: '${COLLECTION_NAME}'...`);
        await client.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,
                distance: 'Cosine',
            },
        });
    } catch (error) {
        console.error('[VectorStore] Qdrant connection failed.');
        throw error;
    }
}

// Hit your local M5 Mac server instead of Google's cloud
async function generateEmbedding(text) {
    const response = await ollama.embeddings({
        model: 'nomic-embed-text',
        prompt: text
    });
    return response.embedding;
}

export async function addChunks(chunks) {
    console.log(`[VectorStore] Generating local embeddings for ${chunks.length} chunks...`);
    
    const points = [];
    for (const chunk of chunks) {
        const vector = await generateEmbedding(chunk.content);
        
        points.push({
            id: crypto.randomUUID(),
            vector: vector,
            payload: {
                source: chunk.source,
                content: chunk.content,
                chunkIndex: chunk.chunkIndex
            }
        });
    }

    console.log(`[VectorStore] Upserting vectors to local Qdrant...`);
    await client.upsert(COLLECTION_NAME, {
        wait: true,
        points: points
    });
    console.log(`[VectorStore] Successfully committed local vectors.`);
}

export async function search(queryText, topK = 3) {
    console.log(`\n[VectorStore] Embedding query locally...`);
    const queryVector = await generateEmbedding(queryText);
    
    const searchResults = await client.search(COLLECTION_NAME, {
        vector: queryVector,
        limit: topK,
        with_payload: true,
    });

    return searchResults.map(result => ({
        source: result.payload.source,
        content: result.payload.content,
        score: result.score
    }));
}