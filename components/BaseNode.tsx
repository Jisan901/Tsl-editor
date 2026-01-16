
import React, { memo } from 'react';
import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { useUI } from '../contexts/UIContext';

interface BaseNodeProps { id: string; data: any; type: string; selected?: boolean; }

const getHandleColor = (handleId: string) => {
  const id = handleId.toLowerCase();
  if (['color', 'emissive', 'alpha'].includes(id)) return '#3b82f6';
  if (['uv', 'normal', 'position', 'out'].includes(id)) return '#fbbf24';
  if (['x', 'y', 'z', 'w', 'r', 'g', 'b', 'a'].includes(id)) return '#ef4444';
  if (['ao', 'roughness', 'metalness', 'in', 'opacity'].includes(id)) return '#d4d4d8'; 
  return '#71717a';
};

// --- Optimized Input Row Component ---
// Uses useNodeConnections to only re-render this row when connections change.
const InputRow = memo(({ input, data, simpleMode }: { input: string, data: any, simpleMode: boolean }) => {
    const connections = useNodeConnections({ handleType: 'target', handleId: input });
    const isConnected = connections.length > 0;
    
    return (
        <div className="flex flex-col relative group">
            <div className={`flex items-center justify-between ${simpleMode ? 'mb-0' : 'mb-0.5'}`}>
                <span className={`${simpleMode ? 'text-[7px]' : 'text-[8px]'} font-bold uppercase ${isConnected ? 'text-zinc-400' : 'text-zinc-600'}`}>{input}</span>
            </div>
            
            {/* Control Widget (Hidden if connected) */}
            {!isConnected && (
                <div className={`${simpleMode ? 'opacity-50 group-hover:opacity-100 transition-opacity' : ''}`}>
                {(input.includes('color') || input === 'emissive') ? (
                    <div className={`flex items-center gap-1 bg-zinc-900 rounded-sm border border-zinc-800 ${simpleMode ? 'px-0.5 py-0 h-2.5' : 'px-1 h-3'}`}>
                        <input 
                            type="color" 
                            value={data.values?.[input] || '#000000'} 
                            onChange={(e) => data.onChange?.(input, e.target.value)} 
                            className="w-full h-full bg-transparent p-0 border-none cursor-pointer" 
                        />
                    </div>
                ) : (
                    <input 
                        type="number" 
                        step="0.05" 
                        value={data.values?.[input] ?? 0} 
                        onChange={(e) => data.onChange?.(input, e.target.value)} 
                        className={`w-full bg-zinc-900/50 text-zinc-400 px-1 rounded-sm border border-zinc-800 text-[8px] focus:outline-none focus:border-zinc-600 ${simpleMode ? 'h-3 text-[7px]' : 'h-4'}`}
                    />
                )}
                </div>
            )}
            
            <Handle 
                type="target" 
                position={Position.Left} 
                id={input} 
                style={{ backgroundColor: getHandleColor(input) }} 
                className={`!border-2 border-zinc-950 transition-transform hover:scale-125 ${simpleMode ? '!w-2 !h-2 !-left-[9px]' : '!w-2.5 !h-2.5 !-left-[15px]'}`} 
            />
        </div>
    );
});

