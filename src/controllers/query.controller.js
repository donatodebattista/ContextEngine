export const handleQuery = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        // TODO: integrar RAG
        return res.json({
            answer: "Respuesta mock",
            sources: []
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};