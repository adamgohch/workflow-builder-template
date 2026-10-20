import assert from "node:assert/strict";
import test from "node:test";
import { type Definition, type Run, type Step, workflowGraph } from "./graph";

const step = (
  id: string,
  type = "Investigate",
  nextStepId: string | null = null,
): Step => ({
  id,
  type,
  label: id,
  executor: "Person",
  role: "Reviewer",
  instructions: "Inspect",
  inputs: "Sources",
  result: "Findings",
  criteria: "Supported",
  review: "Required",
  nextStepId,
  branches: {},
});
test("preserves all three decision outcomes, return edges and disconnected steps without mutating the definition", () => {
  const definition: Definition = {
    startStepId: "start",
    methodGuidance: "Reusable",
    steps: [
      step("start", "Collect inputs", "decision"),
      {
        ...step("decision", "Decide a path"),
        branches: { yes: "review", no: "finish", unresolved: "start" },
      },
      step("review", "Human review", "finish"),
      step("finish", "Finish"),
      step("orphan"),
    ],
  };
  const before = structuredClone(definition);
  const graph = workflowGraph(definition, null, "review");
  assert.equal(graph.nodes.length, 5);
  assert.equal(graph.edges.length, 5);
  assert.deepEqual(
    graph.edges.filter((e) => e.source === "decision").map((e) => e.label),
    ["yes", "no", "unresolved"],
  );
  assert.equal(graph.nodes.find((n) => n.id === "start")?.type, "action");
  assert.equal(graph.nodes.find((n) => n.id === "review")?.selected, true);
  assert.deepEqual(definition, before);
});
test("shared branch destinations show every outcome instead of overlapping labels", () => {
  const definition: Definition = {
    startStepId: "decide",
    methodGuidance: "Reusable",
    steps: [
      {
        ...step("decide", "Decide a path"),
        branches: { yes: "finish", no: "review", unresolved: "review" },
      },
      step("review", "Human review", "finish"),
      step("finish", "Finish"),
    ],
  };
  const graph = workflowGraph(definition, null, "decide");
  assert.equal(
    graph.edges.find(
      (edge) => edge.source === "decide" && edge.target === "review",
    )?.label,
    "no / unresolved",
  );
});
test("run snapshots retain their own graph after the saved draft changes", () => {
  const old: Definition = {
    startStepId: "old",
    methodGuidance: "Reusable",
    steps: [step("old", "Finish")],
  };
  const run: Run = {
    id: "run",
    workflowId: "draft",
    draftRevision: 1,
    runRevision: 2,
    definition: old,
    status: "completed",
    execution: "simulated",
    activeStepId: null,
    createdAt: "2026-10-20",
    inputs: { label: "Test", sources: [] },
    steps: { old: { status: "completed", result: "Done" } },
    reviews: [],
    outputs: [],
  };
  const graph = workflowGraph(run.definition, run, "old");
  assert.equal(graph.nodes[0].id, "old");
  assert.equal(graph.nodes[0].data.status, "success");
});
