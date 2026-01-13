
import React, { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, useEdges, useNodes } from '@xyflow/react';
import { CustomNode } from '../types';
import { Eye } from 'lucide-react';
import { NodeEngine } from '../services/NodeEngine';
import { useUI } from '../contexts/UIContext';

interface PreviewNodeProps { id: string; data: any; selected?: boolean; }

// Reduced resolution for thumbnail performance
const PREVIEW_RES = 64; 

export const PreviewNode: React.FC<PreviewNodeProps> = memo(({ id, data, selected }) => {
  const nodes = useNodes() as CustomNode[];
  const edges = useEdges();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scalarValue, setScalarValue] = useState<string | null>(null);
  const { simpleMode } = useUI();

  useEffect(() => {
    // Increased debounce to reduce main thread blocking during rapid updates
    const timer = setTimeout(() => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        // Ensure we are connected
        const inputEdge = edges.find(e => e.target === id && e.targetHandle === 'in');
        
        if (inputEdge) {
            try {
               // Evaluate for scalar display (at UV 0,0)
               const val = NodeEngine.evaluateNode(node, nodes, edges, { uv: {x:0, y:0}, time: 0 });
               if (typeof val === 'number') setScalarValue(val.toFixed(2));
               else if (val && typeof val === 'object' && 'isColor' in val) setScalarValue('#' + val.getHexString());
               else if (val && typeof val === 'object' && 'x' in val) {
                 // Vector
                 // @ts-ignore
                 setScalarValue(`(${val.x.toFixed(1)}, ${val.y.toFixed(1)})`);
               }
               else setScalarValue(null);
            } catch(e) { setScalarValue(null); }

            // Render visual preview
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    // Render at lower resolution, CSS handles scaling
                    NodeEngine.renderPreview(node, nodes, edges, ctx, PREVIEW_RES, PREVIEW_RES);
                }
            }
        } else {
            // Clear if not connected
            if (canvasRef.current) {
                 const ctx = canvasRef.current.getContext('2d');
                 if (ctx) {
                     ctx.fillStyle = '#09090b';
                     ctx.fillRect(0,0,PREVIEW_RES,PREVIEW_RES);
                     // Draw subtle grid or placeholder
                     ctx.strokeStyle = '#27272a';
                     ctx.lineWidth = 1;
                     ctx.beginPath();
                     ctx.moveTo(0,0); ctx.lineTo(PREVIEW_RES,PREVIEW_RES);
                     ctx.moveTo(PREVIEW_RES,0); ctx.lineTo(0,PREVIEW_RES);
                     ctx.stroke();
                 }
            }
            setScalarValue("No Input");
        }
    }, 80); // 80ms delay

    return () => clearTimeout(timer);
  }, [id, data, nodes, edges]); 

  return (
    <div className={`relative rounded-lg overflow-hidden bg-zinc-950 border shadow-2xl transition-all group ${selected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-zinc-800'} ${simpleMode ? 'w-24 h-24' : 'w-32 h-32'}`}>
      
      {/* Canvas - Render low res, display size fixed by CSS */}
      <canvas ref={canvasRef} width={PREVIEW_RES} height={PREVIEW_RES} className="absolute inset-0 w-full h-full object-cover bg-black rendering-pixelated" />
      
      {/* Overlay: Icon (Top Left) */}
      {!simpleMode && (
        <div className="absolute top-1 left-1 pointer-events-none z-10">
            <div className="flex items-center justify-center w-5 h-5 bg-zinc-950/80 backdrop-blur-sm rounded-md border border-white/10 text-blue-500 shadow-lg">
                <Eye size={10} />
            </div>
        </div>
      )}

      {/* Overlay: Value (Bottom Right) */}
      {scalarValue && (
        <div className={`absolute bottom-1 right-1 bg-zinc-950/80 backdrop-blur-sm rounded-sm border border-white/10 pointer-events-none flex items-center justify-end z-10 shadow-lg ${simpleMode ? 'px-1 py-0' : 'px-1.5 py-0.5 max-w-[110px]'}`}>
            <span className={`font-mono text-zinc-300 truncate ${simpleMode ? 'text-[7px]' : 'text-[8px]'}`}>{scalarValue}</span>
        </div>
      )}

      {/* Input Handle (Left Center) */}
      <div className={`absolute top-1/2 transform -translate-y-1/2 z-20 ${simpleMode ? '-left-2' : '-left-3'}`}>
         <Handle 
            type="target" 
            position={Position.Left} 
            id="in" 
            style={{ backgroundColor: '#fbbf24' }} 
            className={`!relative !left-0 !transform-none border-2 border-zinc-950 transition-transform hover:scale-125 shadow-lg ${simpleMode ? '!w-2 !h-2' : '!w-2.5 !h-2.5'}`} 
         />
         {!simpleMode && (
             <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-white drop-shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-1 rounded">IN</span>
         )}
      </div>

    </div>
  );
});
