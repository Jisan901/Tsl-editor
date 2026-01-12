
import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';
import { getNodeDefinition } from './NodeRegistry';

export class CodeGenerator {
  static generateTSL(nodes: CustomNode[], edges: Edge[]): string {
    const lines: string[] = [];
    const visited = new Set<string>();
    const varNames = new Map<string, string>();
    
    const tslImports = new Set<string>();
    const webgpuImports = new Set<string>();
    const threeImports = new Set<string>();

    const addImport = (name: string) => {
        if (name === 'MeshStandardNodeMaterial' || name === 'MeshBasicNodeMaterial') {
            webgpuImports.add(name);
        } else {
            tslImports.add(name);
        }
    };

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
         
         if (val === undefined) return undefined;

         if (typeof val === 'string') {
             if (val.startsWith('#')) {
                addImport('color');
                return `color('${val}')`;
             }
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
              // Don't default specific inputs like viewDir or uv to float(0)
              // This allows the codeFn to handle the default logic
              if (['viewDir', 'uv'].includes(k)) {
                  // undefined
              } else {
                  inputs[k] = 'float(0)';
              }
          }
      });
      
      const rhs = def.codeFn(inputs, node.data, varName, addImport);
      
      if (rhs.trim().startsWith('const ') || rhs.trim().startsWith('//')) {
          lines.push(rhs);
      } else {
          lines.push(`const ${varName} = ${rhs};`);
      }
      
      return varName;
    };
    
    // Find Material Node
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
       
       // Handle standard slots (excluding position)
       const slots = isBasic 
            ? ['fragment', 'opacity'] 
            : ['color', 'roughness', 'metalness', 'normal', 'emissive', 'ao', 'opacity'];
       
       slots.forEach(slot => {
          const edge = edges.find(e => e.target === outputNode.id && e.targetHandle === slot);
          let targetProp = `${slot}Node`;
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
                let n = v;
                if(typeof v === 'string') n = parseFloat(v);
                if(isNaN(n)) n = 0;
                materialAssignments.push(`material.${targetProp} = float(${n});`);
             }
          }
       });

       // Handle Position Explicitly
       const posEdge = edges.find(e => e.target === outputNode.id && e.targetHandle === 'position');
       if (posEdge) {
           addImport('positionLocal');
           const varName = processNode(posEdge.source);
           let val = varName;
           if (posEdge.sourceHandle && posEdge.sourceHandle !== 'out') val += `.${posEdge.sourceHandle}`;
           materialAssignments.push(`material.positionNode = positionLocal.add(${val});`);
       }

       if (outputNode.data.values?.transparent) {
           materialAssignments.push(`material.transparent = true;`);
       }

       if (outputNode.data.values?.side !== undefined) {
           const s = outputNode.data.values.side;
           if (s === 1) {
                threeImports.add('BackSide');
                materialAssignments.push(`material.side = BackSide;`);
           }
           else if (s === 2) {
                threeImports.add('DoubleSide');
                materialAssignments.push(`material.side = DoubleSide;`);
           }
       }
    } else {
        addImport('MeshStandardNodeMaterial');
    }

    const tslImportsString = tslImports.size > 0 
        ? `import { \n  ${Array.from(tslImports).join(', ')} \n} from 'three/tsl';`
        : '';
        
    const webgpuImportsString = webgpuImports.size > 0 
        ? `import { \n  ${Array.from(webgpuImports).join(', ')} \n} from 'three/webgpu';`
        : '';

    const threeImportsString = threeImports.size > 0 
        ? `import { \n  ${Array.from(threeImports).join(', ')} \n} from 'three';`
        : '';
    
    return [
      threeImportsString,
      tslImportsString,
      webgpuImportsString,
      '',
      '// TSL Graph Generation',
      ...lines,
      '',
      `const material = new ${matType}();`,
      ...materialAssignments,
    ].filter(s => s !== '').join('\n');
  }
}
