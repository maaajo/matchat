"use client";

import type { UseStreamMutationReturn } from "@/hooks/use-stream-mutation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type StreamMutationDebugProps = {
  m: UseStreamMutationReturn;
  title?: string;
};

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        value
          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
          : "bg-muted text-muted-foreground border-transparent"
      }
    >
      {String(value)}
    </Badge>
  );
}

export function StreamMutationDebug({
  m,
  title = "useStreamMutation Debug",
}: StreamMutationDebugProps) {
  const errorMessage = m.error
    ? ((m.error as Error)?.message ?? String(m.error))
    : undefined;
  const isStreaming = m.isPending && (m.text?.length ?? 0) > 0;
  const isGeneratingText = isStreaming;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="tracking-wide uppercase">
            {m.status}
          </Badge>
          {m.isPending ? <Badge variant="outline">pending</Badge> : null}
          {m.isSuccess ? <Badge variant="outline">success</Badge> : null}
          {m.isError ? <Badge variant="destructive">error</Badge> : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="error">Error</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-2">
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[11px]">
                  isIdle
                </div>
                <div className="font-mono">
                  <BooleanBadge value={m.isIdle} />
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[11px]">
                  isPending
                </div>
                <div className="font-mono">
                  <BooleanBadge value={m.isPending} />
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[11px]">
                  isSuccess
                </div>
                <div className="font-mono">
                  <BooleanBadge value={m.isSuccess} />
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[11px]">
                  isError
                </div>
                <div className="font-mono">
                  <BooleanBadge value={m.isError} />
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[11px]">
                  isStreaming (derived)
                </div>
                <div className="font-mono">
                  <BooleanBadge value={isStreaming} />
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[11px]">
                  isGeneratingText (derived)
                </div>
                <div className="font-mono">
                  <BooleanBadge value={isGeneratingText} />
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-xs">
                  data.responseId
                </div>
                <code className="bg-muted rounded px-1 py-0.5 text-[12px]">
                  {m.data?.responseId ?? "-"}
                </code>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground mb-1 text-xs">
                  getLastResponseId()
                </div>
                <code className="bg-muted rounded px-1 py-0.5 text-[12px]">
                  {m.getLastResponseId() ?? "-"}
                </code>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variables" className="pt-2">
            <div className="rounded border">
              <div className="text-muted-foreground border-b p-2 text-xs">
                Variables
              </div>
              <ScrollArea className="max-h-56">
                <pre className="bg-muted p-3 text-[11px] whitespace-pre-wrap">
                  {JSON.stringify(m.variables ?? null, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="stream" className="pt-2">
            <div className="rounded border">
              <div className="text-muted-foreground border-b p-2 text-xs">
                Streamed text
              </div>
              <ScrollArea className="max-h-64">
                <pre className="bg-muted p-3 text-[12px] whitespace-pre-wrap">
                  {m.text || ""}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="error" className="pt-2">
            {errorMessage ? (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800">
                <div className="mb-1 text-xs font-semibold">Error</div>
                <pre className="text-[12px] whitespace-pre-wrap">
                  {errorMessage}
                </pre>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">No error</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="text-muted-foreground text-xs">
          Use this panel to inspect the streaming mutation state.
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!m.isPending}
          onClick={() => m.abort()}
        >
          Abort stream
        </Button>
      </CardFooter>
    </Card>
  );
}
