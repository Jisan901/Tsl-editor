import React, { memo } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';

interface BaseNodeProps { id: string; data: any; type: string; selected?: boolean; }

const getHandleColor = (handleId: string) => {
  const id = handleId.toLowerCase();
  if (['color', 'emissive', 'alpha'].includes(id)) return '#3b82f6';
  if (['uv', 'normal', 'position', 'out'].includes(id)) return '#fbbf24';
  if (['x', 'y', 'z', 'w', 'r', 'g', 'b', 'a'].includes(id)) return '#ef4444';
  if (['ao', 'roughness', 'metalness', 'in', 'opacity'].includes(id)) return '#d4d4d8'; 
  return '#71717a';
};

export const BaseNode: React.FC<BaseNodeProps> = memo(({ id, data, selected }) => {
  const edges = useEdges();
  const isTargetConnected = (hid: string) => edges.some(e => e.target === id && e.targetHandle === hid);

  // Icon can be passed in data (from registry)
  const Icon = data.icon || React.Fragment;

  return (
    <div className={`relative min-w-[120px] rounded-md border bg-zinc-950 transition-all ${selected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800 shadow-xl'}`}>
      
      <div className="overflow-hidden rounded-t-md">
        {/* Header */}
        <div className="px-2 py-1.5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="text-blue-500 shrink-0">
                  {data.icon && <data.icon size={10} />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight text-zinc-300 truncate">{data.label}</span>
            </div>
        </div>
      </div>

      {/* Body */}
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
                      onChange={(e) => data.onChange?.(input, e.target.value)} 
                      className="w-full h-4 bg-zinc-900/50 text-zinc-400 px-1 rounded-sm border border-zinc-800 text-[8px] focus:outline-none focus:border-zinc-600" 
                    />
                  )}
                </div>
              )}
              {/* Handle */}
              <Handle 
                type="target" 
                position={Position.Left} 
                id={input} 
                style={{ backgroundColor: getHandleColor(input) }} 
                className="!w-2.5 !h-2.5 !-left-[15px] border-2 border-zinc-950 transition-transform hover:scale-125" 
              />
            </div>
          );
        })}

        {/* Toggles for settings (Material Node) */}
        {data.meta?.settings && (
            <div className="mt-2 pt-2 border-t border-zinc-900 space-y-1.5">
                {(data.meta.settings as string[]).map(setting => (
                    <div key={setting} className="flex items-center justify-between px-1">
                        <span className="text-[7px] font-bold uppercase text-zinc-500">{setting.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <input 
                            type="checkbox" 
                            checked={!!data.values?.[setting]} 
                            onChange={(e) => data.onChange?.(setting, e.target.checked)}
                            className="w-3 h-3 bg-zinc-900 border-zinc-800 rounded focus:ring-0 text-blue-500 cursor-pointer accent-blue-500"
                        />
                    </div>
                ))}
            </div>
        )}
        
        {/* Legacy Support (if still used) */}
        {data.meta?.showTransparencyToggle && !data.meta?.settings && (
             <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900 px-1">
                <span className="text-[7px] font-bold uppercase text-zinc-500">Transparent</span>
                <input 
                    type="checkbox" 
                    checked={!!data.values?.transparent} 
                    onChange={(e) => data.onChange?.('transparent', e.target.checked)}
                    className="w-3 h-3 bg-zinc-900 border-zinc-800 rounded focus:ring-0 text-blue-500 cursor-pointer accent-blue-500"
                />
            </div>
        )}

        {/* Value Inputs for leaf nodes */}
        {(data.value !== undefined) && (
          <div className="pt-0.5">
             {typeof data.value === 'string' && data.value.startsWith('#') ? (
               <div className="flex items-center gap-1 bg-zinc-900 rounded-sm border border-zinc-800 px-1">
                 <input type="color" value={data.value || '#ffffff'} onChange={(e) => data.onChange?.('value', e.target.value)} className="w-full h-4 bg-transparent p-0 cursor-pointer" />
               </div>
            ) : (
               <div className="relative group">
                 <input 
                   type="number" 
                   step="0.1" 
                   value={data.value ?? 1.0} 
                   onChange={(e) => data.onChange?.('value', e.target.value)} 
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
            <Handle 
                type="source" 
                position={Position.Right} 
                id={output} 
                style={{ backgroundColor: getHandleColor(output) }} 
                className="!w-2.5 !h-2.5 !-right-[15px] border-2 border-zinc-950 transition-transform hover:scale-125" 
            />
          </div>
        ))}
      </div>
    </div>
  );
});