import fs from 'fs';
import path from 'path';

const parsers = {
    '.md': (content) => content, 
    '.js': (content) => content, 
    '.json': (content) => {
        try {
            return JSON.stringify(JSON.parse(content)); 
        } catch (e) {
            console.warn(`[Ingestor] Failed to parse JSON, returning raw text.`);
            return content;
        }
    }
};

// Chunk as per new line
function chunkText(text, maxChunkSize = 1000) {
    // 1. Split the text into logical blocks based on line breaks
    const blocks = text.split(/\n+/); 
    
    const chunks = [];
    let currentChunk = "";

    for (const block of blocks) {
        // If adding the next block pushes us over the limit, save the current chunk and start a new one
        if (currentChunk.length + block.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        
        // Accumulate blocks
        currentChunk += block + "\n"; 
    }
    
    // Push the final leftover chunk
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

export function ingestDirectory(dirPath = './knowledge') {
    console.log(`[Ingestor] Scanning directory: ${dirPath}...`);
    
    if (!fs.existsSync(dirPath)) {
        console.warn(`[Ingestor] Directory ${dirPath} does not exist. Creating it...`);
        fs.mkdirSync(dirPath, { recursive: true });
        return [];
    }

    const files = fs.readdirSync(dirPath);
    const allChunks = [];

    for (const file of files) {
        const ext = path.extname(file);
        const filePath = path.join(dirPath, file);
        
        if (fs.statSync(filePath).isDirectory() || !parsers[ext]) {
            console.log(`[Ingestor] Skipping unsupported file/dir: ${file}`);
            continue;
        }

        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const cleanText = parsers[ext](rawContent);
        
        const textChunks = chunkText(cleanText);

        textChunks.forEach((chunk, index) => {
            allChunks.push({
                source: file,
                chunkIndex: index,
                content: chunk
            });
        });
        
        console.log(`[Ingestor] Parsed ${file} into ${textChunks.length} chunks.`);
    }
    
    return allChunks;
}