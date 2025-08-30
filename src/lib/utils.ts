import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { StatusCodes } from "http-status-codes";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts, initials } from "@dicebear/collection";

export const AVATAR_VARIANTS = {
  INITIALS: "initials",
  BOTTTS: "bottts",
  AVATAAARS: "avataaars",
} as const;

type GenerateAvatarUriProps = {
  variant: (typeof AVATAR_VARIANTS)[keyof typeof AVATAR_VARIANTS];
  seed: string;
};

export const generateAvatar = ({
  variant = AVATAR_VARIANTS.INITIALS,
  seed,
}: GenerateAvatarUriProps) => {
  if (variant === AVATAR_VARIANTS.INITIALS) {
    return createAvatar(initials, {
      seed,
    });
  }

  if (variant === AVATAR_VARIANTS.BOTTTS) {
    return createAvatar(bottts, {
      seed,
    });
  }

  if (variant === AVATAR_VARIANTS.AVATAAARS) {
    return createAvatar(avataaars, {
      seed,
    });
  }

  return createAvatar(initials, {
    seed,
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractStatusCodeFromOpenAiErrorMessage(message: string): {
  statusCode?: number;
  cleanMessage: string;
} {
  const parts = message.split(" ");
  const firstPart = parts[0];

  if (firstPart && /^\d{3}$/.test(firstPart)) {
    const statusCode = parseInt(firstPart, 10);
    if (statusCode >= 100 && statusCode < 600) {
      const cleanMessage = parts.slice(1).join(" ");
      return { statusCode, cleanMessage };
    }
  }

  return { cleanMessage: message };
}

export function parseOpenAIError(error: Error): {
  errorCode: number;
  errorMessage: string;
} {
  const message = error.message;

  const { statusCode, cleanMessage } =
    extractStatusCodeFromOpenAiErrorMessage(message);

  if (statusCode) {
    return { errorCode: statusCode, errorMessage: cleanMessage };
  }

  const errorMappings = {
    rate_limit: {
      code: 429,
      message: "Rate limit exceeded. Please try again later.",
    },
    quota_exceeded: {
      code: 402,
      message: "Quota exceeded. Please check your OpenAI account.",
    },
    invalid_api_key: {
      code: StatusCodes.UNAUTHORIZED,
      message: "Invalid API configuration.",
    },
    model_not_found: {
      code: StatusCodes.BAD_REQUEST,
      message: "Specified model not found or not available.",
    },
    context_length_exceeded: {
      code: StatusCodes.BAD_REQUEST,
      message: "Context length exceeded. Please reduce input size.",
    },
    "organization must be verified": {
      code: 403,
      message:
        "Your organization must be verified to use this model. Please contact your administrator.",
    },
  };

  const matchedError = Object.keys(errorMappings).find(key =>
    cleanMessage.includes(key),
  );

  if (matchedError) {
    const { code, message: errorMsg } =
      errorMappings[matchedError as keyof typeof errorMappings];
    return { errorCode: code, errorMessage: errorMsg };
  }

  return {
    errorCode: StatusCodes.INTERNAL_SERVER_ERROR,
    errorMessage: cleanMessage || "Unknown error occurred",
  };
}
