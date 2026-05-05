import { generateEmbedding } from "./embedding.service.js";
import { searchSimilar } from "./vector.service.js";
import { generateAnswer } from "./llm.service.js";

export async function queryDocuments(question) {
    const queryEmbedding = await generateEmbedding(question, true);

    const results = await searchSimilar(queryEmbedding, 3);

    const context = results.map(r => r.text).join("\n\n");

    const answer = await generateAnswer(context, question);

    return {
        answer,
        sources: results
    };
}