import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StatusCodes } from "http-status-codes";
import { headers } from "next/headers";
import { ChatInput, chatInputSchema } from "@/app/api/chat-openai/schema";
import { ApiErrorResponse } from "@/lib/types/api-types";
import { API_STATUSES } from "@/lib/types/api-types";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { serverEnv } from "@/env/server";
import { parseOpenAIError } from "@/lib/utils";
import { z } from "zod";
import { generateChatTitlePrompt } from "@/modules/chat/lib/ai/prompts";

const generateChatTitle = async (input: ChatInput["input"]) => {
  const Output = z.object({
    title: z.string(),
  });

  const openai = new OpenAI();

  const response = await openai.responses.parse({
    instructions: generateChatTitlePrompt,
    model: "gpt-5-nano",
    input,
    text: {
      format: zodTextFormat(Output, "title"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("Chat Title was not generated", {
      cause: "Generate Title Issue",
    });
  }

  return response.output_parsed.title;
};

export async function POST(
  req: NextRequest,
): Promise<Response | NextResponse<ApiErrorResponse>> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    console.error(`Authentication failed for user`);
    return NextResponse.json(
      {
        errorCode: StatusCodes.UNAUTHORIZED,
        errorMessage: "Unauthorized",
        status: API_STATUSES.ERROR,
        timestamp: new Date().toISOString(),
      },
      { status: StatusCodes.UNAUTHORIZED },
    );
  }

  if (!req.body) {
    console.error(`Missing request body`);
    return NextResponse.json(
      {
        errorCode: StatusCodes.BAD_REQUEST,
        errorMessage: "Missing body",
        status: API_STATUSES.ERROR,
        timestamp: new Date().toISOString(),
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const reqBody = await req.json();

  const parseReqBody = await chatInputSchema.safeParseAsync(reqBody);

  if (!parseReqBody.success) {
    console.error(`Validation failed:`, parseReqBody.error.toString());
    return NextResponse.json(
      {
        errorCode: StatusCodes.BAD_REQUEST,
        errorMessage: parseReqBody.error.toString(),
        status: API_STATUSES.ERROR,
        timestamp: new Date().toISOString(),
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const reqData = parseReqBody.data;

  if (!reqData.previous_response_id) {
    const title = await generateChatTitle(reqData.input);
    console.log(title);
  }

  const openai = new OpenAI();

  try {
    console.log(
      `Starting OpenAI chat completion with model: ${reqData.model || serverEnv.OPENAI_DEFAULT_MODEL}`,
    );

    const responseStream = await openai.responses.create(
      {
        model: serverEnv.OPENAI_DEFAULT_MODEL,
        stream: true,
        ...reqData,
      },
      {
        signal: req.signal,
      },
    );

    return new Response(responseStream.toReadableStream(), {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(`OpenAI API error:`, error);

    const { errorCode, errorMessage } =
      error instanceof Error
        ? parseOpenAIError(error)
        : {
            errorCode: StatusCodes.INTERNAL_SERVER_ERROR,
            errorMessage: "Unknown error occurred",
          };

    return NextResponse.json(
      {
        errorCode,
        errorMessage,
        status: API_STATUSES.ERROR,
        timestamp: new Date().toISOString(),
      },
      { status: errorCode },
    );
  }
}
