import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges,
  addEdge,
  Connection,
  Edge,
  ReactFlowProvider,
  Panel,
  OnNodesChange,
  OnEdgesChange,
  useReactFlow
} from '@xyflow/react';
import { Trash2 } from 'lucide-react';

import { CustomNode, NodeType } from './types';
import { PreviewCanvas } from './components/PreviewCanvas';
import { Sidebar } from './components/Sidebar';
import { MenuBar } from './components/MenuBar';
import { CodeViewer } from './components/CodeViewer';
import { nodeTypes, getNodeDefinition } from './services/NodeRegistry';
import { CodeGenerator } from './services/CodeGenerator';

const Flow: React.FC = () => {
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Export State
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [exportTitle, setExportTitle] = useState('');
  
  const { deleteElements, fitView, setViewport } = useReactFlow();

  const updateNodeData = useCallback((nodeId: string, key: string, value: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === nodeId) {
          const newData = { ...node.data };
          if (key === 'value') {
            newData.value = value;
          } else {
            newData.values = { ...(node.data.values || {}), [key]: value };
          }
          return { ...node, data: newData };
        }
        return node;
      })
    );
  }, []);

  const createNode = useCallback((type: string, position: {x: number, y: number}, id?: string) => {
     const def = getNodeDefinition(type);
     if (!def) return null;

     const nodeId = id || `${def.type}-${Date.now()}`;
     
     const newNode: CustomNode = {
        id: nodeId,
        type: `${def.type}Node`,
        position,
        data: {
           label: def.label,
           inputs: [...def.inputs], 
           outputs: [...def.outputs],
           value: def.initialValue,
           values: { ...def.initialValues }, 
           icon: def.icon,
           meta: def.meta,
           onChange: (k: string, v: any) => updateNodeData(nodeId, k, v),
        }
     };
     return newNode;
  }, [updateNodeData]);

  // --- Initial Setup & Examples ---
  const loadExample = useCallback((key: string) => {
     const materialNode = createNode(NodeType.MATERIAL, { x: 800, y: 100 }, 'out');
     let newNodes: CustomNode[] = [materialNode!];
     let newEdges: Edge[] = [];

     if (key === 'basic') {
        const checker = createNode(NodeType.CHECKER, { x: 450, y: 150 }, 'check');
        const uv = createNode(NodeType.UV, { x: 150, y: 150 }, 'uv');
        if (uv) uv.data.value = 4.0;
        newNodes.push(checker!, uv!);
        newEdges = [
            { id: 'e1', source: 'uv', target: 'check', targetHandle: 'uv' },
            { id: 'e2', source: 'check', target: 'out', targetHandle: 'color' }
        ];
     } else if (key === 'depth') {
        // Viewport Depth Demo (Texture read)
        const depth = createNode(NodeType.VIEWPORT_DEPTH_TEXTURE, { x: 100, y: 150 }, 'depth');
        const linear = createNode(NodeType.LINEAR_DEPTH, { x: 300, y: 150 }, 'linear');
        const remap = createNode(NodeType.REMAP, { x: 500, y: 150 }, 'remap');
        // Remap default values for depth
        if (remap && remap.data.values) {
            remap.data.values.inLow = 0;
            remap.data.values.inHigh = 20; // approximate view range
            remap.data.values.outLow = 0;
            remap.data.values.outHigh = 1;
        }
        
        newNodes.push(depth!, linear!, remap!);
        newEdges = [
            { id: 'e1', source: 'depth', target: 'linear', targetHandle: 'depth' },
            { id: 'e2', source: 'linear', target: 'remap', targetHandle: 'in' },
            { id: 'e3', source: 'remap', target: 'out', targetHandle: 'color' }
        ];
     } else if (key === 'fragment_depth') {
        // Viewport Depth Constant (Current Fragment)
        const depth = createNode(NodeType.VIEWPORT_DEPTH, { x: 100, y: 150 }, 'depth');
        // Visualize depth (0..1) directly on color
        newNodes.push(depth!);
        newEdges = [
            { id: 'e1', source: 'depth', target: 'out', targetHandle: 'color' }
        ];
     } else if (key === 'noise') {
        const noise = createNode(NodeType.SIMPLEX_NOISE_2D, { x: 300, y: 150 }, 'noise');
        const time = createNode(NodeType.TIME, { x: 50, y: 50 }, 'time');
        const uv = createNode(NodeType.UV, { x: 50, y: 200 }, 'uv');
        const add = createNode(NodeType.ADD, { x: 180, y: 150 }, 'add');
        
        newNodes.push(noise!, time!, uv!, add!);
        newEdges = [
            { id: 'e1', source: 'uv', target: 'add', targetHandle: 'b' },
            { id: 'e2', source: 'time', target: 'add', targetHandle: 'a' },
            { id: 'e3', source: 'add', target: 'noise', targetHandle: 'uv' },
            { id: 'e4', source: 'noise', target: 'out', targetHandle: 'color' }
        ];
     } else if (key === 'fresnel') {
        const normal = createNode(NodeType.NORMAL, { x: 100, y: 100 }, 'n');
        const view = createNode(NodeType.VEC3, { x: 100, y: 250 }, 'v'); 
        const dot = createNode(NodeType.DOT, { x: 300, y: 150 }, 'dot');
        const oneminus = createNode(NodeType.ONE_MINUS, { x: 450, y: 150 }, 'inv');
        const pow = createNode(NodeType.POW, { x: 600, y: 150 }, 'pow');
        if(pow && pow.data.values) pow.data.values.b = 3.0;

        newNodes.push(normal!, dot!, oneminus!, pow!);
        newEdges = [
             { id: 'e1', source: 'n', target: 'out', targetHandle: 'color' }
        ];
     }

     setNodes(newNodes);
     setEdges(newEdges);
     setTimeout(() => fitView({ padding: 0.2 }), 100);

  }, [createNode, fitView]);


  useEffect(() => {
    loadExample('basic');
  }, [loadExample]);

  // --- Save / Load / Export Logic ---
  
  const handleSave = useCallback(() => {
    const data = { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } }; 
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tsl-graph-${Date.now()}.json`;
    link.click();
  }, [nodes, edges]);

  const handleLoad = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.nodes && json.edges) {
            // Rehydrate nodes (restore functions like onChange)
            const hydratedNodes = json.nodes.map((n: any) => {
                const def = getNodeDefinition(n.type);
                // Merge loaded data with registry definition to ensure functions/icons exist
                return {
                    ...n,
                    data: {
                        ...n.data,
                        icon: def?.icon,
                        onChange: (k: string, v: any) => updateNodeData(n.id, k, v)
                    }
                };
            });
            setNodes(hydratedNodes);
            setEdges(json.edges);
            setTimeout(() => fitView(), 100);
        }
      } catch(err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }, [updateNodeData, fitView]);

  const handleExport = useCallback((type: 'tsl' | 'wgsl' | 'glsl') => {
      if (type === 'tsl') {
          const code = CodeGenerator.generateTSL(nodes, edges);
          setExportTitle('Three.js Material (TSL)');
          setExportCode(code);
      } else {
          // Placeholder for WGSL/GLSL as it requires runtime renderer hook extraction
          const placeholder = `// Exporting to ${type.toUpperCase()} from pure Node Graph is not yet fully supported without active renderer context.\n// \n// However, you can use the 'Three.js Material (TSL)' export to generate the code that creates this shader.`;
          setExportTitle(`${type.toUpperCase()} Shader`);
          setExportCode(placeholder);
      }
  }, [nodes, edges]);


  // --- Flow Callbacks ---

  const onNodesChange: OnNodesChange<CustomNode> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges<CustomNode>(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const filteredEdges = eds.filter((e) => !(e.target === params.target && e.targetHandle === params.targetHandle));
        return addEdge(params, filteredEdges);
      });
    },
    []
  );

  const onAddNode = useCallback((type: string) => {
    const newNode = createNode(type, { x: 200, y: 200 });
    if (newNode) setNodes((nds) => nds.concat(newNode));
  }, [createNode]);

  const handleDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    }
  }, [nodes, edges, deleteElements]);

  return (
    <div className="flex flex-col w-full h-full bg-zinc-950">
      
      {/* Top Menu */}
      <MenuBar onSave={handleSave} onLoad={handleLoad} onExport={handleExport} onLoadExample={loadExample} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar onAddNode={onAddNode} isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex-1 relative">
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            colorMode="dark"
            >
            <Background color="#111113" gap={20} size={1} />
            <Controls />
            
            <Panel position="top-right" className="z-20">
                <PreviewCanvas nodes={nodes} edges={edges} />
            </Panel>

            <Panel position="bottom-right" className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded shadow-lg">
                <button 
                onClick={handleDeleteSelected} 
                className="p-1.5 bg-zinc-800 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded transition-colors"
                title="Delete Selected"
                >
                <Trash2 size={12} />
                </button>
                <div className="w-px h-3 bg-zinc-800" />
                <button 
                onClick={() => { if(confirm("Clear canvas?")) { setNodes([]); setEdges([]); }}} 
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors font-bold text-[8px] uppercase"
                >
                Clear
                </button>
                <button 
                onClick={() => loadExample('basic')} 
                className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors font-bold text-[8px] uppercase"
                >
                Reset
                </button>
            </Panel>
            </ReactFlow>
        </div>
      </div>

      {exportCode && (
          <CodeViewer 
             code={exportCode} 
             title={exportTitle} 
             onClose={() => setExportCode(null)} 
          />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ReactFlowProvider>
    <div className="w-screen h-screen flex bg-zinc-950 text-zinc-200 overflow-hidden text-[11px] font-sans">
      <Flow />
    </div>
  </ReactFlowProvider>
);

export default App;