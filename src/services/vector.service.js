import fs from "fs/promises";
import path from "path";

const filePath = path.resolve("data/documents.json");

export async function saveChunks(chunksWithEmbeddings) {
    try {
        const existing = await readData();

        const newData = chunksWithEmbeddings.map((item, index) => ({
            id: Date.now() + index,
            text: item.text,
            embedding: item.embedding
        }));

        const updated = [...existing, ...newData];

        await fs.writeFile(filePath, JSON.stringify(updated, null, 2));

        return newData;

    } catch (error) {
        throw new Error("Error saving chunks: " + error.message);
    }
}

export async function readData() {
    try {
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}