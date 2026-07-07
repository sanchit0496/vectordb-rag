import ollama from 'ollama';

export async function generateAnswer(query, contextChunks) {
    // 1. Short-circuit if Qdrant found nothing
    if (!contextChunks || contextChunks.length === 0) {
        return "I couldn't find any relevant information in the knowledge base to answer this.";
    }

    // 2. XML Framing for Context to prevent prompt injection/hallucinations
    const contextText = contextChunks
        .map((chunk, i) => `<document index="${i + 1}" source="${chunk.source}">\n${chunk.content}\n</document>`)
        .join('\n\n');

    const systemPrompt = `
    You are an expert engineering assistant.
    
    CRITICAL INSTRUCTIONS:
    1. Answer the user's question using ONLY the information found inside the <context> tags below.
    2. If the answer is not explicitly contained in the <context>, reply strictly with: "I cannot find the answer in the provided knowledge base." Do not invent or guess.
    3. Always cite your sources at the end of relevant sentences using the source attribute, e.g., (Source: api-docs.md).
    
    <context>
    ${contextText}
    </context>
    `;

    try {
        console.log(`[LLM] Requesting local completion from Llama 3.1 grounded on ${contextChunks.length} documents...`);
        
        // 3. Hit the local Ollama API
        const response = await ollama.generate({
            model: 'llama3.1',
            prompt: query,
            system: systemPrompt,
            options: {
                temperature: 0, // 0 = zero creativity, strictly deterministic
                top_p: 0.1
            }
        });
        
        return response.response;
        
    } catch (error) {
        console.error(`\n[LLM] Local API Error: ${error.message}`);
        return "System Error: Failed to generate an answer locally.";
    }
}