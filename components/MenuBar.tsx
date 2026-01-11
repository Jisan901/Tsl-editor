import React, { useRef } from 'react';
import { Save, FolderOpen, FileCode, BookOpen } from 'lucide-react';

interface MenuBarProps {
  onSave: () => void;
  onLoad: (file: File) => void;
  onExport: (type: 'tsl' | 'wgsl' | 'glsl') => void;
  onLoadExample: (key: string) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ onSave, onLoad, onExport, onLoadExample }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onLoad(e.target.files[0]);
      e.target.value = ''; // Reset
    }
  };

  return (
    <div className="h-9 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-3 select-none">
      <div className="flex items-center gap-1">
        <span className="font-black text-zinc-100 tracking-tighter text-[12px] mr-4 flex items-center gap-2">
            TSL <span className="text-zinc-600 font-normal">LAB</span>
        </span>
        
        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded transition-colors text-[10px] font-medium">
          <FolderOpen size={12} /> Load
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

        <button onClick={onSave} className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded transition-colors text-[10px] font-medium">
          <Save size={12} /> Save
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <div className="relative group">
            <button className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded transition-colors text-[10px] font-medium">
                <BookOpen size={12} /> Examples
            </button>
             <div className="absolute top-full left-0 mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl overflow-hidden hidden group-hover:block z-50">
                <button onClick={() => onLoadExample('basic')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    Basic UV
                </button>
                <button onClick={() => onLoadExample('noise')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    Noise
                </button>
                <button onClick={() => onLoadExample('depth')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    Viewport Depth Tex
                </button>
                 <button onClick={() => onLoadExample('fragment_depth')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    Fragment Depth
                </button>
                <button onClick={() => onLoadExample('fresnel')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    Fresnel
                </button>
            </div>
        </div>
        
        <div className="relative group">
            <button className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded transition-colors text-[10px] font-medium">
                <FileCode size={12} /> Export
            </button>
            
            <div className="absolute top-full left-0 mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl overflow-hidden hidden group-hover:block z-50">
                <button onClick={() => onExport('tsl')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    Three.js Material (TSL)
                </button>
                <button onClick={() => onExport('wgsl')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    WGSL Shader
                </button>
                <button onClick={() => onExport('glsl')} className="w-full text-left px-3 py-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    GLSL Shader
                </button>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[9px] text-zinc-600">
         <a href="https://github.com/mrdoob/three.js" target="_blank" className="hover:text-zinc-400 transition-colors">Three.js r182</a>
      </div>
    </div>
  );
};