import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env.js";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

export async function generateAnswer(context, question) {
    const prompt = `
Sos un asistente que responde preguntas SOLO usando el contexto dado.

Contexto:
${context}

Pregunta:
${question}

Respuesta:
`;

    const result = await model.generateContent(prompt);

    return result.response.text();
}