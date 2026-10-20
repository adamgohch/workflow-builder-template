"use client";

import { useReactFlow } from "@xyflow/react";
import { useAtom } from "jotai";
import {
  Maximize,
  PanelBottomClose,
  PanelBottomOpen,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { showMinimapAtom } from "@/lib/workflow-store";

export const Controls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [showMinimap, setShowMinimap] = useAtom(showMinimapAtom);

  const handleZoomIn = () => {
    zoomIn();
  };

  const handleZoomOut = () => {
    zoomOut();
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleToggleMinimap = () => {
    setShowMinimap(!showMinimap);
  };

  return (
    <ButtonGroup orientation="vertical">
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleZoomIn}
        size="icon"
        title="Zoom in"
        variant="secondary"
      >
        <ZoomIn className="size-4" strokeWidth={1.5} />
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleZoomOut}
        size="icon"
        title="Zoom out"
        variant="secondary"
      >
        <ZoomOut className="size-4" strokeWidth={1.5} />
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleFitView}
        size="icon"
        title="Fit view"
        variant="secondary"
      >
        <Maximize className="size-4" strokeWidth={1.5} />
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleToggleMinimap}
        size="icon"
        title={showMinimap ? "Hide minimap" : "Show minimap"}
        aria-pressed={showMinimap}
        variant="secondary"
      >
        {showMinimap ? (
          <PanelBottomClose className="size-4" strokeWidth={1.5} />
        ) : (
          <PanelBottomOpen className="size-4" strokeWidth={1.5} />
        )}
      </Button>
    </ButtonGroup>
  );
};
