"use client";

import { useStickToBottomContext } from "@/components/stick-to-bottom";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon } from "lucide-react";

export function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  console.log(isAtBottom);

  if (isAtBottom) {
    return null;
  }

  return (
    <Button
      className="bg-background/80 ring-border hover:bg-background text-foreground absolute bottom-1 left-1/2 z-10 -translate-x-1/2 text-xs shadow-md ring-1"
      onClick={() => scrollToBottom()}
    >
      Scroll to bottom
      <ArrowDownIcon />
    </Button>
  );
}
