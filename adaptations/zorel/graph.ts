import type { Edge, Node } from "@xyflow/react";
import type { WorkflowNodeData } from "./lib/workflow-store";
export type Step = {
  id: string;
  type: string;
  label: string;
  executor: string;
  role: string;
  instructions: string;
  inputs: string;
  result: string;
  criteria: string;
  review: string;
  nextStepId: string | null;
  branches: Record<string, string>;
};
export type Definition = {
  startStepId: string;
  steps: Step[];
  methodGuidance: string;
};
export type Workflow = {
  starter?: boolean;
  id: string;
  name: string;
  purpose: string;
  draftRevision: number;
  definition: Definition;
};
export type Run = {
  id: string;
  workflowId: string;
  draftRevision: number;
  runRevision: number;
  definition: Definition;
  status: string;
  execution: string;
  activeStepId: string | null;
  createdAt: string;
  inputs: {
    label: string;
    sources: { id: string; name: string; revision?: number }[];
  };
  steps: Record<
    string,
    {
      status: string;
      result: string | null;
      gaps?: string | null;
      outcome?: string | null;
    }
  >;
  reviews: { stepId: string; judgment: string; ownerDisplayName: string }[];
  outputs: { stepId: string; label: string; text: string }[];
};
export function workflowGraph(
  definition: Definition,
  run: Run | null,
  selected: string,
) {
  const ids = new Set(definition.steps.map((step) => step.id));
  const edges: Edge[] = [];
  for (const step of definition.steps) {
    const targets =
      step.type === "Decide a path"
        ? Object.entries(step.branches)
        : step.nextStepId
          ? [["next", step.nextStepId]]
          : [];
    for (const [port, target] of targets) {
      if (!ids.has(target)) continue;
      const outcome = run?.steps[step.id]?.outcome;
      const taken = outcome
        ? outcome === port
        : run?.steps[step.id]?.status === "completed";
      edges.push({
        id: `${step.id}:${port}:${target}`,
        source: step.id,
        target,
        type: "smoothstep",
        label: port === "next" ? undefined : port,
        style: {
          stroke: taken ? "#087766" : "#82969d",
          strokeWidth: taken ? 3 : 1.5,
          opacity: outcome && !taken ? 0.35 : 1,
        },
        labelStyle: { fontSize: 12, fill: "#25454e" },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
      });
    }
  }
  // Breadth-first depth preserves branches and return edges without looping.
  const depth = new Map<string, number>([[definition.startStepId, 0]]);
  const queue = [definition.startStepId];
  for (let index = 0; index < queue.length; index++)
    for (const edge of edges.filter((e) => e.source === queue[index])) {
      if (!depth.has(edge.target)) {
        depth.set(edge.target, (depth.get(edge.source) ?? 0) + 1);
        queue.push(edge.target);
      }
    }
  const lanes = new Map<number, number>();
  const nodes: Node<WorkflowNodeData>[] = definition.steps.map(
    (step, index) => {
      const column = depth.get(step.id) ?? index;
      const lane = lanes.get(column) ?? 0;
      lanes.set(column, lane + 1);
      const status = run?.steps[step.id]?.status;
      return {
        id: step.id,
        type:
          step.id === definition.startStepId &&
          !edges.some((edge) => edge.target === step.id)
            ? "trigger"
            : "action",
        position: { x: column * 285, y: lane * 265 },
        selected: step.id === selected,
        data: {
          label: step.label,
          description: run
            ? `${status ?? "pending"} · ${step.executor}`
            : `${step.type} · ${step.executor}`,
          config: { triggerType: "Manual", actionType: step.type },
          status: status === "completed" ? "success" : "idle",
        },
        ariaLabel: `${step.label}, ${step.type}, ${step.executor}`,
        draggable: false,
        connectable: false,
      };
    },
  );
  return { nodes, edges };
}
