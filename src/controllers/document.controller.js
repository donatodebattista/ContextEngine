export const uploadDocument = async (req, res) => {
    try {
        // TODO: ingestar documento
        return res.json({ message: "Documento recibido (mock)" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};