import { useCallback, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  Panel,
  Position,
  getBezierPath,
  NodeProps,
  Handle,
  EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BRANCH_COLORS = [
  '#34a853', '#4285f4', '#a259ff', '#ea4335',
  '#fbbc04', '#ff6d01', '#e91e8a', '#00bcd4',
];

function ColoredEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    curvature: 0.4,
  });
  const color = (data?.color as string) || BRANCH_COLORS[0];
  return <path id={id} d={path} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />;
}

function RootNode({ id, data, selected }: NodeProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label as string);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = () => {
    if (!(data.readOnly as boolean)) {
      setEditing(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const commitLabel = () => {
    setEditing(false);
    const fn = data.onLabelChange as ((id: string, l: string) => void) | undefined;
    fn?.(id, label);
  };

  return (
    <div onDoubleClick={handleDoubleClick} className={`select-none transition-all ${selected ? 'ring-2 ring-primary/40 rounded-lg' : ''}`} style={{ textAlign: 'center', padding: '12px 24px' }}>
      <Handle type="source" position={Position.Left} className="!bg-transparent !border-none !w-1 !h-1" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-none !w-1 !h-1" />
      <Handle type="source" position={Position.Top} id="top" className="!bg-transparent !border-none !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-none !w-1 !h-1" />
      {editing ? (
        <Input ref={inputRef} value={label} onChange={(e) => setLabel(e.target.value)} onBlur={commitLabel} onKeyDown={(e) => e.key === 'Enter' && commitLabel()} className="h-9 text-center text-lg font-extrabold border-muted bg-background" />
      ) : (
        <span className="font-extrabold text-foreground text-xl leading-tight block max-w-[280px]">{label}</span>
      )}
    </div>
  );
}

function BranchNode({ id, data, selected }: NodeProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label as string);
  const inputRef = useRef<HTMLInputElement>(null);
  const color = (data.color as string) || BRANCH_COLORS[0];
  const side = (data.computedSide as 'left' | 'right') || 'right';
  const canCollapse = data.canCollapse as boolean;
  const isCollapsed = data.isCollapsed as boolean;
  const onToggleCollapse = data.onToggleCollapse as ((id: string) => void) | undefined;

  const handleDoubleClick = () => {
    if (!(data.readOnly as boolean)) {
      setEditing(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const commitLabel = () => {
    setEditing(false);
    const fn = data.onLabelChange as ((id: string, l: string) => void) | undefined;
    fn?.(id, label);
  };

  const dot = (
    <span className="inline-flex items-center justify-center rounded-full border-2 shrink-0" style={{ borderColor: color, width: 18, height: 18 }}>
      <span className="rounded-full" style={{ background: color, width: 8, height: 8 }} />
    </span>
  );

  const collapseBtn = canCollapse ? (
    <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleCollapse?.(id); }}
      className="inline-flex items-center justify-center rounded-full shrink-0 transition-transform hover:scale-125 cursor-pointer"
      style={{ width: 20, height: 20, borderWidth: 2, borderColor: color, borderStyle: 'solid', background: 'transparent' }}>
      <span className="rounded-full transition-all" style={{ background: color, width: isCollapsed ? 12 : 6, height: isCollapsed ? 12 : 6, opacity: isCollapsed ? 1 : 0.45 }} />
    </button>
  ) : null;

  const labelEl = (
    <span className="font-semibold text-foreground text-sm whitespace-nowrap">
      {editing ? <Input ref={inputRef} value={label} onChange={(e) => setLabel(e.target.value)} onBlur={commitLabel} onKeyDown={(e) => e.key === 'Enter' && commitLabel()} className="h-7 text-sm font-semibold border-muted bg-background w-48" /> : label}
    </span>
  );

  const inner = side === 'left' ? <>{collapseBtn}{labelEl}{dot}</> : <>{dot}{labelEl}{collapseBtn}</>;

  return (
    <div onDoubleClick={handleDoubleClick} className={`flex items-center gap-2 select-none py-1 px-2 rounded-lg transition-all ${selected ? 'bg-muted/60' : ''}`}>
      <Handle type="target" position={Position.Right} id="target-right" className="!bg-transparent !border-none !w-1 !h-1" />
      <Handle type="target" position={Position.Left} id="target-left" className="!bg-transparent !border-none !w-1 !h-1" />
      <Handle type="source" position={Position.Left} id="out-left" className="!bg-transparent !border-none !w-1 !h-1" />
      <Handle type="source" position={Position.Right} id="out-right" className="!bg-transparent !border-none !w-1 !h-1" />
      {inner}
    </div>
  );
}

const nodeTypes = { root: RootNode, branch: BranchNode };
const edgeTypes = { colored: ColoredEdge };

interface MindMapEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  readOnly?: boolean;
  onChange?: (nodes: Node[], edges: Edge[]) => void;
}

let nodeIdCounter = 0;
const getNextId = () => `node_${Date.now()}_${nodeIdCounter++}`;

export default function MindMapEditor({ initialNodes, initialEdges, readOnly = false, onChange }: MindMapEditorProps) {
  const defaultNodes: Node[] = initialNodes || [{ id: 'root', type: 'root', position: { x: 400, y: 250 }, data: { label: 'Tema Central' } }];

  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const fireChange = useCallback((n: Node[], e: Edge[]) => onChange?.(n, e), [onChange]);

  const onLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) => {
      const updated = nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n);
      fireChange(updated, edges);
      return updated;
    });
  }, [setNodes, edges, fireChange]);

  const rootNode = nodes.find((n) => n.id === 'root');
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  edges.forEach((e) => {
    if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
    childrenMap.get(e.source)!.push(e.target);
    parentMap.set(e.target, e.source);
  });

  const getBranchColor = useCallback((nodeId: string): string | null => {
    let cur = nodeId;
    while (cur) {
      const p = parentMap.get(cur);
      if (p === 'root') { const n = nodes.find((nd) => nd.id === cur); return (n?.data?.color as string) || null; }
      if (!p) return null;
      cur = p;
    }
    return null;
  }, [parentMap, nodes]);

  const layoutTree = useCallback((nds: Node[], edgeList: Edge[], rootId = 'root', leafSpacing = 50, levelXOffset = 260, firstLevelXOffset = 320): Node[] => {
    const nodeMap = new Map(nds.map((n) => [n.id, n]));
    const cMap = new Map<string, string[]>();
    edgeList.forEach((e) => { if (!cMap.has(e.source)) cMap.set(e.source, []); cMap.get(e.source)!.push(e.target); });
    const rootN = nodeMap.get(rootId);
    if (!rootN) return nds;

    const heightCache = new Map<string, number>();
    const getHeight = (id: string): number => {
      if (heightCache.has(id)) return heightCache.get(id)!;
      const children = cMap.get(id) || [];
      const vis = children.filter(() => !collapsedNodes.has(id) || id === rootId);
      if (vis.length === 0 || (collapsedNodes.has(id) && id !== rootId)) { heightCache.set(id, leafSpacing); return leafSpacing; }
      const h = vis.reduce((s, cid) => s + getHeight(cid), 0);
      heightCache.set(id, h);
      return h;
    };

    const dc = cMap.get(rootId) || [];
    const left = dc.filter((cid) => { const c = nodeMap.get(cid); return c && c.position.x < rootN.position.x; });
    const right = dc.filter((cid) => { const c = nodeMap.get(cid); return c && c.position.x >= rootN.position.x; });
    [...left, ...right].forEach((id) => getHeight(id));

    const posMap = new Map<string, { x: number; y: number }>();
    posMap.set(rootId, { x: rootN.position.x, y: rootN.position.y });

    const layoutGroup = (ids: string[], px: number, py: number, side: 'left' | 'right', depth: number) => {
      const total = ids.reduce((s, id) => s + getHeight(id), 0);
      let cy = py - total / 2;
      const xo = depth === 1 ? firstLevelXOffset : levelXOffset;
      ids.forEach((id) => {
        const h = getHeight(id);
        posMap.set(id, { x: px + (side === 'right' ? xo : -xo), y: cy + h / 2 });
        const ch = cMap.get(id) || [];
        if (ch.length > 0 && !collapsedNodes.has(id)) layoutGroup(ch, px + (side === 'right' ? xo : -xo), cy + h / 2, side, depth + 1);
        cy += h;
      });
    };

    layoutGroup(right, rootN.position.x, rootN.position.y, 'right', 1);
    layoutGroup(left, rootN.position.x, rootN.position.y, 'left', 1);

    return nds.map((n) => { const pos = posMap.get(n.id); return pos ? { ...n, position: { x: pos.x, y: pos.y } } : n; });
  }, [collapsedNodes]);

  const getDescendants = (nodeId: string): Set<string> => {
    const desc = new Set<string>();
    const stack = [...(childrenMap.get(nodeId) || [])];
    while (stack.length) { const cur = stack.pop()!; desc.add(cur); (childrenMap.get(cur) || []).forEach((c) => stack.push(c)); }
    return desc;
  };

  const hiddenNodes = new Set<string>();
  collapsedNodes.forEach((cid) => getDescendants(cid).forEach((d) => hiddenNodes.add(d)));

  const onToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => { const next = new Set(prev); if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId); return next; });
  }, []);

  const enrichedNodes = nodes.filter((n) => !hiddenNodes.has(n.id)).map((n) => {
    let computedSide = 'right';
    if (n.type === 'branch' && rootNode) computedSide = n.position.x < rootNode.position.x ? 'left' : 'right';
    const hasChildren = (childrenMap.get(n.id) || []).length > 0;
    return { ...n, data: { ...n.data, onLabelChange, readOnly, computedSide, hasChildren, canCollapse: n.type === 'branch' && hasChildren, isCollapsed: collapsedNodes.has(n.id), onToggleCollapse } };
  });

  const enrichedEdges = edges.filter((e) => !hiddenNodes.has(e.source) && !hiddenNodes.has(e.target)).map((e) => {
    const sourceNode = nodes.find((n) => n.id === e.source);
    const targetNode = nodes.find((n) => n.id === e.target);
    if (!targetNode || !rootNode) return e;
    const isLeft = sourceNode ? targetNode.position.x < sourceNode.position.x : false;
    const sourceHandle = e.source === 'root' ? (isLeft ? undefined : 'right') : (isLeft ? 'out-left' : 'out-right');
    return { ...e, sourceHandle, targetHandle: isLeft ? 'target-right' : 'target-left' };
  });

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const ci = eds.length % BRANCH_COLORS.length;
      const updated = addEdge({ ...params, type: 'colored', data: { color: BRANCH_COLORS[ci] } }, eds);
      fireChange(nodes, updated);
      return updated;
    });
  }, [setEdges, nodes, fireChange]);

  const applyLayout = useCallback((nds: Node[], edgeList: Edge[]) => layoutTree(nds, edgeList), [layoutTree]);

  const addChild = () => {
    const parentId = selectedNode || 'root';
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;
    const isParentRoot = parentId === 'root';
    const newId = getNextId();

    let color: string;
    if (isParentRoot) { color = BRANCH_COLORS[(childrenMap.get('root') || []).length % BRANCH_COLORS.length]; }
    else { color = getBranchColor(parentId) || BRANCH_COLORS[edges.length % BRANCH_COLORS.length]; }

    const childEdges = edges.filter((e) => e.source === parentId);
    let side: 'left' | 'right' = 'right';
    if (isParentRoot) {
      const existing = childEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean);
      const rc = existing.filter((c) => c!.position.x >= parent.position.x).length;
      const lc = existing.filter((c) => c!.position.x < parent.position.x).length;
      side = rc <= lc ? 'right' : 'left';
    } else {
      side = parent.position.x < (rootNode?.position.x ?? 0) ? 'left' : 'right';
    }

    const xOffset = isParentRoot ? 320 : 220;
    const newNode: Node = { id: newId, type: 'branch', position: { x: parent.position.x + (side === 'right' ? xOffset : -xOffset), y: parent.position.y }, data: { label: 'Novo tópico', color, side, isRoot: false } };
    const sourceHandle = isParentRoot ? (side === 'right' ? 'right' : undefined) : (side === 'right' ? 'out-right' : 'out-left');
    const newEdge: Edge = { id: `e_${parentId}_${newId}`, source: parentId, sourceHandle, target: newId, type: 'colored', data: { color } };
    const newEdges = [...edges, newEdge];

    setNodes((nds) => { const updated = [...nds, newNode]; const repo = applyLayout(updated, newEdges); fireChange(repo, newEdges); return repo; });
    setEdges(newEdges);
  };

  const deleteSelected = () => {
    if (!selectedNode || selectedNode === 'root') return;
    const descendants = getDescendants(selectedNode);
    const toRemove = new Set([selectedNode, ...descendants]);
    setNodes((nds) => {
      const updated = nds.filter((n) => !toRemove.has(n.id));
      const ue = edges.filter((e) => !toRemove.has(e.source) && !toRemove.has(e.target));
      setEdges(ue);
      const repo = applyLayout(updated, ue);
      fireChange(repo, ue);
      return repo;
    });
    setSelectedNode(null);
  };

  const onNodeDragStop = useCallback((_event: React.MouseEvent, draggedNode: Node) => {
    if (draggedNode.id === 'root' || !rootNode) return;
    if (parentMap.get(draggedNode.id) !== 'root') return;
    setNodes((nds) => { const r = applyLayout(nds, edges); fireChange(r, edges); return r; });
  }, [rootNode, parentMap, setNodes, edges, fireChange, applyLayout]);

  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    setSelectedNode(sel.length === 1 ? sel[0].id : null);
  }, []);

  return (
    <div className="w-full h-full rounded-xl border border-border overflow-hidden bg-background">
      <ReactFlow
        nodes={enrichedNodes} edges={enrichedEdges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeDragStop={readOnly ? undefined : onNodeDragStop}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        fitView nodesDraggable={!readOnly} nodesConnectable={!readOnly} elementsSelectable
        minZoom={0.2} maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} className="!rounded-lg !border !border-border !shadow-sm" />
        {!readOnly && (
          <Panel position="top-right" className="flex gap-2">
            <Button size="sm" onClick={addChild} className="gap-1 shadow-md">
              <Plus className="h-4 w-4" /> Tópico
            </Button>
            {selectedNode && selectedNode !== 'root' && (
              <Button size="sm" variant="destructive" onClick={deleteSelected} className="gap-1 shadow-md">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
