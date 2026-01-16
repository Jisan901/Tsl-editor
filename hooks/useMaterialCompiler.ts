
import { useState, useEffect, useRef, useMemo } from 'react';
import { CustomNode } from '../types';
import { Edge } from '@xyflow/react';
import { MaterialCompiler } from '../services/MaterialCompiler';
import { CodeGenerator } from '../services/CodeGenerator';
import { MeshStandardNodeMaterial, NodeMaterial } from 'three/webgpu';

// Hook to debounce value changes
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useMaterialCompiler(nodes: CustomNode[], edges: Edge[]) {
  const [material, setMaterial] = useState<NodeMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for TSL Uniform objects
  const uniformCache = useRef<Map<string, any>>(new Map());
  const topologyHash = useRef<string>('');
  
  // Debounce the nodes and edges for structure rebuilding to avoid heavy recompilation during drag
  // Using a short delay (e.g. 50ms) makes it feel responsive but prevents per-frame updates
  const debouncedNodes = useDebounce(nodes, 100);
  const debouncedEdges = useDebounce(edges, 100);

  // Instantiate Compiler once
  const compiler = useMemo(() => new MaterialCompiler(uniformCache.current), []);

  // Effect for Structural Changes (Compilation)
  useEffect(() => {
    // Determine if rebuild is needed
    const outputNode = debouncedNodes.find(n => n.type === 'materialNode' || n.type === 'basicMaterialNode');
    
    const isTransparent = outputNode?.data.values?.transparent ? 'true' : 'false';
    const side = outputNode?.data.values?.side ?? '0';

    const currentTopology = debouncedEdges.map(e => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`).sort().join('|') + 
                            debouncedNodes.map(n => `${n.id}:${n.type}`).sort().join('|') + 
                            isTransparent + ':' + side; 

    const needsRebuild = currentTopology !== topologyHash.current;

    if (needsRebuild) {
      try {
        console.groupCollapsed(`[TSL] Compiling Material (${debouncedNodes.length} nodes)`);
        
        // Log Node to TSL Code
        const tslCode = CodeGenerator.generateTSL(debouncedNodes, debouncedEdges);
        console.log('%cGenerated TSL:', 'color: #3b82f6; font-weight: bold;', '\n' + tslCode);

        const newMaterial = compiler.compile(debouncedNodes, debouncedEdges);
        if (newMaterial) {
            // Update state
            setMaterial(old => {
                 if (old) old.dispose(); 
                 return newMaterial;
            });
            
            topologyHash.current = currentTopology;
            setError(null);
            console.log('%cMaterial Compiled Successfully', 'color: #22c55e; font-weight: bold;', newMaterial);
        }
        console.groupEnd();
      } catch (e: any) {
        console.error('%cMaterial Compilation Failed', 'color: #ef4444; font-weight: bold;', e);
        setError(e.message);
        console.groupEnd();
      }
    }
  }, [debouncedNodes, debouncedEdges, compiler]);

  // Effect for Value Changes (Uniform Updates) - Run more frequently for responsiveness
  // We can use the raw 'nodes' here because updating uniforms is cheap compared to rebuilding graphs
  useEffect(() => {
    compiler.updateUniforms(nodes);
  }, [nodes, compiler]);

  return { material, error };
}
