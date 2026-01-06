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

import { NodeType, CustomNode } from './types';
import { BaseNode } from './components/BaseNode';
import { PreviewCanvas } from './components/PreviewCanvas';
import { Sidebar } from './components/Sidebar';

const nodeTypes = {
  floatNode: BaseNode,
  colorNode: BaseNode,
  vec2Node: BaseNode,
  vec3Node: BaseNode,
  vec4Node: BaseNode,
  timeNode: BaseNode,
  addNode: BaseNode,
  mulNode: BaseNode,
  subNode: BaseNode,
  divNode: BaseNode,
  powNode: BaseNode,
  absNode: BaseNode,
  sinNode: BaseNode,
  cosNode: BaseNode,
  tanNode: BaseNode,
  floorNode: BaseNode,
  ceilNode: BaseNode,
  minNode: BaseNode,
  maxNode: BaseNode,
  mixNode: BaseNode,
  stepNode: BaseNode,
  smoothstepNode: BaseNode,
  noiseNode: BaseNode,
  checkerNode: BaseNode,
  uvNode: BaseNode,
  normalNode: BaseNode,
  positionNode: BaseNode,
  materialNode: BaseNode,
};

const Flow: React.FC = () => {
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { deleteElements, fitView } = useReactFlow();

  const updateNodeData = useCallback((nodeId: string, key: string, value: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === nodeId) {
          if (key === 'value') {
            return { ...node, data: { ...node.data, value } };
          } else {
            return { 
              ...node, 
              data: { 
                ...node.data, 
                values: { ...(node.data.values || {}), [key]: value } 
              } 
            };
          }
        }
        return node;
      })
    );
  }, []);

  const resetToInitial = useCallback(() => {
    const outputId = 'output-1';
    const uvId = 'uv-1';
    const checkerId = 'checker-1';

    const initial: CustomNode[] = [
      {
        id: outputId,
        type: 'materialNode',
        position: { x: 600, y: 100 },
        data: { 
          label: 'Material Output', 
          inputs: ['color', 'roughness', 'metalness', 'emissive', 'normal', 'position'],
          values: { color: '#ffffff', roughness: 0.2, metalness: 0.8, emissive: '#000000', normal: 0, position: 0 },
          onChange: (k: string, v: any) => updateNodeData(outputId, k, v)
        },
      },
      {
        id: checkerId,
        type: 'checkerNode',
        position: { x: 300, y: 100 },
        data: { 
          label: 'Checker', 
          inputs: ['uv'],
          outputs: ['out'],
          onChange: (k: string, v: any) => updateNodeData(checkerId, k, v)
        },
      },
      {
        id: uvId,
        type: 'uvNode',
        position: { x: 50, y: 100 },
        data: { 
          label: 'UV', 
          value: 4.0,
          outputs: ['out'],
          onChange: (k: string, v: any) => updateNodeData(uvId, k, v)
        },
      }
    ];
    setNodes(initial);
    setEdges([
      { id: 'e1', source: uvId, target: checkerId, targetHandle: 'uv' },
      { id: 'e2', source: checkerId, target: outputId, targetHandle: 'color' }
    ]);
    setTimeout(() => fitView({ padding: 0.4 }), 50);
  }, [updateNodeData, fitView]);

  useEffect(() => { resetToInitial(); }, []);

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
    const id = `${type}-${Date.now()}`;
    const newNode: CustomNode = {
      id,
      type: `${type}Node`,
      position: { x: 100, y: 100 },
      data: {
        label: type.toUpperCase(),
        onChange: (k: string, v: any) => updateNodeData(id, k, v),
        inputs: [],
        outputs: ['out'],
        value: type === 'color' ? '#ffffff' : 0.5,
        values: {}
      },
    };

    switch (type) {
      case 'add': case 'mul': case 'sub': case 'div': case 'pow': case 'min': case 'max':
        newNode.data.inputs = ['a', 'b'];
        newNode.data.values = { a: 1.0, b: 1.0 };
        break;
      case 'abs': case 'sin': case 'cos': case 'tan': case 'floor': case 'ceil': case 'noise':
        newNode.data.inputs = ['in'];
        newNode.data.values = { in: 0.0 };
        break;
      case 'mix':
        newNode.data.inputs = ['a', 'b', 'alpha'];
        newNode.data.values = { a: 0.0, b: 1.0, alpha: 0.5 };
        break;
      case 'step':
        newNode.data.inputs = ['edge', 'in'];
        newNode.data.values = { edge: 0.5, in: 0.0 };
        break;
      case 'smoothstep':
        newNode.data.inputs = ['low', 'high', 'in'];
        newNode.data.values = { low: 0.0, high: 1.0, in: 0.0 };
        break;
      case 'checker':
        newNode.data.inputs = ['uv'];
        break;
      case 'vec2':
        newNode.data.inputs = ['x', 'y'];
        newNode.data.values = { x: 0, y: 0 };
        break;
      case 'vec3':
        newNode.data.inputs = ['x', 'y', 'z'];
        newNode.data.values = { x: 0, y: 0, z: 0 };
        break;
      case 'vec4':
        newNode.data.inputs = ['x', 'y', 'z', 'w'];
        newNode.data.values = { x: 0, y: 0, z: 0, w: 0 };
        break;
      case 'uv':
        newNode.data.label = 'UV Scale';
        newNode.data.value = 1.0;
        break;
    }

    setNodes((nds) => nds.concat(newNode));
  }, [updateNodeData]);

  return (
    <div className="flex flex-1 overflow-hidden h-full w-full bg-zinc-950">
      <Sidebar onAddNode={onAddNode} isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col relative">
        <div className="h-[40%] border-b border-zinc-900 bg-black">
          <PreviewCanvas nodes={nodes} edges={edges} />
        </div>
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            colorMode="dark"
            minZoom={0.1}
            maxZoom={4}
          >
            <Background color="#18181b" gap={20} size={1} />
            <Controls />
            <Panel position="top-right" className="flex gap-1">
              <button 
                onClick={() => deleteElements({ nodes: nodes.filter(n => n.selected), edges: edges.filter(e => e.selected) })} 
                className="p-1.5 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-500 hover:text-red-400 backdrop-blur-sm"
              >
                <Trash2 size={12} />
              </button>
              <button 
                onClick={resetToInitial} 
                className="p-1.5 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-500 hover:text-white backdrop-blur-sm"
              >
                <RotateCcw size={12} />
              </button>
            </Panel>
          </ReactFlow>
        </div>
      </div>
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