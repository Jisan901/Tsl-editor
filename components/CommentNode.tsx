
import React, { memo } from 'react';
import { useUI } from '../contexts/UIContext';
import { MessageSquare } from 'lucide-react';

interface CommentNodeProps { id: string; data: any; selected?: boolean; }

export const CommentNode: React.FC<CommentNodeProps> = memo(({ id, data, selected }) => {
  const { simpleMode } = useUI();

  return (
    <div className={`relative rounded-md border bg-yellow-500/10 transition-all ${selected ? 'border-yellow-500 ring-1 ring-yellow-500/50' : 'border-yellow-500/30 hover:border-yellow-500/50'} ${simpleMode ? 'min-w-[120px]' : 'min-w-[200px]'}`}>
      
      {/* Header */}
      <div className={`px-2 flex items-center gap-2 bg-yellow-500/20 border-b border-yellow-500/20 rounded-t-md ${simpleMode ? 'py-1' : 'py-1.5'}`}>
          {!simpleMode && <MessageSquare size={12} className="text-yellow-500" />}
          <span className={`${simpleMode ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-wider text-yellow-500`}>{data.label}</span>
      </div>

      {/* Body */}
      <div className="p-0">
        <textarea 
            className={`w-full bg-transparent text-yellow-100/90 resize-none outline-none font-mono nodrag ${simpleMode ? 'text-[9px] p-1.5 min-h-[60px]' : 'text-[10px] p-2 min-h-[100px]'}`}
            value={data.value}
            onChange={(e) => data.onChange?.('value', e.target.value)}
            placeholder="Type your comment here..."
            onKeyDown={(e) => e.stopPropagation()} 
        />
      </div>
    </div>
  );
});
