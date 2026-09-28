export interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

export interface ILlmProvider {
  /**
   * Generates a complete answer synchronously based on user question and retrieved context.
   */
  generateAnswer(question: string, context: string, options?: GenerateOptions): Promise<string>;

  /**
   * Streams token by token in real-time as an AsyncIterable.
   */
  generateAnswerStream(
    question: string,
    context: string,
    options?: GenerateOptions
  ): AsyncIterable<string>;
}
