
import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, useNodeConnections, useReactFlow } from '@xyflow/react';
import { useUI } from '../contexts/UIContext';
import { Code, Play, AlertCircle } from 'lucide-react';
import * as tsl from 'three/tsl';
import { useCodeJar } from 'react-code-jar';
import Prism from 'prismjs';

interface CodeNodeProps { id: string; data: any; selected?: boolean; }

const DEFAULT_CODE = `// fn(tsl, inputs)
const uv = tsl.uv();
return {
  inputs: [],
  outputs: [{ uv }]
};`;

// Input Row for dynamic inputs derived from code
const DynamicInputRow = memo(({ input, data, simpleMode }: { input: string, data: any, simpleMode: boolean }) => {
    const connections = useNodeConnections({ type: 'target', handleId: input });
    const isConnected = connections.length > 0;
    
    return (
        <div className="flex items-center justify-between relative group h-4">
             <span className={`${simpleMode ? 'text-[7px]' : 'text-[8px]'} font-bold uppercase ${isConnected ? 'text-zinc-400' : 'text-zinc-500'}`}>{input}</span>
             <Handle 
                type="target" 
                position={Position.Left} 
                id={input} 
                className={`!border-2 border-zinc-950 !bg-zinc-400 transition-transform hover:scale-125 ${simpleMode ? '!w-2 !h-2 !-left-[9px]' : '!w-2.5 !h-2.5 !-left-[15px]'}`} 
            />
        </div>
    );
});

export const CodeNode: React.FC<CodeNodeProps> = memo(({ id, data, selected }) => {
  const { simpleMode } = useUI();
  const { updateNodeData } = useReactFlow();
  const [code, setCode] = useState(data.code || DEFAULT_CODE);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const highlight = useCallback((editor: HTMLElement) => {
    if (editor.textContent) {
      editor.innerHTML = Prism.highlight(editor.textContent, Prism.languages.javascript, 'javascript');
    }
  }, []);

  const editorState = useCodeJar({
    code: code,
    onUpdate: (newCode) => setCode(newCode),
    highlight,
    lineNumbers: false
  });

  // Compile code to extract I/O structure
  const handleRun = useCallback(() => {
    try {
        setError(null);
        // Create a secure-ish context for extraction
        // We pass a dummy TSL proxy to capture usage or just valid objects
        const extractFn = new Function('tsl', 'inputs', code);
        
        // Execute with mock inputs
        const mockInputs = new Proxy({}, {
            get: (target, prop) => tsl.float(0) // Return dummy node for any input access
        });

        const result = extractFn(tsl, mockInputs);
        
        if (!result || typeof result !== 'object') throw new Error("Return object { inputs: [], outputs: [] }");
        
        const newInputs = Array.isArray(result.inputs) ? result.inputs : [];
        
        let newOutputs: string[] = [];
        if (result.outputs) {
            if (Array.isArray(result.outputs)) {
                // [{key: val}, {key2: val}]
                newOutputs = result.outputs.map((o: any) => Object.keys(o)[0]);
            } else {
                // { key: val }
                newOutputs = Object.keys(result.outputs);
            }
        }

        // Update Node Data
        const newData = {
            ...data,
            code: code,
            inputs: newInputs,
            outputs: newOutputs
        };

        // Trigger update to compile material
        updateNodeData(id, newData);

    } catch (e: any) {
        setError(e.message || "Syntax Error");
    }
  }, [code, id, data, updateNodeData]);

  // Initial Compile if data inputs/outputs are missing but code exists
  useEffect(() => {
     if ((!data.inputs && !data.outputs) && data.code) {
         handleRun();
     }
  }, []);

  return (
    <div className={`relative rounded-md border bg-zinc-950 transition-all flex flex-col ${selected ? 'border-purple-500 ring-1 ring-purple-500/20' : 'border-zinc-800 shadow-xl'} ${simpleMode ? 'min-w-[160px]' : 'min-w-[220px]'}`}>
      
      {/* Header */}
      <div className={`px-2 flex items-center justify-between bg-zinc-900/40 border-b border-zinc-900 rounded-t-md ${simpleMode ? 'py-1' : 'py-1.5'}`}>
          <div className="flex items-center gap-1.5 text-purple-400">
             {!simpleMode && <Code size={12} />}
             <span className={`${simpleMode ? 'text-[8px]' : 'text-[9px]'} font-black uppercase tracking-tight text-zinc-300`}>JS Code</span>
          </div>
          <button 
             onClick={handleRun}
             className="text-zinc-400 hover:text-green-400 transition-colors bg-zinc-900/50 hover:bg-zinc-800 rounded px-2 py-0.5 border border-zinc-800"
             title="Compile & Run"
          >
             <Play size={10} fill="currentColor" />
          </button>
      </div>

      {/* Inputs Area */}
      {data.inputs && data.inputs.length > 0 && (
          <div className={`border-b border-zinc-900/50 bg-zinc-900/20 ${simpleMode ? 'p-1.5 space-y-1' : 'p-2 space-y-1'}`}>
             {data.inputs.map((inp: string) => (
                 <DynamicInputRow key={inp} input={inp} data={data} simpleMode={simpleMode} />
             ))}
          </div>
      )}

      {/* Editor Area */}
      <div className="relative group bg-[#0d0d0d]">
        <div 
            ref={editorState.ref} 
            className={`w-full text-zinc-300 font-mono custom-scrollbar border-b border-zinc-900 focus:outline-none ${simpleMode ? 'text-[9px] p-1.5 min-h-[80px]' : 'text-[10px] p-2 min-h-[120px]'}`}
            style={{ 
                tabSize: 2, 
                caretColor: '#a855f7',
                lineHeight: '1.4'
            }}
        />
        {error && (
            <div className="absolute bottom-1 right-1 max-w-[95%] bg-red-900/95 text-red-100 text-[9px] px-2 py-1 rounded border border-red-500/50 flex items-center gap-1.5 truncate pointer-events-none shadow-lg z-10">
                <AlertCircle size={10} className="shrink-0" /> {error}
            </div>
        )}
      </div>

      {/* Outputs Area */}
      <div className={`${simpleMode ? 'p-1.5 space-y-1' : 'p-2 space-y-1'}`}>
        {data.outputs?.map((output: string) => (
          <div key={output} className={`relative flex items-center justify-end h-3`}>
            <span className={`${simpleMode ? 'text-[6px]' : 'text-[7px]'} font-bold uppercase text-zinc-500 mr-1.5`}>{output}</span>
            <Handle 
                type="source" 
                position={Position.Right} 
                id={output} 
                className={`!border-2 border-zinc-950 !bg-purple-500 transition-transform hover:scale-125 ${simpleMode ? '!w-2 !h-2 !-right-[9px]' : '!w-2.5 !h-2.5 !-right-[15px]'}`} 
            />
          </div>
        ))}
        {(!data.outputs || data.outputs.length === 0) && (
            <div className="text-[8px] text-zinc-700 italic text-center py-0.5">No Outputs</div>
        )}
      </div>
    </div>
  );
});
