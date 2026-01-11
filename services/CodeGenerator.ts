import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';

export class CodeGenerator {
  static generateTSL(nodes: CustomNode[], edges: Edge[]): string {
    const lines: string[] = [];
    const visited = new Set<string>();
    const varNames = new Map<string, string>();
    const imports = new Set<string>(['MeshStandardNodeMaterial']);

    const addImport = (name: string) => imports.add(name);

    // Helper to get a unique variable name
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
      
      const nodeEdges = edges.filter(e => e.target === nodeId);
      
      const getInput = (handle: string, defaultVal?: string | number) => {
         const edge = nodeEdges.find(e => e.targetHandle === handle);
         if (edge) {
            const srcVar = processNode(edge.source);
            if (edge.sourceHandle && edge.sourceHandle !== 'out') {
               return `${srcVar}.${edge.sourceHandle}`;
            }
            return srcVar;
         }
         // Fallback
         const val = node.data.values?.[handle] ?? node.data.value ?? defaultVal;
         
         if (val === undefined) return 'float(0)';
         
         if (typeof val === 'string') {
             if (val.startsWith('#')) {
                addImport('color');
                return `color('${val}')`;
             }
             // For strings like 'uv()' or 'null'
             return val;
         }
         
         if (typeof val === 'number') {
             addImport('float');
             return `float(${val})`;
         }
         return 'float(0)';
      };

      let code = '';
      
      // Mappings
      switch (type) {
        case NodeType.FLOAT: addImport('float'); code = `const ${varName} = float(${node.data.value ?? 0});`; break;
        case NodeType.COLOR: addImport('color'); code = `const ${varName} = color('${node.data.value ?? '#fff'}');`; break;
        case NodeType.VEC2: addImport('vec2'); code = `const ${varName} = vec2(${getInput('x')}, ${getInput('y')});`; break;
        case NodeType.VEC3: addImport('vec3'); code = `const ${varName} = vec3(${getInput('x')}, ${getInput('y')}, ${getInput('z')});`; break;
        
        case NodeType.UV: addImport('uv'); code = `const ${varName} = uv().mul(${getInput('value', 1)});`; break;
        case NodeType.SCREEN_UV: addImport('screenUV'); code = `const ${varName} = screenUV;`; break;
        case NodeType.TIME: addImport('time'); code = `const ${varName} = time;`; break;
        case NodeType.NORMAL: addImport('normalLocal'); code = `const ${varName} = normalLocal;`; break;
        case NodeType.POSITION: addImport('positionLocal'); code = `const ${varName} = positionLocal;`; break;

        case NodeType.ADD: addImport('add'); code = `const ${varName} = ${getInput('a')}.add(${getInput('b')});`; break;
        case NodeType.SUB: addImport('sub'); code = `const ${varName} = ${getInput('a')}.sub(${getInput('b')});`; break;
        case NodeType.MUL: addImport('mul'); code = `const ${varName} = ${getInput('a')}.mul(${getInput('b')});`; break;
        case NodeType.DIV: addImport('div'); code = `const ${varName} = ${getInput('a')}.div(${getInput('b')});`; break;
        case NodeType.SIN: addImport('sin'); code = `const ${varName} = sin(${getInput('in')});`; break;
        case NodeType.COS: addImport('cos'); code = `const ${varName} = cos(${getInput('in')});`; break;
        case NodeType.MIX: addImport('mix'); code = `const ${varName} = mix(${getInput('a')}, ${getInput('b')}, ${getInput('alpha')});`; break;
        
        case NodeType.DOT: addImport('dot'); code = `const ${varName} = dot(${getInput('a')}, ${getInput('b')});`; break;
        case NodeType.CROSS: addImport('cross'); code = `const ${varName} = cross(${getInput('a')}, ${getInput('b')});`; break;
        case NodeType.NORMALIZE: addImport('normalize'); code = `const ${varName} = normalize(${getInput('in')});`; break;
        case NodeType.REFLECT: addImport('reflect'); code = `const ${varName} = reflect(${getInput('in')}, ${getInput('normal')});`; break;

        case NodeType.TEXTURE: 
             addImport('texture'); 
             // Logic fix: Ensure texture loader is used correctly
             code = `const ${varName} = texture(textureLoader.load('${node.data.value || 'texture.jpg'}'), ${getInput('uv', 'uv()')});`; 
             break;
        case NodeType.CHECKER:
             addImport('checker');
             code = `const ${varName} = checker(${getInput('uv')});`;
             break;
        case NodeType.VIEWPORT_DEPTH_TEXTURE:
             addImport('viewportDepthTexture');
             {
                const hasUV = nodeEdges.some(e => e.targetHandle === 'uv');
                const hasLevel = nodeEdges.some(e => e.targetHandle === 'level');
                let args = '';
                if (hasLevel) {
                    args = `${getInput('uv', 'null')}, ${getInput('level')}`;
                } else if (hasUV) {
                    args = getInput('uv');
                }
                code = `const ${varName} = viewportDepthTexture(${args});`;
             }
             break;
        case NodeType.VIEWPORT_DEPTH:
             addImport('viewportDepth');
             code = `const ${varName} = viewportDepth;`;
             break;
        case NodeType.LINEAR_DEPTH:
             addImport('linearDepth');
             {
                 const hasDepth = nodeEdges.some(e => e.targetHandle === 'depth');
                 const depthArg = hasDepth ? getInput('depth') : 'viewportDepthTexture()';
                 
                 // If using default, we must make sure viewportDepthTexture is imported
                 if (!hasDepth) addImport('viewportDepthTexture');
                 
                 const nearArg = getInput('near', 'cameraNear');
                 const farArg = getInput('far', 'cameraFar');
                 
                 if (nearArg === 'cameraNear') addImport('cameraNear');
                 if (farArg === 'cameraFar') addImport('cameraFar');
                 
                 code = `const ${varName} = linearDepth(${depthArg}, ${nearArg}, ${farArg});`;
             }
             break;
        case NodeType.CAMERA_NEAR:
             addImport('cameraNear');
             code = `const ${varName} = cameraNear;`;
             break;
        case NodeType.CAMERA_FAR:
             addImport('cameraFar');
             code = `const ${varName} = cameraFar;`;
             break;
        case NodeType.PERSPECTIVE_DEPTH_TO_VIEW_Z:
             addImport('perspectiveDepthToViewZ');
             addImport('cameraNear');
             addImport('cameraFar');
             {
                const nearArg = getInput('near', 'cameraNear');
                const farArg = getInput('far', 'cameraFar');
                code = `const ${varName} = perspectiveDepthToViewZ(${getInput('depth')}, ${nearArg}, ${farArg});`;
             }
             break;
        case NodeType.VIEW_Z_TO_ORTHOGRAPHIC_DEPTH:
             addImport('viewZToOrthographicDepth');
             addImport('cameraNear');
             addImport('cameraFar');
             {
                const nearArg = getInput('near', 'cameraNear');
                const farArg = getInput('far', 'cameraFar');
                code = `const ${varName} = viewZToOrthographicDepth(${getInput('viewZ')}, ${nearArg}, ${farArg});`;
             }
             break;

        case NodeType.MATERIAL: return ''; 
        default: code = `// ${type} definition not implemented in exporter\nconst ${varName} = float(0);`; break;
      }
      
      lines.push(code);
      return varName;
    };
    
