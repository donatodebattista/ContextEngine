import { ingestText } from "../services/document.service.js";

export const uploadDocument = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const result = await ingestText(text);

        res.json({
            message: "Document processed",
            ...result
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};