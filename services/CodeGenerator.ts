import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';
import { getNodeDefinition } from './NodeRegistry';

export class CodeGenerator {
  static generateTSL(nodes: CustomNode[], edges: Edge[]): string {
    const lines: string[] = [];
    const visited = new Set<string>();
    const varNames = new Map<string, string>();
    const imports = new Set<string>();

    const addImport = (name: string) => imports.add(name);

    const getVarName = (id: string, type: string) => {
      if (!varNames.has(id)) {
        const cleanType = type.replace('Node', '').toLowerCase();
        const cleanId = id.replace(/[^a-zA-Z0-9]/g, '_');
        varNames.set(id, `${cleanType}_${cleanId.split('_').pop()}`);
      }
      return varNames.get(id)!;
    };

    const processNode = (nodeId: string): string => {
      if (visited.has(nodeId)) return varNames.get(nodeId)!;
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return 'float(0)'; 

      visited.add(nodeId);
      const varName = getVarName(nodeId, node.type || 'node');
      const type = node.type?.replace('Node', '') as NodeType;
      const def = getNodeDefinition(type);
      
      const nodeEdges = edges.filter(e => e.target === nodeId);
      
      const getInput = (handle: string) => {
         const edge = nodeEdges.find(e => e.targetHandle === handle);
         if (edge) {
            const srcVar = processNode(edge.source);
            if (edge.sourceHandle && edge.sourceHandle !== 'out') {
               return `${srcVar}.${edge.sourceHandle}`;
            }
            return srcVar;
         }
         
         const val = node.data.values?.[handle] ?? node.data.value;
         
         if (val === undefined) return undefined; // Let codeFn handle default

         if (typeof val === 'string') {
             if (val.startsWith('#')) {
                addImport('color');
                return `color('${val}')`;
             }
             // It might be a number-string like "0.5" or "-"
             const n = parseFloat(val);
             if (!isNaN(n)) {
                 addImport('float');
                 return `float(${n})`;
             }
             return 'float(0)';
         }
         
         if (typeof val === 'number') {
             addImport('float');
             return `float(${val})`;
         }
         return 'float(0)';
      };

      if (!def) {
          lines.push(`// Unknown node type: ${type}\nconst ${varName} = float(0);`);
          return varName;
      }

      // Collect inputs map
      const inputs: Record<string, string> = {};
      def.inputs.forEach(k => {
          const v = getInput(k);
          if (v) inputs[k] = v;
          else {
              if (['a','b','x','y','z','w','in','value'].includes(k)) inputs[k] = 'float(0)';
              else inputs[k] = 'float(0)';
          }
      });
      
      // Execute code generation
      const rhs = def.codeFn(inputs, node.data, varName, addImport);
      
      if (rhs.trim().startsWith('const ') || rhs.trim().startsWith('//')) {
          lines.push(rhs);
      } else {
          lines.push(`const ${varName} = ${rhs};`);
      }
      
      return varName;
    };
    
    // Find Material Node (Support both Standard and Basic)
    const outputNode = nodes.find(n => n.type === 'materialNode' || n.type === 'basicMaterialNode');
    const materialAssignments: string[] = [];
    let matType = 'MeshStandardNodeMaterial';
    
    if (outputNode) {
       const isBasic = outputNode.type === 'basicMaterialNode';
       if (isBasic) {
           matType = 'MeshBasicNodeMaterial';
           addImport('MeshBasicNodeMaterial');
       } else {
           addImport('MeshStandardNodeMaterial');
       }
       
       const slots = isBasic 
            ? ['fragment', 'opacity', 'position'] 
            : ['color', 'roughness', 'metalness', 'normal', 'emissive', 'ao', 'opacity', 'position'];
       
       slots.forEach(slot => {
          const edge = edges.find(e => e.target === outputNode.id && e.targetHandle === slot);
          let targetProp = `${slot}Node`;
          // Special case for basic material fragment input
          if (isBasic && slot === 'fragment') targetProp = 'fragmentNode';

          if (edge) {
             const varName = processNode(edge.source);
             let val = varName;
             if (edge.sourceHandle && edge.sourceHandle !== 'out') val += `.${edge.sourceHandle}`;
             materialAssignments.push(`material.${targetProp} = ${val};`);
          } else if (outputNode.data.values?.[slot] !== undefined) {
             const v = outputNode.data.values[slot];
             if (slot === 'color' || slot === 'emissive' || slot === 'fragment') {
                addImport('color');
                materialAssignments.push(`material.${targetProp} = color('${v}');`);
             } else {
                addImport('float');
                // Handle potential string numbers here too
                let n = v;
                if(typeof v === 'string') n = parseFloat(v);
                if(isNaN(n)) n = 0;
                materialAssignments.push(`material.${targetProp} = float(${n});`);
             }
          }
       });

       if (outputNode.data.values?.transparent) {
           materialAssignments.push(`material.transparent = true;`);
       }
    } else {
        addImport('MeshStandardNodeMaterial');
    }

    const importsString = `import { \n  ${Array.from(imports).join(', ')} \n} from 'three/tsl';`;
    
    return [
      importsString,
      '',
      '// TSL Graph Generation',
      ...lines,
      '',
      `const material = new ${matType}();`,
      ...materialAssignments,
    ].join('\n');
  }
}