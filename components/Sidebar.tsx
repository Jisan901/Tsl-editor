
import React, { useMemo, useState } from 'react';
import { Grid, Box, Search } from 'lucide-react';
import { NODE_REGISTRY, NodeDefinition } from '../services/NodeRegistry';

interface SidebarProps { onAddNode: (type: string) => void; isOpen: boolean; toggle: () => void; }

const NodeItem: React.FC<{ label: string; onClick: () => void; icon: any }> = ({ label, onClick, icon: Icon }) => (
  <button 
    onClick={onClick} 
    className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-sm transition-all group border border-transparent hover:border-zinc-800 w-full"
  >
    <Icon size={12} className="text-zinc-600 group-hover:text-blue-500 shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode, isOpen, toggle }) => {
  const [search, setSearch] = useState('');

  // Group nodes by category
  const categories = useMemo(() => {
    const groups: Record<string, NodeDefinition[]> = {};
    const order = ['Constants', 'Attributes', 'Math', 'Vectors', 'Logic', 'Patterns & Textures', 'Depth', 'Tools', 'Output'];
    
    // Initialize groups
    order.forEach(k => groups[k] = []);
    
    NODE_REGISTRY.forEach(node => {
      // Filter by search
      if (search && !node.label.toLowerCase().includes(search.toLowerCase()) && !node.category.toLowerCase().includes(search.toLowerCase())) {
          return;
      }

      if (!groups[node.category]) groups[node.category] = [];
      groups[node.category].push(node);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [search]);

  return (
    <div className={`${isOpen ? 'w-48' : 'w-10'} transition-all bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0 z-10 duration-300`}>
      <div className="p-3 border-b border-zinc-900 flex items-center justify-between shrink-0 h-10">
        {isOpen && <span className="font-black text-zinc-200 tracking-tighter text-[11px]">NODES</span>}
        <button onClick={toggle} className="p-1 text-zinc-500 hover:bg-zinc-900 rounded transition-colors"><Grid size={14} /></button>
      </div>
      
      {isOpen && (
          <div className="p-3 pb-0">
            <div className="relative">
                <Search className="absolute left-2 top-1.5 text-zinc-600" size={12} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 pl-7 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-700 placeholder-zinc-700"
                />
            </div>
          </div>
      )}

      <div className={`flex-1 overflow-y-auto custom-scrollbar pt-2 ${isOpen ? 'px-3' : 'hidden'}`}>
        {categories.map(([category, nodes]) => (
           <div key={category} className="mb-4">
             <div className="flex items-center gap-1.5 px-1 mb-1 text-zinc-600 font-bold text-[8px] uppercase tracking-wider sticky top-0 bg-zinc-950 py-1 z-10">
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
    </div>
  );
};
