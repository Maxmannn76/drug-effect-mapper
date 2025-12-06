import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { NetworkData, NetworkNode } from "@/types/drug";
import { cn } from "@/lib/utils";

interface NetworkGraphProps {
  data: NetworkData;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  className?: string;
}

export function NetworkGraph({
  data,
  selectedNodeId,
  onSelectNode,
  className,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate similarity scores for all nodes relative to selected node
  const similarityMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedNodeId) return map;

    // Set selected node similarity to 1
    map.set(selectedNodeId, 1);

    // Find direct connections and their similarities
    data.edges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        map.set(edge.target, edge.similarity);
      }
      if (edge.target === selectedNodeId) {
        map.set(edge.source, edge.similarity);
      }
    });

    return map;
  }, [selectedNodeId, data.edges]);

  const connectedNodes = new Set<string>();
  if (selectedNodeId) {
    connectedNodes.add(selectedNodeId);
    data.edges.forEach((edge) => {
      if (edge.source === selectedNodeId) connectedNodes.add(edge.target);
      if (edge.target === selectedNodeId) connectedNodes.add(edge.source);
    });
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.3), 3),
    }));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener("wheel", handleWheel, { passive: false });
      return () => svg.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  const getNodeColor = (nodeId: string) => {
    if (nodeId === selectedNodeId) return "hsl(var(--node-selected))";
    if (nodeId === hoveredNode) return "hsl(var(--node-hover))";
    
    // If a node is selected, color based on similarity
    if (selectedNodeId) {
      const similarity = similarityMap.get(nodeId);
      if (similarity !== undefined) {
        // Interpolate between primary color with varying lightness
        const lightness = 40 + similarity * 30; // 40-70% lightness based on similarity
        return `hsl(135 90% ${lightness}%)`;
      }
      // Not connected
      return "hsl(var(--muted-foreground) / 0.2)";
    }
    
    return "hsl(var(--node-default))";
  };

  const getNodeSize = (nodeId: string) => {
    if (nodeId === selectedNodeId) return 28;
    if (nodeId === hoveredNode) return 24;
    
    if (selectedNodeId) {
      const similarity = similarityMap.get(nodeId);
      if (similarity !== undefined) {
        // Size ranges from 14 to 24 based on similarity
        return 14 + similarity * 10;
      }
      return 10; // Not connected nodes are smaller
    }
    
    return 18;
  };

  const getNodeOpacity = (nodeId: string) => {
    if (!selectedNodeId) return 1;
    if (nodeId === selectedNodeId) return 1;
    
    const similarity = similarityMap.get(nodeId);
    if (similarity !== undefined) {
      // Opacity ranges from 0.5 to 1 based on similarity
      return 0.5 + similarity * 0.5;
    }
    return 0.15; // Not connected
  };

  const getEdgeColor = (edge: { source: string; target: string }) => {
    if (selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId)) {
      return "hsl(var(--edge-active))";
    }
    if (selectedNodeId) return "hsl(var(--edge-default) / 0.1)";
    return "hsl(var(--edge-default))";
  };

  const getEdgeWidth = (edge: { source: string; target: string; similarity: number }) => {
    const base = edge.similarity * 3;
    if (selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId)) {
      return base + 2;
    }
    return base;
  };

  const getEdgeOpacity = (edge: { source: string; target: string; similarity: number }) => {
    if (!selectedNodeId) return 0.6;
    if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
      return 0.4 + edge.similarity * 0.6; // Brighter for higher similarity
    }
    return 0.1;
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-card/30", className)}>
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox="0 0 800 700"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          <g>
            {data.edges.map((edge, i) => {
              const sourceNode = data.nodes.find((n) => n.id === edge.source);
              const targetNode = data.nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              return (
                  <line
                  key={i}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={getEdgeColor(edge)}
                  strokeWidth={getEdgeWidth(edge)}
                  strokeLinecap="round"
                  opacity={getEdgeOpacity(edge)}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {data.nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const nodeSize = getNodeSize(node.id);
              const nodeOpacity = getNodeOpacity(node.id);
              const similarity = similarityMap.get(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id === selectedNodeId ? null : node.id);
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer"
                  style={{ opacity: nodeOpacity, transition: "opacity 0.3s" }}
                >
                  {/* Glow effect for selected/hovered */}
                  {(isSelected || node.id === hoveredNode) && (
                    <circle r={nodeSize + 15} fill="url(#nodeGlow)" className="animate-network-pulse" />
                  )}

                  {/* Main node */}
                  <circle
                    r={nodeSize}
                    fill={getNodeColor(node.id)}
                    filter={isSelected ? "url(#glow)" : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Similarity label for connected nodes */}
                  {selectedNodeId && similarity !== undefined && similarity < 1 && (
                    <text
                      y={-nodeSize - 6}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-primary pointer-events-none select-none"
                    >
                      {(similarity * 100).toFixed(0)}%
                    </text>
                  )}

                  {/* Node label */}
                  <text
                    y={nodeSize + 14}
                    textAnchor="middle"
                    className="text-xs font-medium fill-foreground pointer-events-none select-none"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: prev.scale * 1.2 }))}
          className="w-8 h-8 rounded-md bg-card/80 border border-border text-foreground hover:bg-card flex items-center justify-center transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: prev.scale * 0.8 }))}
          className="w-8 h-8 rounded-md bg-card/80 border border-border text-foreground hover:bg-card flex items-center justify-center transition-colors"
        >
          −
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="px-3 h-8 rounded-md bg-card/80 border border-border text-foreground hover:bg-card text-xs font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground">
        Click nodes to explore • Scroll to zoom • Drag to pan
      </div>
    </div>
  );
}
