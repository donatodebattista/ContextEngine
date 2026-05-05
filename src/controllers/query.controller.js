import { queryDocuments } from "../services/rag.service.js";

export const handleQuery = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        const results = await queryDocuments(question);

        res.json({
            answer: results.answer,
            sources: results.sources
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};