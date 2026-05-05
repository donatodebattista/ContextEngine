import { chunkText } from "../utils/chunk.util.js";
import { saveChunks } from "./vector.service.js";

export async function ingestText(text) {
    const chunks = chunkText(text);

    const saved = await saveChunks(chunks);

    return {
        totalChunks: saved.length
    };
}