
import React from 'react';
import { 
  Plus, Settings2, Grid, MousePointer2, Zap, Circle, Activity, 
  Waves, Hash, Divide, Minus, X, Combine, Maximize2, Minimize2,
  Square, Triangle, Type, Move, Target
} from 'lucide-react';

interface SidebarProps { onAddNode: (type: string) => void; isOpen: boolean; toggle: () => void; }

const NodeCategory: React.FC<{ title: string; children: React.ReactNode; icon: any }> = ({ title, children, icon: Icon }) => (
  <div className="mb-6">
    <div className="flex items-center gap-1.5 px-1 mb-2 text-zinc-600 font-bold text-[8px] uppercase tracking-wider">
      <Icon size={10} /> {title}
    </div>
    <div className="grid grid-cols-1 gap-0.5">{children}</div>
  </div>
);

const NodeItem: React.FC<{ label: string; onClick: () => void; icon: any }> = ({ label, onClick, icon: Icon }) => (
  <button 
    onClick={onClick} 
    className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-sm transition-all group border border-transparent hover:border-zinc-800"
  >
    <Icon size={12} className="text-zinc-600 group-hover:text-blue-500" />
    {label}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode, isOpen, toggle }) => {
  return (
    <div className={`${isOpen ? 'w-44' : 'w-10'} transition-all bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0 z-10`}>
      <div className="p-3 border-b border-zinc-900 flex items-center justify-between">
        {isOpen && <span className="font-black text-zinc-200 tracking-tighter text-[11px]">TSL EDITOR</span>}
        <button onClick={toggle} className="p-1 text-zinc-500 hover:bg-zinc-900 rounded"><Grid size={14} /></button>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar pt-4 ${isOpen ? 'px-3' : 'hidden'}`}>
        <NodeCategory title="Constants" icon={Hash}>
          <NodeItem label="Float" icon={Hash} onClick={() => onAddNode('float')} />
          <NodeItem label="Color" icon={Circle} onClick={() => onAddNode('color')} />
          <NodeItem label="Vec2" icon={Square} onClick={() => onAddNode('vec2')} />
          <NodeItem label="Vec3" icon={Triangle} onClick={() => onAddNode('vec3')} />
        </NodeCategory>

        <NodeCategory title="Attributes" icon={Target}>
          <NodeItem label="UV Scale" icon={Grid} onClick={() => onAddNode('uv')} />
          <NodeItem label="Normal" icon={Activity} onClick={() => onAddNode('normal')} />
          <NodeItem label="Position" icon={Move} onClick={() => onAddNode('position')} />
          <NodeItem label="Time" icon={Zap} onClick={() => onAddNode('time')} />
        </NodeCategory>

        <NodeCategory title="Math" icon={Activity}>
          <NodeItem label="Add" icon={Plus} onClick={() => onAddNode('add')} />
          <NodeItem label="Multiply" icon={X} onClick={() => onAddNode('mul')} />
          <NodeItem label="Subtract" icon={Minus} onClick={() => onAddNode('sub')} />
          <NodeItem label="Power" icon={Zap} onClick={() => onAddNode('pow')} />
          <NodeItem label="Sin / Cos" icon={Waves} onClick={() => onAddNode('sin')} />
          <NodeItem label="Floor" icon={Minimize2} onClick={() => onAddNode('floor')} />
        </NodeCategory>

        <NodeCategory title="Logic" icon={Combine}>
          <NodeItem label="Mix (Lerp)" icon={Combine} onClick={() => onAddNode('mix')} />
          <NodeItem label="Step" icon={Type} onClick={() => onAddNode('step')} />
          <NodeItem label="Smoothstep" icon={Waves} onClick={() => onAddNode('smoothstep')} />
        </NodeCategory>

        <NodeCategory title="Patterns" icon={Grid}>
          <NodeItem label="Checker" icon={Grid} onClick={() => onAddNode('checker')} />
          <NodeItem label="Noise" icon={Activity} onClick={() => onAddNode('noise')} />
        </NodeCategory>
      </div>
      
      {isOpen && (
        <div className="p-3 border-t border-zinc-900 text-[9px] text-zinc-600 font-mono">
          TSL v0.170.0
        </div>
      )}
    </div>
  );
};
