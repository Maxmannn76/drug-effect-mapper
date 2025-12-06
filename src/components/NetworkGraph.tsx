import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { NetworkData, NetworkNode } from "@/types/drug";
import { cn } from "@/lib/utils";

interface NetworkGraphProps {
  data: NetworkData;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  className?: string;
}

const CENTER_X = 400;
const CENTER_Y = 350;
const MAX_RADIUS = 280;
const MIN_RADIUS = 80;

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

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  // Calculate connected nodes and their similarities when a node is selected
  const { connectedEdges, similarityMap } = useMemo(() => {
    const result: { nodeId: string; similarity: number }[] = [];
    const map = new Map<string, number>();

    if (!selectedNodeId) return { connectedEdges: result, similarityMap: map };

    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        result.push({ nodeId: edge.target, similarity: edge.similarity });
        map.set(edge.target, edge.similarity);
      }
      if (edge.target === selectedNodeId) {
        result.push({ nodeId: edge.source, similarity: edge.similarity });
        map.set(edge.source, edge.similarity);
      }
    });

    // Sort by similarity descending
    result.sort((a, b) => b.similarity - a.similarity);

    return { connectedEdges: result, similarityMap: map };
  }, [selectedNodeId, edges]);

  // Calculate positions: selected node in center, connected nodes arranged by similarity
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();

    if (!selectedNodeId) {
      // No selection: use original positions
      nodes.forEach((node) => {
        positions.set(node.id, { x: node.x || 0, y: node.y || 0 });
      });
      return positions;
    }

    // Selected node at center
    positions.set(selectedNodeId, { x: CENTER_X, y: CENTER_Y });

    // Arrange connected nodes in a circle, distance based on similarity
    const count = connectedEdges.length;
    connectedEdges.forEach((edge, index) => {
      const angle = (2 * Math.PI * index) / count - Math.PI / 2; // Start from top
      // Higher similarity = closer to center
      const distance = MIN_RADIUS + (1 - edge.similarity) * (MAX_RADIUS - MIN_RADIUS);
      const x = CENTER_X + Math.cos(angle) * distance;
      const y = CENTER_Y + Math.sin(angle) * distance;
      positions.set(edge.nodeId, { x, y });
    });

    return positions;
  }, [selectedNodeId, connectedEdges, nodes]);

  // Filter nodes to show only selected + connected when a drug is selected
  const visibleNodes = useMemo(() => {
    if (!selectedNodeId) return nodes;
    
    const connectedIds = new Set(connectedEdges.map((e) => e.nodeId));
    connectedIds.add(selectedNodeId);
    
    return nodes.filter((node) => connectedIds.has(node.id));
  }, [selectedNodeId, connectedEdges, nodes]);

  // Filter edges to show only those connected to selected node
  const visibleEdges = useMemo(() => {
    if (!selectedNodeId) return edges;
    
    return edges.filter(
      (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
    );
  }, [selectedNodeId, edges]);

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

  // Reset transform when selection changes
  useEffect(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, [selectedNodeId]);

  const getNodeColor = (nodeId: string) => {
    if (nodeId === selectedNodeId) return "hsl(var(--node-selected))";
    if (nodeId === hoveredNode) return "hsl(var(--node-hover))";

    const similarity = similarityMap.get(nodeId);
    if (similarity !== undefined) {
      const lightness = 40 + similarity * 30;
      return `hsl(135 90% ${lightness}%)`;
    }

    return "hsl(var(--node-default))";
  };

  const getNodeSize = (nodeId: string) => {
    if (nodeId === selectedNodeId) return 32;
    if (nodeId === hoveredNode) return 26;

    const similarity = similarityMap.get(nodeId);
    if (similarity !== undefined) {
      return 14 + similarity * 12;
    }

    return 18;
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
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Distance circles when node is selected */}
          {selectedNodeId && (
            <g opacity="0.15">
              {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <circle
                  key={i}
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS)}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
            </g>
          )}

          {/* Edges */}
          <g>
            {visibleEdges.map((edge, i) => {
              const sourcePos = nodePositions.get(edge.source);
              const targetPos = nodePositions.get(edge.target);
              if (!sourcePos || !targetPos) return null;

              return (
                <line
                  key={i}
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke="hsl(var(--edge-active))"
                  strokeWidth={1 + edge.similarity * 3}
                  strokeLinecap="round"
                  opacity={0.4 + edge.similarity * 0.5}
                  className="transition-all duration-500"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {visibleNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const pos = nodePositions.get(node.id);
              if (!pos) return null;

              const nodeSize = getNodeSize(node.id);
              const similarity = similarityMap.get(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id === selectedNodeId ? null : node.id);
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer transition-transform duration-500"
                >
                  {/* Glow effect for selected/hovered */}
                  {(isSelected || node.id === hoveredNode) && (
                    <circle r={nodeSize + 18} fill="url(#nodeGlow)" className="animate-network-pulse" />
                  )}

                  {/* Main node */}
                  <circle
                    r={nodeSize}
                    fill={getNodeColor(node.id)}
                    filter={isSelected ? "url(#glow)" : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Similarity label */}
                  {!isSelected && similarity !== undefined && (
                    <text
                      y={-nodeSize - 8}
                      textAnchor="middle"
                      className="text-[11px] font-mono fill-primary pointer-events-none select-none font-semibold"
                    >
                      {(similarity * 100).toFixed(0)}%
                    </text>
                  )}

                  {/* Node label */}
                  <text
                    y={nodeSize + 16}
                    textAnchor="middle"
                    className={cn(
                      "text-xs font-medium pointer-events-none select-none",
                      isSelected ? "fill-primary font-semibold" : "fill-foreground"
                    )}
                  >
                    {node.drug}
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
          onClick={() => {
            onSelectNode(null);
            setTransform({ x: 0, y: 0, scale: 1 });
          }}
          className="px-3 h-8 rounded-md bg-card/80 border border-border text-foreground hover:bg-card text-xs font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground">
        {selectedNodeId 
          ? "Closer = more similar • Click drug to explore • Click Reset to clear"
          : "Select a drug to explore similarities"}
      </div>
    </div>
  );
}