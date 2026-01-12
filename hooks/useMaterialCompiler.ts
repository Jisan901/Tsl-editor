
import { useState, useEffect, useRef, useMemo } from 'react';
import { CustomNode } from '../types';
import { Edge } from '@xyflow/react';
import { MaterialCompiler } from '../services/MaterialCompiler';
import { CodeGenerator } from '../services/CodeGenerator';
import { MeshStandardNodeMaterial, NodeMaterial } from 'three/webgpu';

export function useMaterialCompiler(nodes: CustomNode[], edges: Edge[]) {
  const [material, setMaterial] = useState<NodeMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for TSL Uniform objects
  const uniformCache = useRef<Map<string, any>>(new Map());
  const topologyHash = useRef<string>('');
  
  // Instantiate Compiler once
  const compiler = useMemo(() => new MaterialCompiler(uniformCache.current), []);

  useEffect(() => {
    // Determine if rebuild is needed
    const outputNode = nodes.find(n => n.type === 'materialNode' || n.type === 'basicMaterialNode');
    
    const isTransparent = outputNode?.data.values?.transparent ? 'true' : 'false';
    const side = outputNode?.data.values?.side ?? '0';

    const currentTopology = edges.map(e => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`).sort().join('|') + 
                            nodes.map(n => `${n.id}:${n.type}`).sort().join('|') + 
                            isTransparent + ':' + side; 

    const needsRebuild = currentTopology !== topologyHash.current;

    if (needsRebuild) {
      try {
        console.groupCollapsed(`[TSL] Compiling Material (${nodes.length} nodes)`);
        
        // Log Node to TSL Code
        const tslCode = CodeGenerator.generateTSL(nodes, edges);
        console.log('%cGenerated TSL:', 'color: #3b82f6; font-weight: bold;', '\n' + tslCode);

        const newMaterial = compiler.compile(nodes, edges);
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

    // Always update uniforms
    compiler.updateUniforms(nodes);

  }, [nodes, edges, compiler]);

  return { material, error };
}
