import React from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { NodeType } from '../types';
import { Circle, Hash, Box, Activity, Map, Move, Combine, Triangle } from 'lucide-react';

interface BaseNodeProps { id: string; data: any; type: string; selected?: boolean; }

const getHandleColor = (handleId: string) => {
  const id = handleId.toLowerCase();
  if (['color', 'emissive', 'alpha'].includes(id)) return '#3b82f6';
  if (['uv', 'normal', 'position', 'out'].includes(id)) return '#fbbf24';
  if (['x', 'y', 'z', 'w'].includes(id)) return '#ef4444';
  return '#71717a';
};

export const BaseNode: React.FC<BaseNodeProps> = ({ id, data, type, selected }) => {
  const edges = useEdges();
  const cleanType = type.replace('Node', '') as NodeType;
  const isTargetConnected = (hid: string) => edges.some(e => e.target === id && e.targetHandle === hid);

  const getIcon = () => {
    switch(cleanType) {
      case NodeType.COLOR: return <Circle size={10} />;
      case NodeType.FLOAT: return <Hash size={10} />;
      case NodeType.MATERIAL: return <Box size={10} />;
      case NodeType.UV: return <Map size={10} />;
      case NodeType.POSITION: return <Move size={10} />;
      case NodeType.MIX: return <Combine size={10} />;
      case NodeType.VEC2: case NodeType.VEC3: case NodeType.VEC4: return <Triangle size={10} />;
      default: return <Activity size={10} />;
    }
  };

  return (
    <div className={`min-w-[120px] rounded-sm border bg-zinc-950 transition-all ${selected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800 shadow-xl'}`}>
      <div className="px-2 py-1 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="text-blue-500 shrink-0">{getIcon()}</div>
          <span className="text-[9px] font-black uppercase tracking-tight text-zinc-300 truncate">{data.label}</span>
        </div>
      </div>

      <div className="p-2 space-y-2">
        {data.inputs?.map((input: string) => {
          const connected = isTargetConnected(input);
          return (
            <div key={input} className="flex flex-col relative">
              <div className="flex items-center justify-between mb-0.5">
                 <span className={`text-[8px] font-bold uppercase ${connected ? 'text-zinc-400' : 'text-zinc-600'}`}>{input}</span>
              </div>
              {!connected && (
                <div className="">
                  {(input.includes('color') || input === 'emissive') ? (
                    <div className="flex items-center gap-1 bg-zinc-900 rounded-sm border border-zinc-800 px-1">
                       <input type="color" value={data.values?.[input] || '#000000'} onChange={(e) => data.onChange?.(input, e.target.value)} className="w-full h-3 bg-transparent p-0 border-none cursor-pointer" />
                    </div>
                  ) : (
                    <input 
                      type="number" 
                      step="0.05" 
                      value={data.values?.[input] ?? 0} 
                      onChange={(e) => data.onChange?.(input, parseFloat(e.target.value))} 
                      className="w-full h-4 bg-zinc-900/50 text-zinc-400 px-1 rounded-sm border border-zinc-800 text-[8px] focus:outline-none focus:border-zinc-600" 
                    />
                  )}
                </div>
              )}
              <Handle type="target" position={Position.Left} id={input} style={{ backgroundColor: getHandleColor(input) }} className="!w-2 !h-2 !-left-[13px] border border-zinc-950" />
            </div>
          );
        })}

        {(cleanType === NodeType.FLOAT || cleanType === NodeType.COLOR || cleanType === NodeType.UV) && (
          <div className="pt-0.5">
            {cleanType === NodeType.COLOR ? (
               <div className="flex items-center gap-1 bg-zinc-900 rounded-sm border border-zinc-800 px-1">
                 <input type="color" value={data.value || '#ffffff'} onChange={(e) => data.onChange?.('value', e.target.value)} className="w-full h-4 bg-transparent p-0 cursor-pointer" />
               </div>
            ) : (
               <div className="relative group">
                 <input 
                   type="number" 
                   step="0.1" 
                   value={data.value ?? 1.0} 
                   onChange={(e) => data.onChange?.('value', parseFloat(e.target.value))} 
                   className="w-full h-4 bg-zinc-900/50 text-zinc-200 px-1.5 rounded-sm border border-zinc-800 text-[9px] focus:outline-none focus:border-blue-500/50" 
                 />
                 <div className="absolute right-1 top-0 bottom-0 flex items-center text-[7px] text-zinc-600 pointer-events-none font-mono">VAL</div>
               </div>
            )}
          </div>
        )}

        {data.outputs?.map((output: string) => (
          <div key={output} className="relative flex items-center justify-end h-3">
            <span className="text-[7px] font-bold uppercase text-zinc-600 mr-1.5">{output}</span>
            <Handle type="source" position={Position.Right} id={output} style={{ backgroundColor: getHandleColor(output) }} className="!w-2 !h-2 !-right-[13px] border border-zinc-950" />
          </div>
        ))}
      </div>
    </div>
  );
};