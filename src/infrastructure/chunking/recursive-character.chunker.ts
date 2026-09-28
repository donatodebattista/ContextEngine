import { ChunkingOptions, IChunkingStrategy } from '../../domain/ports/chunking-strategy.port.js';
import { env } from '../../config/env.js';

export class RecursiveCharacterChunker implements IChunkingStrategy {
  private separators: string[];

  constructor(separators: string[] = ['\n\n', '\n', '. ', '; ', ', ', ' ', '']) {
    this.separators = separators;
  }

  split(text: string, options?: ChunkingOptions): string[] {
    const chunkSize = options?.chunkSize ?? env.CHUNK_SIZE;
    const chunkOverlap = options?.chunkOverlap ?? env.CHUNK_OVERLAP;

    if (!text || text.trim().length === 0) {
      return [];
    }

    if (text.length <= chunkSize) {
      return [text.trim()];
    }

    return this.splitText(text, this.separators, chunkSize, chunkOverlap);
  }

  private splitText(
    text: string,
    separators: string[],
    chunkSize: number,
    chunkOverlap: number
  ): string[] {
    const finalChunks: string[] = [];
    let separator = separators[separators.length - 1];
    let newSeparators: string[] = [];

    // Find the highest-priority separator present in this text
    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === '' || text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = separator ? text.split(separator) : Array.from(text);
    const goodSplits: string[] = [];

    for (const s of splits) {
      if (s.length < chunkSize) {
        goodSplits.push(s);
      } else {
        if (goodSplits.length > 0) {
          const merged = this.mergeSplits(goodSplits, separator, chunkSize, chunkOverlap);
          finalChunks.push(...merged);
          goodSplits.length = 0;
        }
        if (newSeparators.length === 0) {
          finalChunks.push(s);
        } else {
          const otherInfo = this.splitText(s, newSeparators, chunkSize, chunkOverlap);
          finalChunks.push(...otherInfo);
        }
      }
    }

    if (goodSplits.length > 0) {
      const merged = this.mergeSplits(goodSplits, separator, chunkSize, chunkOverlap);
      finalChunks.push(...merged);
    }

    return finalChunks.filter((c) => c.trim().length > 0);
  }

  private mergeSplits(
    splits: string[],
    separator: string,
    chunkSize: number,
    chunkOverlap: number
  ): string[] {
    const docs: string[] = [];
    const currentDoc: string[] = [];
    let total = 0;

    for (const piece of splits) {
      const pieceLen = piece.length + (currentDoc.length > 0 ? separator.length : 0);
      if (total + pieceLen > chunkSize && currentDoc.length > 0) {
        const doc = currentDoc.join(separator).trim();
        if (doc.length > 0) {
          docs.push(doc);
        }

        // Keep overlapping elements
        while (
          total > chunkOverlap ||
          (total + pieceLen > chunkSize && total > 0)
        ) {
          const popped = currentDoc.shift();
          if (!popped) break;
          total -= popped.length + (currentDoc.length > 0 ? separator.length : 0);
        }
      }

      currentDoc.push(piece);
      total += pieceLen;
    }

    if (currentDoc.length > 0) {
      const doc = currentDoc.join(separator).trim();
      if (doc.length > 0) {
        docs.push(doc);
      }
    }

    return docs;
  }
}
