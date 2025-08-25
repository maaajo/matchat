import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StatusCodes } from "http-status-codes";
import { headers } from "next/headers";
import { z } from "zod";
import { messageSchema } from "@/app/api/chat-openai/schema";
import { ApiResponse } from "@/lib/types/api-types";

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
      status: "error",
      timestamp: new Date().toISOString(),
    });
  }

  if (!req.body) {
  }
}
