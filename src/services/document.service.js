import { chunkText } from "../utils/chunk.util.js";
import { saveChunks } from "./vector.service.js";
import { generateEmbedding } from "./embedding.service.js";

export async function ingestText(text) {
    const chunks = chunkText(text);

    const chunksWithEmbeddings = [];

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);

        chunksWithEmbeddings.push({
            text: chunk,
            embedding
        });
    }

    const saved = await saveChunks(chunksWithEmbeddings);

    return {
        totalChunks: saved.length
    };
}