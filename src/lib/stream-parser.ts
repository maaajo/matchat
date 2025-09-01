type SSEFrame = {
  rawText: string;
};

export class SSEParser {
  private buffer = "";
  private decoder = new TextDecoder("utf-8");
  private static readonly MAX_BUFFER_SIZE = 1024 * 1024;

  private parseFrame(frameText: string) {
    try {
      if (!frameText || typeof frameText !== "string") {
        return null;
      }

      return { rawText: frameText } as SSEFrame;
    } catch (error) {
      console.warn(
        "Malformed SSE frame: skipping: ",
        frameText.substring(0, 100),
        error,
      );
      return null;
    }
  }

  parseChunk(chunk: Uint8Array) {
    const decodedText = this.decoder.decode(chunk, { stream: true });

    if (this.buffer.length + decodedText.length > SSEParser.MAX_BUFFER_SIZE) {
      throw new Error(
        `SSE buffer overflow: exceeds ${SSEParser.MAX_BUFFER_SIZE} bytes`,
      );
    }

    this.buffer += decodedText;

    const frames: SSEFrame[] = [];
    const frameDelimiters = /\r?\n\r?\n/;

    const parts = this.buffer.split(frameDelimiters);

    const lastPart = parts.pop();
    this.buffer = lastPart !== undefined ? lastPart : "";

    for (const framePart of parts) {
      if (framePart.trim()) {
        const frame = this.parseFrame(framePart);
        if (frame) {
          frames.push();
        }
      }
    }

    return frames;
  }

  flush() {
    if (this.buffer.trim()) {
      const frame = this.parseFrame(this.buffer);
      this.buffer = "";
      return frame ? [frame] : [];
    }

    return [];
  }

  getBufferSize() {
    return this.buffer.length;
  }

  clearBuffer() {
    this.buffer = "";
  }
}
