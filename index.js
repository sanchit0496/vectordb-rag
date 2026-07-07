import { initCollection, addChunks, search } from './src/vectorStore.js';
import { ingestDirectory } from './src/ingestor.js';

async function run() {
    console.log('🚀 Booting up Local RAG Engine...');
    
    try {
        // 1. Ensure DB is ready
        await initCollection();

        const testQuery = "React JS Best Practices"; // Change this to match something in your test.md
    console.log(`\nTesting search with query: "${testQuery}"`);

    // 3. Run the search
    const results = await search(testQuery);

    // 4. Print the results clearly
    console.log("\n--- TOP MATCHES FROM QDRANT ---");
    results.forEach((res, index) => {
        console.log(`\nMatch ${index + 1} | Score: ${res.score}`);
        console.log(`Source: ${res.source}`);
        console.log(`Content: ${res.content}`);
    });

        // // 2. Read and chunk local files
        // const chunks = ingestDirectory('./knowledge');
        
        // if (chunks.length === 0) {
        //     console.log('⚠️ No chunks found. Add some text files to the knowledge/ directory.');
        //     return;
        // }

        // // 3. Generate embeddings and save to DB
        // await addChunks(chunks);
        
        console.log('✅ Ingestion pipeline complete! Check the Qdrant dashboard.');
    } catch (error) {
        console.error('❌ Pipeline failed:', error);
        process.exit(1);
    }
}

run();