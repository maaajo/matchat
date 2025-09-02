import {
  ResponseStreamEvent,
  ResponseCreatedEvent,
  ResponseCompletedEvent,
  ResponseTextDeltaEvent,
} from "openai/resources/responses/responses";

export function parseNDJSONResponse(response: string) {
  const chunks = response.split("\n").filter(line => line.trim().length > 0);
}