    // Find Material Node
    const outputNode = nodes.find(n => n.type === 'materialNode');
    const materialAssignments: string[] = [];
    
    if (outputNode) {
       // Added alphaTest to slots
       ['color', 'roughness', 'metalness', 'normal', 'emissive', 'ao', 'opacity', 'position', 'alphaTest'].forEach(slot => {
          const edge = edges.find(e => e.target === outputNode.id && e.targetHandle === slot);
          if (edge) {
             const varName = processNode(edge.source);
             let val = varName;
             if (edge.sourceHandle && edge.sourceHandle !== 'out') val += `.${edge.sourceHandle}`;
             materialAssignments.push(`material.${slot}Node = ${val};`);
          } else if (outputNode.data.values?.[slot] !== undefined) {
             const v = outputNode.data.values[slot];
             if ((slot === 'alphaTest') && !v && v !== 0) return;

             if (slot === 'color' || slot === 'emissive') {
                addImport('color');
                materialAssignments.push(`material.${slot}Node = color('${v}');`);
             } else {
                addImport('float');
                materialAssignments.push(`material.${slot}Node = float(${v});`);
             }
          }
       });

       // Handle Properties
       if (outputNode.data.values?.transparent) {
           materialAssignments.push(`material.transparent = true;`);
       }
    }

    const importsString = `import { \n  ${Array.from(imports).join(', ')} \n} from 'three/tsl';`;
    
    return [
      importsString,
      '',
      '// TSL Graph Generation',
      ...lines,
      '',
      'const material = new MeshStandardNodeMaterial();',
      ...materialAssignments,
    ].join('\n');
  }
}