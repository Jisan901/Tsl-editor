import React from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  title: string;
  onClose: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, title, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col h-[600px] relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 select-none">
           <span className="font-bold text-zinc-200 text-xs uppercase tracking-wide">{title}</span>
           <div className="flex items-center gap-2">
             <button 
                onClick={handleCopy} 
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${copied ? 'bg-green-500/10 text-green-500' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
             >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
             </button>
             <button 
                onClick={onClose} 
                className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-colors"
                aria-label="Close"
             >
               <X size={14} />
             </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-[#0d0d0d] p-4 custom-scrollbar">
           <pre className="font-mono text-[10px] text-blue-300 leading-relaxed whitespace-pre-wrap break-all select-text">
             <code>{code}</code>
           </pre>
        </div>
      </div>
    </div>
  );
};