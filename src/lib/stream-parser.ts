import {
  ResponseStreamEvent,
  ResponseCreatedEvent,
  ResponseCompletedEvent,
  ResponseTextDeltaEvent,
} from "openai/resources/responses/responses";

export type ParsedStreamResult = {
  responseId?: string;
  accumulatedText: string;
  isComplete: boolean;
};

export function parseNDJSONResponse(response: string): ParsedStreamResult {
  const lines = response.split("\n").filter(line => line.trim().length > 0);

  let responseId: string | undefined;
  let accumulatedText = "";
  let isComplete = false;

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as ResponseStreamEvent;

      if (isOutputTextDelta(event)) {
        if (event.delta) {
          accumulatedText += event.delta;
        }
      } else if (isResponseCreated(event)) {
        responseId = event.response.id;
      } else if (isResponseCompleted(event)) {
        isComplete = true;
      }
    } catch (error) {
      throw new Error(`Failed to parse JSON line: ${line}. Error: ${error}`);
    }
  }

  return { responseId, accumulatedText, isComplete };
}

export async function parseNDJSONStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: ResponseStreamEvent) => void,
) {
  const decoder = new TextDecoder("utf-8");

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(line => line.trim().length > 0);

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as ResponseStreamEvent;
          onEvent(event);
        } catch (error) {
          throw new Error(
            `Failed to parse JSON line: ${line}. Error: ${error}`,
          );
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function isOutputTextDelta(
  event: ResponseStreamEvent,
): event is ResponseTextDeltaEvent {
  return event.type === "response.output_text.delta";
}

export function isResponseCreated(
  event: ResponseStreamEvent,
): event is ResponseCreatedEvent {
  return event.type === "response.created";
}

export function isResponseCompleted(
  event: ResponseStreamEvent,
): event is ResponseCompletedEvent {
  return event.type === "response.completed";
}
