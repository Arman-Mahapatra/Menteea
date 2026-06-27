import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  X, 
  Sparkles, 
  Network, 
  HelpCircle, 
  Loader2, 
  MessageSquare, 
  Compass, 
  Share2, 
  Layers 
} from "lucide-react";
import { DocumentFile } from "../types";

// Custom node component styled with Tailwind CSS
import { Handle, Position } from "@xyflow/react";

function CustomNode({ data }: any) {
  const isRoot = data.level === 0;
  const isMajor = data.level === 1;
  const isSub = data.level === 2;

  // Visual accents
  let markerColor = "bg-indigo-500";
  if (isMajor) markerColor = "bg-violet-500";
  if (isSub) markerColor = "bg-emerald-500";
  if (data.level === 3) markerColor = "bg-amber-500";

  return (
    <div 
      className={`p-3.5 rounded-xl border text-left transition-all duration-300 w-[240px] shadow-sm hover:shadow-lg hover:-translate-y-0.5 group ${data.bgColor} ${data.textColor}`}
    >
      {/* Input connector */}
      {data.level > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ 
            background: "var(--color-border-custom, #cbd5e1)", 
            width: 8, 
            height: 8,
            border: "2px solid #fff"
          }}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-3 rounded-full shrink-0 ${markerColor}`} />
          <h4 className={`line-clamp-2 tracking-tight uppercase text-[9px] font-bold opacity-60`}>
            {isRoot ? "Document Core" : isMajor ? "Major Theme" : isSub ? "Subtopic" : "Concept"}
          </h4>
        </div>
        <h3 className={`line-clamp-2 leading-snug tracking-tight font-semibold text-xs text-text-primary`}>
          {data.title}
        </h3>
        {data.description && (
          <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed mt-0.5 group-hover:line-clamp-none transition-all duration-300">
            {data.description}
          </p>
        )}
      </div>

      {/* Output connector */}
      {data.level < 3 && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ 
            background: "var(--color-border-custom, #cbd5e1)", 
            width: 8, 
            height: 8,
            border: "2px solid #fff"
          }}
        />
      )}
    </div>
  );
}

interface MindMapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentFile | null;
  apiKey: string;
  selectedDocuments: DocumentFile[];
  onAskInChat: (question: string) => void;
}

export default function MindMapPanel({
  isOpen,
  onClose,
  document,
  apiKey,
  selectedDocuments,
  onAskInChat,
}: MindMapPanelProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Cache of mind maps by documentId to prevent waste of tokens
  const [mindMapCache, setMindMapCache] = useState<Record<string, any>>({});
  
  // Selected concept for inspector
  const [selectedConcept, setSelectedConcept] = useState<{
    title: string;
    description: string;
    level: number;
  } | null>(null);

  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  // Fetch or retrieve mind map data
  const loadMindMap = useCallback(async () => {
    if (!document) return;
    
    // Clear selections and states
    setSelectedConcept(null);
    setErrorMsg(null);

    // If cached, use it
    if (mindMapCache[document.id]) {
      buildFlowLayout(mindMapCache[document.id]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/mindmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          documentId: document.id,
          selectedDocuments: selectedDocuments.map(d => ({
            id: d.id,
            name: d.name,
            pages: d.pages,
            size: d.size
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Unable to generate mind map for this document.");
      }

      const data = await response.json();
      
      // Store in cache
      setMindMapCache(prev => ({
        ...prev,
        [document.id]: data
      }));

      // Generate layout
      buildFlowLayout(data);
    } catch (err: any) {
      console.error("Mind Map load failure:", err);
      setErrorMsg(err.message || "Unable to generate mind map for this document.");
    } finally {
      setIsLoading(false);
    }
  }, [document, apiKey, selectedDocuments, mindMapCache]);

  // Load mind map on open/change
  useEffect(() => {
    if (isOpen && document) {
      loadMindMap();
    }
  }, [isOpen, document]);

  // Tree layout compiler
  const buildFlowLayout = (treeData: any) => {
    let leafCounter = 0;

    interface TreeWithLayout {
      id: string;
      title: string;
      description: string;
      level: number;
      x: number;
      y: number;
      children?: TreeWithLayout[];
    }

    function layoutNode(node: any, level: number, parentId: string, index: number): TreeWithLayout {
      const id = `${parentId}-${index}`;
      const x = 50 + level * 310;
      let children: TreeWithLayout[] = [];
      let y = 0;

      if (node.children && node.children.length > 0) {
        children = node.children.map((child: any, idx: number) =>
          layoutNode(child, level + 1, id, idx)
        );
        // Center the parent vertically between its immediate children
        const minY = children[0].y;
        const maxY = children[children.length - 1].y;
        y = (minY + maxY) / 2;
      } else {
        // Leaf node positioning
        y = leafCounter * 115 + 40;
        leafCounter++;
      }

      return {
        id,
        title: node.title,
        description: node.description || "",
        level,
        x,
        y,
        children,
      };
    }

    // Process Root
    const formattedTree = layoutNode(treeData, 0, "root", 0);

    const generatedNodes: any[] = [];
    const generatedEdges: any[] = [];

    function collectElements(node: TreeWithLayout, parentId?: string) {
      let bgColor = "bg-bg-surface border-border-custom text-text-primary";
      
      if (node.level === 0) {
        bgColor = "bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/60 ring-2 ring-indigo-500/10";
      } else if (node.level === 1) {
        bgColor = "bg-violet-50/40 border-violet-200 dark:bg-violet-950/10 dark:border-violet-900/40";
      } else if (node.level === 2) {
        bgColor = "bg-emerald-50/20 border-emerald-200 dark:bg-emerald-950/5 dark:border-emerald-900/30";
      }

      generatedNodes.push({
        id: node.id,
        type: "customNode",
        position: { x: node.x, y: node.y },
        data: {
          title: node.title,
          description: node.description,
          level: node.level,
          bgColor,
        },
      });

      if (parentId) {
        let edgeColor = "#3b82f6"; // Blue
        if (node.level === 1) edgeColor = "#6366f1"; // Indigo
        if (node.level === 2) edgeColor = "#8b5cf6"; // Violet
        if (node.level === 3) edgeColor = "#10b981"; // Emerald

        generatedEdges.push({
          id: `edge-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: edgeColor,
            strokeWidth: node.level === 1 ? 2.5 : node.level === 2 ? 2 : 1.5,
            opacity: 0.8,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: edgeColor,
          },
        });
      }

      if (node.children) {
        node.children.forEach((child) => collectElements(child, node.id));
      }
    }

    collectElements(formattedTree);
    setNodes(generatedNodes as any);
    setEdges(generatedEdges as any);
    
    // Set initially selected concept to root node
    setSelectedConcept({
      title: treeData.title,
      description: treeData.description || "Overall root topic of the analyzed document.",
      level: 0
    });
  };

  // Inspect concept details on node click
  const handleNodeClick = useCallback((_event: any, node: any) => {
    setSelectedConcept({
      title: node.data.title,
      description: node.data.description,
      level: node.data.level,
    });
  }, []);

  const handleAskAboutConcept = () => {
    if (!selectedConcept) return;
    const q = `Explain the concept of "${selectedConcept.title}" as referenced in the document. What are its main implications?`;
    onAskInChat(q);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 md:p-8">
      <div className="flex flex-col bg-bg-surface w-full h-full max-w-7xl rounded-2xl overflow-hidden border border-border-custom shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Panel */}
        <header className="h-14 bg-bg-surface border-b border-border-custom px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                Knowledge Mind Map
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  AI Grounded
                </span>
              </h2>
              <p className="text-[10px] text-text-muted font-medium line-clamp-1 max-w-lg">
                Interactive conceptual index for "{document?.name}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Regenerate Action */}
            <button
              onClick={loadMindMap}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-bg-secondary text-text-secondary disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              <span>Refresh Map</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden w-full relative">
          
          {/* Main Flow Canvas area */}
          <div className="flex-1 h-full bg-bg-app relative overflow-hidden">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-app z-10 gap-3">
                <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider animate-pulse">
                    Synthesizing Mind Map...
                  </p>
                  <p className="text-[10px] text-text-muted mt-1 font-medium">
                    Analyzing document schema & laying out conceptual hierarchy
                  </p>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-app p-6 text-center z-10 max-w-md mx-auto gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl">
                  <HelpCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    Generation Failed
                  </h3>
                  <p className="text-[11px] text-text-muted leading-relaxed mt-2.5">
                    {errorMsg}
                  </p>
                </div>
                <button
                  onClick={loadMindMap}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                >
                  Retry Generation
                </button>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={1.5}
                className="w-full h-full"
              >
                <Background color="var(--color-border-custom, #e2e8f0)" gap={16} size={1} />
                <Controls showInteractive={false} className="bg-bg-surface border-border-custom rounded-lg shadow-md" />
                <MiniMap 
                  nodeStrokeWidth={3} 
                  zoomable 
                  pannable 
                  nodeColor={(node) => {
                    if (node.data.level === 0) return "#818cf8";
                    if (node.data.level === 1) return "#c084fc";
                    if (node.data.level === 2) return "#34d399";
                    return "#94a3b8";
                  }}
                  className="bg-bg-surface border border-border-custom rounded-lg"
                />
              </ReactFlow>
            )}
          </div>

          {/* Right Concept Inspector Sidebar */}
          <div className="w-80 border-l border-border-custom bg-bg-surface flex flex-col h-full shrink-0 theme-transition">
            
            {/* Toolbar title */}
            <div className="px-5 py-4 border-b border-border-custom shrink-0">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-indigo-500" />
                Concept Inspector
              </h3>
              <p className="text-[10px] text-text-muted font-medium mt-1">
                Explore definitions and cross-referenced summaries
              </p>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {selectedConcept ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="space-y-2">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                      selectedConcept.level === 0 
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400" 
                        : selectedConcept.level === 1 
                        ? "bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-400"
                        : selectedConcept.level === 2 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400"
                    }`}>
                      {selectedConcept.level === 0 ? "Core Focus" : selectedConcept.level === 1 ? "Main Segment" : selectedConcept.level === 2 ? "Subconcept" : "Specific Term"}
                    </span>
                    <h3 className="text-sm font-bold text-text-primary leading-snug tracking-tight">
                      {selectedConcept.title}
                    </h3>
                  </div>

                  <div className="space-y-1.5 bg-bg-app p-4 rounded-xl border border-border-custom">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">
                      AI Explanation:
                    </span>
                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                      {selectedConcept.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border-custom/60">
                    <button
                      onClick={handleAskAboutConcept}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition active:scale-98 cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Ask Menteea in Chat</span>
                    </button>
                    <p className="text-[9px] text-text-muted text-center leading-normal max-w-[240px] mx-auto">
                      Closes the mind map and runs an AI-grounded retrieval query on this concept in your Workspace.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Layers className="h-8 w-8 text-text-muted opacity-40 mb-3" />
                  <p className="text-xs font-semibold text-text-secondary">
                    No Concept Selected
                  </p>
                  <p className="text-[10px] text-text-muted mt-1 max-w-[200px] leading-relaxed">
                    Click any node in the mind map to inspect explanations and cross-reference.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom help desk tip */}
            <div className="p-4 bg-bg-app border-t border-border-custom shrink-0 text-left">
              <div className="flex gap-2.5 items-start">
                <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-wide">
                    Navigating your map
                  </h4>
                  <p className="text-[9.5px] text-text-muted leading-relaxed mt-0.5 font-medium">
                    Drag empty space to pan. Use mouse wheel or pinch to zoom. Select nodes to explore.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}