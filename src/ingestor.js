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

// Sliding window chunking
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += (chunkSize - overlap);
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