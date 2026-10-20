import {
  CircleCheck,
  ClipboardCheck,
  Clock,
  FileOutput,
  FileSearch,
  FolderInput,
  GitBranch,
  Webhook,
  Workflow,
} from "lucide-react";

const icons = {
  "Collect inputs": FolderInput,
  Investigate: FileSearch,
  "Decide a path": GitBranch,
  "Human review": ClipboardCheck,
  "Produce work": FileOutput,
  Finish: CircleCheck,
  Schedule: Clock,
  Webhook,
};

export function StepIcon({ kind }: { kind?: string }) {
  const Icon = icons[kind as keyof typeof icons] ?? Workflow;
  return (
    <span className="workflow-step-icon" aria-hidden="true">
      <Icon size={30} strokeWidth={1.5} />
    </span>
  );
}
