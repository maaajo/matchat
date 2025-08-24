import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StatusCodes } from "http-status-codes";
import { headers } from "next/headers";

export default async function POST(req: NextRequest) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: StatusCodes.UNAUTHORIZED },
    );
  }
}
