export function chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSize;

        // evitar cortar palabras
        if (end < text.length) {
            const lastSpace = text.lastIndexOf(" ", end);
            if (lastSpace > start) {
                end = lastSpace;
            }
        }

        const chunk = text.slice(start, end).trim();
        chunks.push(chunk);

        start += chunkSize - overlap;
    }

    return chunks;
}