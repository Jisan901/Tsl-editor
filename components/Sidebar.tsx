import React, { useMemo } from 'react';
import { Grid, Settings2, Box } from 'lucide-react';
import { NODE_REGISTRY, NodeDefinition } from '../services/NodeRegistry';

interface SidebarProps { onAddNode: (type: string) => void; isOpen: boolean; toggle: () => void; }

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
  
  // Group nodes by category
  const categories = useMemo(() => {
    const groups: Record<string, NodeDefinition[]> = {};
    const order = ['Constants', 'Attributes', 'Math', 'Logic', 'Patterns & Textures', 'Tools', 'Output'];
    
    // Initialize groups in order
    order.forEach(k => groups[k] = []);
    
    NODE_REGISTRY.forEach(node => {
      if (!groups[node.category]) groups[node.category] = [];
      groups[node.category].push(node);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, []);

  return (
    <div className={`${isOpen ? 'w-44' : 'w-10'} transition-all bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0 z-10`}>
      <div className="p-3 border-b border-zinc-900 flex items-center justify-between">
        {isOpen && <span className="font-black text-zinc-200 tracking-tighter text-[11px]">TSL EDITOR</span>}
        <button onClick={toggle} className="p-1 text-zinc-500 hover:bg-zinc-900 rounded"><Grid size={14} /></button>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar pt-4 ${isOpen ? 'px-3' : 'hidden'}`}>
        {categories.map(([category, nodes]) => (
           <div key={category} className="mb-6">
             <div className="flex items-center gap-1.5 px-1 mb-2 text-zinc-600 font-bold text-[8px] uppercase tracking-wider">
                <Box size={10} /> {category}
             </div>
             <div className="grid grid-cols-1 gap-0.5">
                {nodes.map(node => (
                   <NodeItem 
                      key={node.type} 
                      label={node.label} 
                      icon={node.icon} 
                      onClick={() => onAddNode(node.type)} 
                   />
                ))}
             </div>
           </div>
        ))}
      </div>
      
      {isOpen && (
        <div className="p-3 border-t border-zinc-900 text-[9px] text-zinc-600 font-mono">
          TSL v0.182.0
        </div>
      )}
    </div>
  );
};