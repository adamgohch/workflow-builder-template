import { atom } from "jotai";
export const showMinimapAtom = atom(false);
export type WorkflowNodeData = {
  label: string;
  description: string;
  config?: { triggerType?: string; actionType?: string };
  status?: "idle" | "running" | "success" | "error";
  [key: string]: unknown;
};
