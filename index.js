import { initCollection, addChunks } from './src/vectorStore.js';
import { ingestDirectory } from './src/ingestor.js';

async function run() {
    console.log('🚀 Booting up Local RAG Engine...');
    
    try {
        // 1. Ensure DB is ready
        await initCollection();

        // 2. Read and chunk local files
        const chunks = ingestDirectory('./knowledge');
        
        if (chunks.length === 0) {
            console.log('⚠️ No chunks found. Add some text files to the knowledge/ directory.');
            return;
        }

        // 3. Generate embeddings and save to DB
        await addChunks(chunks);
        
        console.log('✅ Ingestion pipeline complete! Check the Qdrant dashboard.');
    } catch (error) {
        console.error('❌ Pipeline failed:', error);
        process.exit(1);
    }
}

run();