import React, { memo, useRef } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { Image as ImageIcon, Upload } from 'lucide-react';

interface TextureNodeProps { id: string; data: any; selected?: boolean; }

const DEFAULT_TEXTURE = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg';

export const TextureNode: React.FC<TextureNodeProps> = memo(({ id, data, selected }) => {
  const edges = useEdges();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTargetConnected = (hid: string) => edges.some(e => e.target === id && e.targetHandle === hid);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      data.onChange?.('value', url);
    }
  };

  const currentImage = data.value || DEFAULT_TEXTURE;

  return (
    <div className={`relative min-w-[120px] rounded-md border bg-zinc-950 transition-all ${selected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800 shadow-xl'}`}>
      
      {/* Header */}
      <div className="overflow-hidden rounded-t-md">
        <div className="px-2 py-1.5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="text-blue-500 shrink-0"><ImageIcon size={10} /></div>
                <span className="text-[9px] font-black uppercase tracking-tight text-zinc-300 truncate">{data.label}</span>
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-2 space-y-2">
        {/* Preview Area */}
        <div 
          className="relative w-full h-16 bg-black rounded-sm border border-zinc-800 overflow-hidden group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
            <img src={currentImage} alt="Texture" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={12} className="text-white" />
            </div>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
            />
        </div>

        {/* Dynamic Inputs */}
        {data.inputs?.map((input: string) => {
          const connected = isTargetConnected(input);
          return (
            <div key={input} className="flex flex-col relative">
              <div className="flex items-center justify-between mb-0.5">
                 <span className={`text-[8px] font-bold uppercase ${connected ? 'text-zinc-400' : 'text-zinc-600'}`}>{input}</span>
              </div>
              {!connected && input !== 'uv' && (
                  <input 
                    type="number" 
                    step="0.05" 
                    value={data.values?.[input] ?? 0} 
                    onChange={(e) => data.onChange?.(input, parseFloat(e.target.value))} 
                    className="w-full h-4 bg-zinc-900/50 text-zinc-400 px-1 rounded-sm border border-zinc-800 text-[8px] focus:outline-none focus:border-zinc-600" 
                  />
              )}
              <Handle 
                type="target" 
                position={Position.Left} 
                id={input} 
                style={{ backgroundColor: input === 'uv' ? '#fbbf24' : '#d4d4d8' }} 
                className="!w-2.5 !h-2.5 !-left-[15px] border-2 border-zinc-950 transition-transform hover:scale-125" 
              />
            </div>
          );
        })}

        {/* Output */}
        <div className="relative flex items-center justify-end h-3 pt-1">
          <span className="text-[7px] font-bold uppercase text-zinc-600 mr-1.5">RGB</span>
          <Handle 
              type="source" 
              position={Position.Right} 
              id="out" 
              style={{ backgroundColor: '#3b82f6' }} 
              className="!w-2.5 !h-2.5 !-right-[15px] border-2 border-zinc-950 transition-transform hover:scale-125" 
          />
        </div>
      </div>
    </div>
  );
});