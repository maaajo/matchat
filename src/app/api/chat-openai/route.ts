import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StatusCodes } from "http-status-codes";
import { headers } from "next/headers";
import { z } from "zod";
import { chatInputSchema, ChatInput } from "@/app/api/chat-openai/schema";
import { ApiResponse } from "@/lib/types/api-types";
import { API_STATUSES } from "@/lib/types/api-types";

export default async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<any>>> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return NextResponse.json({
      errorCode: StatusCodes.UNAUTHORIZED,
      errorMessage: "Unauthorized",
      status: API_STATUSES.ERROR,
      timestamp: new Date().toISOString(),
    });
  }

  if (!req.body) {
    return NextResponse.json({
      errorCode: StatusCodes.BAD_REQUEST,
      errorMessage: "Missing body",
      status: API_STATUSES.ERROR,
      timestamp: new Date().toISOString(),
    });
  }

  const parseResult = await chatInputSchema.safeParseAsync(req.body);

  if (!parseResult.success) {
    return NextResponse.json({
      errorCode: StatusCodes.BAD_REQUEST,
      errorMessage: parseResult.error.toString(),
      status: API_STATUSES.ERROR,
      timestamp: new Date().toISOString(),
    });
  }

  // Successfully parsed request body as ChatInput schema
  const parsedData: ChatInput = parseResult.data;
}
