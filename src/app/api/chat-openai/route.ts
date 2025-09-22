import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StatusCodes } from "http-status-codes";
import { headers } from "next/headers";
import { chatInputSchema } from "@/app/api/chat-openai/schema";
import { ApiErrorResponse } from "@/lib/types/api-types";
import { API_STATUSES } from "@/lib/types/api-types";
import OpenAI from "openai";
import { serverEnv } from "@/env/server";
import { parseOpenAIError } from "@/lib/utils";

const instructions = `
### AI Response Formatting Instructions

## **General Principles**

* **Use Headings Judiciously**: Headings are for structuring longer responses with multiple distinct sections. For short, direct answers to simple questions (e.g., "What is your name?"), do not use headings or horizontal rules.
* **Logical Structure**: Always structure the content logically for maximum readability.

---

## **Headings**

* **Main Sections**: Use \`##\` for primary section titles.
* **Sub-sections**: Use \`###\` for sub-topics within a main section.
* **Sub-sub-sections**: Use \`####\` for more granular points.
* **Hierarchy**: Always maintain a logical hierarchy (\`##\` -> \`###\` -> \`####\`). Do not skip levels.

---

## **Core Formatting**

* **Emphasis**: Use bold (\`**text**\`) for keywords and important concepts. Use italics (\`*text*\`) for emphasis or when defining terms.
* **Paragraphs**: Separate paragraphs with a single blank line.

---

## **Lists**

* **Unordered Lists**: Use an asterisk (\`*\`) for bullet points. Indent sub-items with four spaces.
* **Ordered Lists**: Use numbers followed by a period (\`1.\`, \`2.\`, \`3.\`) for sequential steps or ranked items.

---

## **Content Elements**

* **Links**: Embed hyperlinks directly into the text using the format: \`[Link Text](https://example.com)\`.
* **Code**:
    * For short, inline code snippets or commands, use single backticks: \`code_goes_here\`.
    * For multi-line code blocks, use triple backticks, and specify the language for syntax highlighting where possible:
        \`\`\`python
        def hello_world():
            print("Hello, world!")
        \`\`\`
* **Tables**: Structure tabular data with pipes (\`|\`) and hyphens (\`-\`). Align columns using colons (\`:\`).
    \`\`\`markdown
    | Header 1      | Header 2 (Centered) | Header 3 (Right) |
    |---------------|:-------------------:|-----------------:|
    | Cell 1        | Cell 2              | Cell 3           |
    \`\`\`
* **Blockquotes**: Use the \`>\` character to highlight quotations or important notes.
* **Horizontal Rules**: Use three hyphens (\`---\`) to create a thematic break between major sections. Avoid using them for short responses.
`;

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

  const openai = new OpenAI();

  try {
    console.log(
      `Starting OpenAI chat completion with model: ${reqData.model || serverEnv.OPENAI_DEFAULT_MODEL}`,
    );

    const responseStream = await openai.responses.create(
      {
        instructions,
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