export const BaseNode: React.FC<BaseNodeProps> = memo(({ id, data, selected }) => {
  const { simpleMode } = useUI();
  
  // Icon can be passed in data (from registry)
  const Icon = data.icon || React.Fragment;

  return (
    <div className={`relative min-w-[120px] rounded-md border bg-zinc-950 transition-all ${selected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800 shadow-xl'} ${simpleMode ? 'min-w-[100px]' : ''}`}>
      
      <div className="overflow-hidden rounded-t-md">
        {/* Header */}
        <div className={`px-2 flex items-center justify-between bg-zinc-900/40 border-b border-zinc-900 ${simpleMode ? 'py-1' : 'py-1.5'}`}>
            <div className="flex items-center gap-1.5 overflow-hidden">
                {!simpleMode && (
                    <div className="text-blue-500 shrink-0">
                        {data.icon && <data.icon size={10} />}
                    </div>
                )}
                <span className={`${simpleMode ? 'text-[8px]' : 'text-[9px]'} font-black uppercase tracking-tight text-zinc-300 truncate`}>{data.label}</span>
            </div>
        </div>
      </div>

      {/* Body */}
      <div className={`${simpleMode ? 'p-1.5 space-y-1' : 'p-2 space-y-2'}`}>
        
        {/* Inputs */}
        {data.inputs?.map((input: string) => (
            <InputRow key={input} input={input} data={data} simpleMode={simpleMode} />
        ))}

        {/* Toggles (Settings) & Enums */}
        {(data.meta?.settings || data.meta?.enums) && (
            <div className={`border-t border-zinc-900 ${simpleMode ? 'mt-1 pt-1 space-y-1' : 'mt-2 pt-2 space-y-1.5'}`}>
                {/* Checkboxes */}
                {data.meta.settings?.map((setting: string) => (
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

                {/* Dropdowns */}
                {data.meta.enums && Object.entries(data.meta.enums).map(([key, config]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between px-1">
                         <span className="text-[7px] font-bold uppercase text-zinc-500">{key}</span>
                         <select 
                            value={data.values?.[key] ?? 0}
                            onChange={(e) => data.onChange?.(key, parseInt(e.target.value))}
                            className="bg-zinc-900 text-zinc-300 text-[8px] border border-zinc-800 rounded px-1 py-0.5 focus:outline-none cursor-pointer hover:bg-zinc-800 max-w-[60px]"
                         >
                            {Object.entries(config.options).map(([label, val]: [string, any]) => (
                                <option key={label} value={val}>{label}</option>
                            ))}
                         </select>
                    </div>
                ))}
            </div>
        )}
        
        {/* Legacy Support */}
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

        {/* Value Inputs for leaf nodes (Main Value) */}
        {(data.value !== undefined) && (
          <div className="pt-0.5">
             {typeof data.value === 'string' && data.value.startsWith('#') ? (
               <div className={`flex items-center gap-1 bg-zinc-900 rounded-sm border border-zinc-800 ${simpleMode ? 'px-0.5 h-3' : 'px-1 h-4'}`}>
                 <input type="color" value={data.value || '#ffffff'} onChange={(e) => data.onChange?.('value', e.target.value)} className="w-full h-full bg-transparent p-0 cursor-pointer" />
               </div>
            ) : (
               <div className="relative group">
                 <input 
                   type="number" 
                   step="0.1" 
                   value={data.value ?? 1.0} 
                   onChange={(e) => data.onChange?.('value', e.target.value)} 
                   className={`w-full bg-zinc-900/50 text-zinc-200 px-1.5 rounded-sm border border-zinc-800 text-[9px] focus:outline-none focus:border-blue-500/50 ${simpleMode ? 'h-3' : 'h-4'}`} 
                 />
                 {!simpleMode && <div className="absolute right-1 top-0 bottom-0 flex items-center text-[7px] text-zinc-600 pointer-events-none font-mono">VAL</div>}
               </div>
            )}
          </div>
        )}

        {/* Outputs */}
        {data.outputs?.map((output: string) => (
          <div key={output} className={`relative flex items-center justify-end ${simpleMode ? 'h-2' : 'h-3'}`}>
            <span className={`${simpleMode ? 'text-[6px]' : 'text-[7px]'} font-bold uppercase text-zinc-600 mr-1.5`}>{output}</span>
            <Handle 
                type="source" 
                position={Position.Right} 
                id={output} 
                style={{ backgroundColor: getHandleColor(output) }} 
                className={`!border-2 border-zinc-950 transition-transform hover:scale-125 ${simpleMode ? '!w-2 !h-2 !-right-[9px]' : '!w-2.5 !h-2.5 !-right-[15px]'}`} 
            />
          </div>
        ))}
      </div>
    </div>
  );
});
