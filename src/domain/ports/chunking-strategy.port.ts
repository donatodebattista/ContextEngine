export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface IChunkingStrategy {
  /**
   * Splits a text string into overlapping semantic chunks.
   */
  split(text: string, options?: ChunkingOptions): string[];
}
