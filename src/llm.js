import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAnswer(query, contextChunks) {
    // Format the chunks so the LLM clearly sees the boundaries and filenames
    const contextText = contextChunks
        .map(chunk => `[Source: ${chunk.source}]\n${chunk.content}`)
        .join('\n\n---\n\n');

    const systemInstruction = `
    You are an expert engineering assistant. 
    
    Rules:
    1. Answer the user's question using ONLY the provided context.
    2. If the context does not contain the answer, strictly reply: "I cannot find the answer in the provided knowledge base."
    3. Always cite the [Source: filename] you used to answer the question.

    CONTEXT:
    ${contextText}
    `;

    console.log(`[LLM] Generating grounded response...`);
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: query,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0, // Deterministic mode to prevent hallucinations
        }
    });
    
    return response.text;
}