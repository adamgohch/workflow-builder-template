"use client";
// Adapted from Vercel's ActionNode: Zorel supplies step metadata instead of
// the upstream plugin/integration/model stores. The upstream Node/Card is retained.
import type { NodeProps } from "@xyflow/react";
import {
  Check,
  ClipboardCheck,
  FileText,
  GitBranch,
  Search,
  Zap,
} from "lucide-react";
import { memo } from "react";
import {
  Node,
  NodeDescription,
  NodeTitle,
} from "@/components/ai-elements/node";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-store";
export const ActionNode = memo(
  ({ data, selected, id }: NodeProps & { data: WorkflowNodeData }) => {
    const kind = data.config?.actionType;
    const Icon =
      kind === "Human review"
        ? ClipboardCheck
        : kind === "Decide a path"
          ? GitBranch
          : kind === "Investigate"
            ? Search
            : kind === "Produce work"
              ? FileText
              : Zap;
    return (
      <Node
        className={cn(
          "relative flex h-48 w-48 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
          selected && "border-primary",
        )}
        data-testid={`action-node-${id}`}
        handles={{ target: true, source: kind !== "Finish" }}
        status={data.status}
      >
        {data.status === "success" && (
          <div className="absolute top-2 right-2 rounded-full bg-green-600 p-1">
            <Check className="size-3.5 text-white" />
          </div>
        )}
        <div className="flex flex-col items-center justify-center gap-3 p-6">
          <Icon className="size-10 text-primary" strokeWidth={1.5} />
          <div className="flex flex-col items-center gap-1 text-center">
            <NodeTitle className="text-base">{data.label}</NodeTitle>
            <NodeDescription className="text-xs">
              {data.description}
            </NodeDescription>
          </div>
        </div>
      </Node>
    );
  },
);
ActionNode.displayName = "ActionNode";
