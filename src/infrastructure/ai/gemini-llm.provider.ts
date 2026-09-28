import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateOptions, ILlmProvider } from '../../domain/ports/llm-provider.port.js';
import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';

const DEFAULT_SYSTEM_INSTRUCTION = `Eres un asistente de Inteligencia Artificial experto y riguroso que responde preguntas basándose de forma estricta y exclusiva en el contexto documental proporcionado.

Instrucciones imperativas:
1. Responde con precisión, profesionalismo y concisión usando los fragmentos del contexto.
2. Si la información no está en el contexto o es insuficiente para responder con certeza, indica con honestidad: "No encuentro información suficiente en los documentos provistos para responder a tu pregunta con precisión."
3. No inventes datos, fechas ni hechos no mencionados en los documentos.
4. Cuando sea oportuno, cita explícitamente el documento o fragmento de procedencia.
5. Emplea formato Markdown elegante (listas, negritas, fragmentos de código si aplica).`;

export class GeminiLlmProvider implements ILlmProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey || env.GEMINI_API_KEY);
    this.modelName = modelName || env.LLM_MODEL;
  }

  private buildPrompt(question: string, context: string): string {
    return `--- CONTEXTO RECUPERADO DE LOS DOCUMENTOS ---
${context || 'No se encontró contexto relevante.'}
--- FIN DEL CONTEXTO ---

PREGUNTA DEL USUARIO:
${question}

RESPUESTA:`;
  }

  async generateAnswer(question: string, context: string, options?: GenerateOptions): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: options?.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxOutputTokens ?? 2048,
        },
      });

      const prompt = this.buildPrompt(question, context);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error({ error, question }, 'Error generating text answer with Gemini');
      throw new Error(`LLM Generation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async *generateAnswerStream(
    question: string,
    context: string,
    options?: GenerateOptions
  ): AsyncIterable<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: options?.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxOutputTokens ?? 2048,
        },
      });

      const prompt = this.buildPrompt(question, context);
      const responseStream = await model.generateContentStream(prompt);

      for await (const chunk of responseStream.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      logger.error({ error, question }, 'Error in Gemini streaming generation');
      throw new Error(`LLM Stream error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
