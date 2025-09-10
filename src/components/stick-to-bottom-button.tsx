"use client";

import { useStickToBottomContext } from "@/components/stick-to-bottom";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon } from "lucide-react";

export function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) {
    return null;
  }

  return (
    <Button
      className="bg-background/20 hover:bg-background/20 text-foreground border-input absolute bottom-44 left-1/2 z-[60] -translate-x-1/2 rounded-md border text-xs backdrop-blur-lg hover:backdrop-blur-xl"
      onClick={() => scrollToBottom()}
    >
      Scroll to bottom
      <ArrowDownIcon />
    </Button>
  );
}
