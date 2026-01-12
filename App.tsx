
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
import { Trash2, RotateCcw } from 'lucide-react';

import { CustomNode, NodeType } from './types';
import { PreviewCanvas } from './components/PreviewCanvas';
import { Sidebar } from './components/Sidebar';
import { MenuBar } from './components/MenuBar';
import { CodeViewer } from './components/CodeViewer';
import { nodeTypes, getNodeDefinition } from './services/NodeRegistry';
import { CodeGenerator } from './services/CodeGenerator';
import { EXAMPLES } from './services/examples';

const Flow: React.FC = () => {
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Export State
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [exportTitle, setExportTitle] = useState('');
  const [debugShader, setDebugShader] = useState<{ vertexShader: string, fragmentShader: string } | null>(null);
  
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

  // --- Example Loading ---
  const loadExample = useCallback((key: string) => {
      const example = EXAMPLES.find(e => e.key === key);
      if (example) {
          const { nodes: newNodes, edges: newEdges } = example.generate(createNode);
          setNodes(newNodes);
          setEdges(newEdges);
          setTimeout(() => fitView({ padding: 0.2 }), 100);
      } else {
          console.warn(`Example ${key} not found.`);
      }
  }, [createNode, fitView]);

  const handleReset = useCallback(() => {
     if(confirm("Reset to default material?")) {
        loadExample('standard');
     }
  }, [loadExample]);


  useEffect(() => {
    // Initial Load
    loadExample('hologram');
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
            const hydratedNodes = json.nodes.map((n: any) => {
                const def = getNodeDefinition(n.type);
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
      } else if (type === 'glsl' || type === 'wgsl') {
          if (debugShader) {
              setExportTitle(`${type.toUpperCase()} Shader Source`);
              setExportCode(`// --- VERTEX SHADER ---\n\n${debugShader.vertexShader}\n\n// --- FRAGMENT SHADER ---\n\n${debugShader.fragmentShader}`);
          } else {
              setExportTitle(`${type.toUpperCase()} Shader Source`);
              setExportCode(`// Shader source not available yet.\n// Ensure the preview is running and has compiled successfully.`);
          }
      }
  }, [nodes, edges, debugShader]);


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
            fitView
            >
            <Background color="#111113" gap={20} size={1} />
            <Controls />
            
            <Panel position="top-right" className="z-20">
                <PreviewCanvas nodes={nodes} edges={edges} onShaderUpdate={setDebugShader} />
            </Panel>

            <Panel position="bottom-right" className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded shadow-lg z-50">
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
                    onClick={handleReset} 
                    className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition-colors font-bold text-[8px] uppercase"
                    title="Reset to Default"
                >
                    <RotateCcw size={10} /> Reset
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
