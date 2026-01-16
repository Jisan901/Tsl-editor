
import React, { useEffect, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { CodeJar } from 'codejar';
import Prism from 'prismjs';

interface CodeViewerProps {
  code: string;
  title: string;
  onClose: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, title, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const jarRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current) {
        const highlight = (editor: HTMLElement) => {
            const text = editor.textContent || "";
            // Use javascript highlighting for TSL, and it works reasonably for GLSL/WGSL in simple mode
            if (Prism.languages.javascript) {
                 editor.innerHTML = Prism.highlight(text, Prism.languages.javascript, 'javascript');
            } else {
                 editor.textContent = text;
            }
        };

        const jar = CodeJar(editorRef.current, highlight, { tab: '  ' });
        
        jar.updateCode(code);
        jarRef.current = jar;

        return () => {
            jar.destroy();
        };
    }
  }, [code]);

  const handleCopy = () => {
    const text = jarRef.current ? jarRef.current.toString() : code;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200 w-[80%] h-[80%]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 select-none bg-zinc-900/50 rounded-t-lg shrink-0">
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
        <div className="flex-1 overflow-hidden bg-[#0d0d0d] relative group">
           <div 
             ref={editorRef}
             className="w-full h-full font-mono text-[11px] text-zinc-300 leading-relaxed p-4 overflow-auto custom-scrollbar focus:outline-none"
             style={{ 
               tabSize: 2, 
               caretColor: '#a855f7',
               whiteSpace: 'pre'
             }}
           />
        </div>
      </div>
    </div>
  );
};
