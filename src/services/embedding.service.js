import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { ENV } from "../config/env.js";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

export async function generateEmbedding(text, isQuery = false) {
    try {
        const result = await model.embedContent({
            content: { parts: [{ text }] },
            taskType: isQuery
                ? TaskType.RETRIEVAL_QUERY
                : TaskType.RETRIEVAL_DOCUMENT,
            title: isQuery ? undefined : "Documento de mi RAG",
        });

        return result.embedding.values;

    } catch (error) {
        throw new Error("Error generating embedding: " + error.message);
    }
}