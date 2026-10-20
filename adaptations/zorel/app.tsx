import { MiniMap, Panel, ReactFlowProvider } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas } from "./components/ai-elements/canvas";
import { Controls } from "./components/ai-elements/controls";
import { Button } from "./components/ui/button";
import { ActionNode } from "./components/workflow/nodes/action-node";
import { TriggerNode } from "./components/workflow/nodes/trigger-node";
import { type Run, type Workflow, workflowGraph } from "./graph";
import { showMinimapAtom } from "./lib/workflow-store";

const channel = "zorel-workflow-builder-v1";
const send = (action: string, extra: Record<string, unknown> = {}) =>
  parent.postMessage({ channel, action, ...extra }, location.origin);
const nodeTypes = { trigger: TriggerNode, action: ActionNode };
type Model = {
  workflows: Workflow[];
  runs: Array<
    Pick<Run, "id" | "draftRevision" | "status"> & { updatedAt?: string }
  >;
  run?: Run | null;
  selectedId: string;
  error?: string;
  loading?: boolean;
};
function App() {
  const [model, setModel] = useState<Model>({
    workflows: [],
    runs: [],
    selectedId: "",
    loading: true,
  });
  const [stepId, setStepId] = useState("");
  const [search, setSearch] = useState("");
  const minimap = useAtomValue(showMinimapAtom);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== parent ||
        event.origin !== location.origin ||
        event.data?.channel !== channel ||
        event.data?.action !== "model"
      )
        return;
      setModel(event.data.model);
    };
    addEventListener("message", receive);
    send("ready");
    return () => removeEventListener("message", receive);
  }, []);
  const workflow = model.workflows.find((item) => item.id === model.selectedId);
  const run = model.run ?? null;
  const definition = run?.definition ?? workflow?.definition;
  const selected =
    definition?.steps.find((step) => step.id === stepId) ??
    definition?.steps[0];
  const graph = useMemo(
    () =>
      definition
        ? workflowGraph(definition, run, selected?.id ?? "")
        : { nodes: [], edges: [] },
    [definition, run, selected?.id],
  );
  const choose = (id: string) => {
    setStepId("");
    send("select", { id });
  };
  return (
    <main className="workspace">
      <header>
        <div>
          <span className="eyebrow">ZOREL / WORKFLOWS</span>
          <h1>See how the work connects</h1>
          <p>
            Inspect the method, follow its branches, and see where a person
            needs to review.
          </p>
        </div>
        <div className="actions">
          <Button variant="outline" onClick={() => send("refresh")}>
            Refresh
          </Button>
          <Button variant="outline" onClick={() => send("library")}>
            Library & editor
          </Button>
          <Button onClick={() => send("ask")}>Ask Zorel</Button>
        </div>
      </header>
      {model.error && (
        <div role="alert" className="error">
          {model.error}{" "}
          <Button variant="outline" onClick={() => send("refresh")}>
            Retry
          </Button>
        </div>
      )}
      <div className="body">
        <aside className="library">
          <label htmlFor="find">
            Methods <span>{model.workflows.length}</span>
          </label>
          <input
            id="find"
            placeholder="Find a workflow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {model.loading && <p role="status">Loading saved workflows…</p>}
          {!model.loading && !model.workflows.length && (
            <p>
              No saved methods yet. Describe a workflow or choose a starter in
              the library.
            </p>
          )}
          {model.workflows
            .filter((item) =>
              `${item.name} ${item.purpose}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  item.id === model.selectedId ? "method selected" : "method"
                }
                onClick={() => choose(item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.purpose}</span>
                <small>
                  {item.starter
                    ? "Starter preview"
                    : `Saved draft · revision ${item.draftRevision}`}
                </small>
              </button>
            ))}
        </aside>
        <section className="flow" aria-label="Workflow canvas">
          <div className="flow-heading">
            <div>
              <h2>{workflow?.name ?? "Your connected work"}</h2>
              <p>
                {run
                  ? `Saved test · draft revision ${run.draftRevision} · ${run.status}`
                  : workflow
                    ? workflow.starter
                      ? "Starter preview · not saved as your draft"
                      : `Draft revision ${workflow.draftRevision} · select any step to inspect it`
                    : "Choose a saved workflow to explore its steps."}
              </p>
            </div>
            {workflow && (
              <Button
                variant="outline"
                disabled={model.loading}
                onClick={() =>
                  send(workflow.starter ? "adopt" : "test", { id: workflow.id })
                }
              >
                {workflow.starter ? "Use this starter" : "Open test runner"}
              </Button>
            )}
          </div>
          <div className="canvas">
            <Canvas
              key={`${workflow?.id}:${run?.id ?? ""}`}
              nodes={graph.nodes}
              edges={graph.edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setStepId(node.id)}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesReconnectable={false}
              deleteKeyCode={null}
              fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
              minZoom={0.15}
              maxZoom={1.7}
            >
              <Panel position="bottom-left">
                <Controls />
              </Panel>
              {minimap && <MiniMap pannable zoomable />}
            </Canvas>
            {!workflow && (
              <div className="empty">
                Your saved workflows appear here. Pan, zoom and select to
                explore.
              </div>
            )}
          </div>
          <div className="history">
            <label htmlFor="runs">View</label>
            <select
              id="runs"
              value={run?.id ?? ""}
              onChange={(e) => {
                send("run", { id: e.target.value });
                setStepId("");
              }}
            >
              <option value="">
                {workflow?.starter ? "Starter preview" : "Current saved draft"}
              </option>
              {model.runs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleString()
                    : "Saved test"}{" "}
                  · revision {item.draftRevision} · {item.status}
                </option>
              ))}
            </select>
            <span>
              {model.runs.length} saved test{model.runs.length === 1 ? "" : "s"}{" "}
              · simulations, no live agent calls
            </span>
          </div>
        </section>
        <aside className="inspector" aria-label="Step details">
          <span className="eyebrow">
            {run ? "TEST RECORD" : "STEP DETAILS"}
          </span>
          <h2>{selected?.label ?? "Select a step"}</h2>
          {selected && (
            <>
              <div className="badge">
                {selected.type} · {selected.executor}
              </div>
              <h3>What happens</h3>
              <p>{selected.instructions}</p>
              <h3>Uses</h3>
              <p>{selected.inputs}</p>
              <h3>Produces</h3>
              <p>{selected.result}</p>
              <h3>Ready when</h3>
              <p>{selected.criteria}</p>
              <h3>Who reviews</h3>
              <p>{selected.review}</p>
              {run && (
                <>
                  <h3>Recorded result</h3>
                  <p>
                    {run.steps[selected.id]?.result ??
                      "No result recorded yet."}
                  </p>
                  {run.steps[selected.id]?.gaps && (
                    <p>Gaps: {run.steps[selected.id].gaps}</p>
                  )}
                  {run.reviews
                    .filter((review) => review.stepId === selected.id)
                    .map((review) => (
                      <p key={review.stepId}>
                        <strong>{review.ownerDisplayName}</strong>:{" "}
                        {review.judgment}
                      </p>
                    ))}
                </>
              )}
            </>
          )}
          {run && (
            <>
              <h3>Run inputs</h3>
              <p>{run.inputs.label}</p>
              {run.inputs.sources.map((source) => (
                <p key={source.id}>
                  {source.name}
                  {source.revision !== undefined
                    ? ` · revision ${source.revision}`
                    : ""}
                </p>
              ))}
              {run.outputs.length > 0 && (
                <>
                  <h3>Test outputs</h3>
                  {run.outputs.map((output) => (
                    <details key={output.stepId}>
                      <summary>{output.label}</summary>
                      <p>{output.text}</p>
                    </details>
                  ))}
                  <p className="notice">
                    These test outputs remain separate from project work.
                  </p>
                </>
              )}
            </>
          )}
        </aside>
      </div>
      <footer>
        <span>
          Components adapted from{" "}
          <a
            href="https://github.com/adamgohch/workflow-builder-template/tree/codex/zorel-workflows/adaptations/zorel"
            target="_blank"
            rel="noreferrer"
          >
            our Vercel Workflow Builder fork
          </a>{" "}
          · Apache-2.0
        </span>
        <span>Methods and test history saved in Zorel</span>
      </footer>
    </main>
  );
}
const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>,
  );
