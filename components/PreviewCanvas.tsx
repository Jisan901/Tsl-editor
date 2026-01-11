import React, { useState } from 'react';
import { CustomNode } from '../types';
import { Edge } from '@xyflow/react';
import { Maximize2, Minimize2, Box, Circle, Disc, Layers, Boxes } from 'lucide-react';
import { useMaterialCompiler } from '../hooks/useMaterialCompiler';
import { PreviewScene } from './PreviewScene';

interface PreviewCanvasProps {
  nodes: CustomNode[];
  edges: Edge[];
}

const PreviewCanvasComponent: React.FC<PreviewCanvasProps> = ({ nodes, edges }) => {
  const [activeModel, setActiveModel] = useState<'sphere' | 'box' | 'torus' | 'intersection' | 'cubes'>('cubes');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { material, error } = useMaterialCompiler(nodes, edges);

  const previewSize = isExpanded ? 'w-[500px] h-[500px]' : 'w-56 h-56';

  return (
    <div className={`relative ${previewSize} bg-[#080808] rounded-lg overflow-hidden border border-zinc-800 shadow-2xl group transition-all duration-300`}>
      
      {/* 3D Scene */}
      <PreviewScene material={material} activeModel={activeModel} />
      
      {/* View Selector */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={() => setActiveModel('sphere')} title="Sphere" className={`p-1 rounded-sm border ${activeModel === 'sphere' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Circle size={10} />
         </button>
         <button onClick={() => setActiveModel('box')} title="Box" className={`p-1 rounded-sm border ${activeModel === 'box' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Box size={10} />
         </button>
         <button onClick={() => setActiveModel('torus')} title="Torus" className={`p-1 rounded-sm border ${activeModel === 'torus' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Disc size={10} />
         </button>
         <div className="w-px h-3 bg-zinc-700/50 self-center mx-0.5" />
         <button onClick={() => setActiveModel('intersection')} title="Depth Intersection Scene" className={`p-1 rounded-sm border ${activeModel === 'intersection' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Layers size={10} />
         </button>
         <button onClick={() => setActiveModel('cubes')} title="Overlapping Cubes Cluster" className={`p-1 rounded-sm border ${activeModel === 'cubes' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Boxes size={10} />
         </button>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="p-1.5 rounded-sm bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-zinc-500 hover:text-white"
        >
          {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">GPU Live</span>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4 pointer-events-none">
          <div className="bg-zinc-950 border border-red-900/40 p-3 rounded-md shadow-2xl text-center">
             <div className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1">Shader Error</div>
             <div className="text-[7px] text-zinc-400 line-clamp-3 leading-tight font-mono">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PreviewCanvas = React.memo(PreviewCanvasComponent, (prev, next) => {
  // Memoization check
  if (prev.edges !== next.edges) return false;
  if (prev.nodes.length !== next.nodes.length) return false;
  for (let i = 0; i < prev.nodes.length; i++) {
    if (prev.nodes[i] !== next.nodes[i] && prev.nodes[i].data !== next.nodes[i].data) return false;
  }
  return true;
});