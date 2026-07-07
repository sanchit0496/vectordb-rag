import fs from 'fs';
import path from 'path';
import officeParser from 'officeparser';
import pdf from 'pdf-parse-debugging-disabled'; // Clean PDF package

const pdfParse = pdf.default || pdf;

// 1. The Enterprise Manifest (Clean and Explicit)
const TARGET_FILES = [
    './knowledge/FrameworkUI.jsx',
    './knowledge/swagger.yml',
    './knowledge/Security_Compliance_Enterprise_2.pdf',
    './knowledge/Backend_Implementation_Enterprise.docx',
    './knowledge/Frontend_Architecture_v2_8_Slides.pptx',
];

function chunkText(text, maxChunkSize = 6000) {
    const blocks = text.split(/\n+/);
    const chunks = [];
    let currentChunk = '';
    for (const block of blocks) {
        if (currentChunk.length + block.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }
        currentChunk += block + '\n';
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
    return chunks;
}

export async function ingestDirectory() {
    console.log(`[Ingestor] Starting Manifest-Driven Ingestion...`);
    const allChunks = [];

    for (const filePath of TARGET_FILES) {
        if (!fs.existsSync(filePath)) {
            console.error(`[Ingestor] ⚠️ File not found, skipping: ${filePath}`);
            continue;
        }

        const ext = path.extname(filePath).toLowerCase();
        let rawText = '';

        try {
            // 2. Streamlined Parsing Logic
            if (
                ['.js', '.jsx', '.ts', '.tsx', '.json', '.yaml', '.yml', '.md', '.txt'].includes(
                    ext
                )
            ) {
                console.log(`[Ingestor] Parsing Code/Text: ${filePath}`);
                rawText = fs.readFileSync(filePath, 'utf-8');
            } else if (ext === '.pptx' || ext === '.docx') {
                console.log(`[Ingestor] Parsing Office doc: ${filePath}`);
                rawText = await officeParser.parseOfficeAsync(filePath);
            } else if (ext === '.pdf') {
                console.log(`[Ingestor] Parsing PDF: ${filePath}`);
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                rawText = pdfData.text;
            } else {
                console.log(`[Ingestor] Skipping unsupported extension: ${ext}`);
                continue;
            }

            // 3. Anchor context and chunk
            const fileContext = `File Location: ${filePath}\n\n`;
            const textChunks = chunkText(fileContext + rawText);

            textChunks.forEach((chunk, index) => {
                allChunks.push({
                    source: filePath,
                    chunkIndex: index,
                    content: chunk,
                });
            });
        } catch (error) {
            console.error(`[Ingestor] ❌ Failed to parse ${filePath}:`, error.message);
        }
    }

    console.log(`[Ingestor] ✅ Generated ${allChunks.length} chunks from the manifest.`);
    return allChunks;
}
