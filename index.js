import { initCollection, addChunks, search } from './src/vectorStore.js';
import { ingestDirectory } from './src/ingestor.js';
import { generateAnswer } from './src/llm.js';

async function run() {
    await initCollection();

    const args = process.argv.slice(2);
    const command = args[0];

    // Inside your 'ingest' block in index.js:
    if (command === 'ingest') {
        console.log('\n Starting enterprise ingestion pipeline...');

        // Changed this line to take no arguments
        const chunks = await ingestDirectory();

        if (chunks.length > 0) {
            await addChunks(chunks);
            console.log('\n All documents embedded and ingested successfully! Ready for querying.');
        } else {
            console.log('\n No valid files found from the manifest.');
        }
    } else if (command === 'ask') {
        const query = args.slice(1).join(' ');
        if (!query) {
            console.log('Please provide a question: node src/index.js ask "What is React?"');
            return;
        }

        console.log(`\n Question: "${query}"`);

        // 1. Retrieve the clean data
        const relevantChunks = await search(query, 30);

        // 2. Generate the answer
        const answer = await generateAnswer(query, relevantChunks);

        console.log('\n================ ANSWER ================');
        console.log(answer);
        console.log('========================================\n');
    } else {
        console.log('\nUsage:');
        console.log('  node src/index.js ingest');
        console.log('  node src/index.js ask "your question here"');
    }
}

run();
