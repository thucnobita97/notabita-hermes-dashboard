"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DiffViewerProps {
  diff: string
  loading: boolean
}

function parseDiffLine(line: string): { type: "add" | "remove" | "hunk" | "context"; content: string } {
  if (line.startsWith("+")) return { type: "add", content: line }
  if (line.startsWith("-")) return { type: "remove", content: line }
  if (line.startsWith("@@")) return { type: "hunk", content: line }
  return { type: "context", content: line }
}

const lineStyles: Record<string, string> = {
  add: "bg-green-500/15 text-green-400 border-l-2 border-green-500",
  remove: "bg-red-500/15 text-red-400 border-l-2 border-red-500",
  hunk: "bg-blue-500/15 text-blue-400 border-l-2 border-blue-500 font-semibold",
  context: "text-zinc-400 border-l-2 border-transparent",
}

export function DiffViewer({ diff, loading }: DiffViewerProps) {
  if (loading) {
    return (
      <div className="rounded-lg bg-[#0d1117] p-4 space-y-2">
        <Skeleton className="h-4 w-full bg-zinc-800" />
        <Skeleton className="h-4 w-3/4 bg-zinc-800" />
        <Skeleton className="h-4 w-5/6 bg-zinc-800" />
        <Skeleton className="h-4 w-2/3 bg-zinc-800" />
        <Skeleton className="h-4 w-full bg-zinc-800" />
      </div>
    )
  }

  if (!diff) {
    return (
      <div className="rounded-lg bg-[#0d1117] p-4 text-zinc-500 text-sm text-center">
        No diff available
      </div>
    )
  }

  const lines = diff.split("\n")

  return (
    <ScrollArea className="max-h-[500px] rounded-lg bg-[#0d1117] border border-zinc-800">
      <pre className="p-0 text-xs leading-relaxed font-mono">
        {lines.map((line, i) => {
          const parsed = parseDiffLine(line)
          return (
            <div
              key={i}
              className={`flex ${lineStyles[parsed.type]}`}
            >
              <span className="select-none w-10 shrink-0 text-right pr-3 text-zinc-600 border-r border-zinc-800/50">
                {i + 1}
              </span>
              <span className="pl-3 pr-4 whitespace-pre-wrap break-all">
                {parsed.content || " "}
              </span>
            </div>
          )
        })}
      </pre>
    </ScrollArea>
  )
}
