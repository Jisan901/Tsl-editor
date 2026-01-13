
import * as THREE from 'three';
import * as tsl from 'three/tsl';
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial, NodeMaterial } from 'three/webgpu';
import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';
import { getNodeDefinition } from './NodeRegistry';

export class MaterialCompiler {
  private uniformCache: Map<string, any>;
  private tslCache: Map<string, any> = new Map();

  constructor(uniformCache: Map<string, any>) {
    this.uniformCache = uniformCache;
  }

  private getUniform(nodeId: string, key: string, initialValue: any, type: 'float' | 'color' | 'vec2' | 'vec3' | 'vec4' = 'float') {
    const uniqueKey = `${nodeId}-${key}`;
    let u = this.uniformCache.get(uniqueKey);
    
    // Safely parse initialValue
    let val = initialValue;
    if (type !== 'color' && typeof val === 'string') {
        const n = parseFloat(val);
        val = isNaN(n) ? 0 : n;
    } else if (type !== 'color' && typeof val === 'number') {
        val = isNaN(val) ? 0 : val;
    }

    if (!u) {
      if (type === 'color') {
        u = tsl.uniform(new THREE.Color(val));
      } else if (type === 'vec2') {
        u = tsl.uniform(new THREE.Vector2(val?.x ?? 0, val?.y ?? 0));
      } else if (type === 'vec3') {
        u = tsl.uniform(new THREE.Vector3(val?.x ?? 0, val?.y ?? 0, val?.z ?? 0));
      } else if (type === 'vec4') {
        u = tsl.uniform(new THREE.Vector4(val?.x ?? 0, val?.y ?? 0, val?.z ?? 0, val?.w ?? 0));
      } else {
        u = tsl.uniform(Number(val ?? 0));
      }
      this.uniformCache.set(uniqueKey, u);
    }
    return u;
  }

  private getTexture(nodeId: string, url: string) {
    const uniqueKey = `${nodeId}-texture`;
    let tex = this.uniformCache.get(uniqueKey);
    
    if (tex && tex.userData.url !== url) tex = null; 

    if (!tex) {
       const loader = new THREE.TextureLoader();
       const safeUrl = url || 'https://threejs.org/examples/textures/uv_grid_opengl.jpg';
       tex = loader.load(safeUrl);
       tex.wrapS = THREE.RepeatWrapping;
       tex.wrapT = THREE.RepeatWrapping;
       tex.colorSpace = THREE.SRGBColorSpace;
       tex.userData = { url: safeUrl };
       this.uniformCache.set(uniqueKey, tex);
    }
    return tex;
  }

  public updateUniforms(nodes: CustomNode[]) {
    nodes.forEach(node => {
      if (node.data.value !== undefined) {
        const u = this.uniformCache.get(`${node.id}-value`);
        if (u) {
          if (u.value.isColor) u.value.set(node.data.value);
          else {
              const n = parseFloat(node.data.value);
              u.value = isNaN(n) ? 0 : n;
          }
        }
      }
      if (node.data.values) {
        Object.entries(node.data.values).forEach(([k, v]: [string, any]) => {
          const u = this.uniformCache.get(`${node.id}-${k}`);
          if (u) {
            if (u.value.isColor) u.value.set(v);
            else if (u.value.isVector2 || u.value.isVector3 || u.value.isVector4) {
               if (typeof v === 'object') {
                   if (u.value.isVector2) { u.value.x = v.x; u.value.y = v.y; }
                   else if (u.value.isVector3) { u.value.x = v.x; u.value.y = v.y; u.value.z = v.z; }
                   else if (u.value.isVector4) { u.value.x = v.x; u.value.y = v.y; u.value.z = v.z; u.value.w = v.w; }
               }
            }
            else {
                const n = parseFloat(v);
                u.value = isNaN(n) ? 0 : n;
            }
          }
        });
      }
    });
  }

  private buildGraph(nodeId: string, nodes: CustomNode[], edges: Edge[], visited: Set<string> = new Set()): any {
    // 1. Check Cache
    if (this.tslCache.has(nodeId)) return this.tslCache.get(nodeId);

    // 2. Cycle Detection
    if (visited.has(nodeId)) return tsl.float(0);
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return tsl.float(0);

    const type = node.type?.replace('Node', '') as NodeType;
    
    // -- Special Handling for Data Nodes to enforce Uniforms --
    if (type === NodeType.FLOAT) {
        const u = this.getUniform(nodeId, 'value', node.data.value, 'float');
        if (node.data.label) u.setName(node.data.label);
        this.tslCache.set(nodeId, u);
        return u;
    }
    if (type === NodeType.COLOR) {
        const u = this.getUniform(nodeId, 'value', node.data.value, 'color');
        if (node.data.label) u.setName(node.data.label);
        this.tslCache.set(nodeId, u);
        return u;
    }
    // ---------------------------------------------------------

    const def = getNodeDefinition(type);

    if (!def) return tsl.float(0);

    const resolveInput = (handle: string, defaultVal: any = null) => {
      const edge = edges.find(e => e.target === nodeId && e.targetHandle === handle);
      if (edge) {
         const sourceVal = this.buildGraph(edge.source, nodes, edges, new Set(visited));
         if (edge.sourceHandle && edge.sourceHandle !== 'out') {
             try { return sourceVal[edge.sourceHandle]; } catch (e) { return sourceVal; }
         }
         return sourceVal;
      }
      
      const localVal = node.data.values?.[handle] ?? node.data.value;
      if (localVal === undefined) return defaultVal;
      
      const isColor = typeof localVal === 'string' && localVal.startsWith('#');
      return this.getUniform(nodeId, handle, localVal, isColor ? 'color' : 'float');
    };

    // Prepare inputs map
    const inputs: Record<string, any> = {};
    
    // Explicit Inputs from definition OR Dynamic inputs from node.data (for CodeNode)
    const inputKeys = node.data.inputs || def.inputs;
    
    inputKeys.forEach(inputKey => {
         inputs[inputKey] = resolveInput(inputKey, null);
    });
    
    // Extra map for textures
    if (type === NodeType.TEXTURE || type === NodeType.TRIPLANAR) {
        inputs['map'] = this.getTexture(nodeId, node.data.value);
    }

    const tslNode = def.tslFn(inputs, node.data);

    // Set Name for Debugging
    if (tslNode && typeof tslNode.setName === 'function') {
        const label = node.data.label || type;
        const cleanName = `${label.replace(/[^a-zA-Z0-9]/g, '')}_${nodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
        tslNode.setName(cleanName);
    }

    this.tslCache.set(nodeId, tslNode);
    return tslNode;
  }

  public compile(nodes: CustomNode[], edges: Edge[]): NodeMaterial | null {
    this.tslCache.clear();

    const outputNode = nodes.find(n => n.type === 'materialNode' || n.type === 'basicMaterialNode');
    if (!outputNode) return null;
    
    const isBasic = outputNode.type === 'basicMaterialNode';

    try {
      const material = isBasic ? new MeshBasicNodeMaterial() : new MeshStandardNodeMaterial();
      material.transparent = !!outputNode.data.values?.transparent;
      
      if (outputNode.data.values?.side !== undefined) {
          material.side = Number(outputNode.data.values.side);
      }

      const connectSlot = (handle: string, type: 'float'|'color' = 'float') => {
         const edge = edges.find(e => e.target === outputNode.id && e.targetHandle === handle);
         if (edge) {
            const sourceVal = this.buildGraph(edge.source, nodes, edges);
            if (edge.sourceHandle && edge.sourceHandle !== 'out') {
               try { return sourceVal[edge.sourceHandle]; } catch(e) { return sourceVal; }
            }
            return sourceVal;
         } else {
            const val = outputNode.data.values?.[handle];
            let defaultVal: any = 0;
            if (handle === 'roughness') defaultVal = 0.5;
            if (handle === 'metalness') defaultVal = 0.0;
            if (handle === 'color' || handle === 'emissive' || handle === 'fragment') defaultVal = '#ffffff';
            if (handle === 'ao' || handle === 'opacity') defaultVal = 1.0;
            return this.getUniform(outputNode.id, handle, val ?? defaultVal, type);
         }
      }

      if (isBasic) {
        // Basic Material mapping
        material.fragmentNode = connectSlot('fragment', 'color');
        material.opacityNode = connectSlot('opacity');
      } else {
        // Standard Material mapping
        const standardMat = material as MeshStandardNodeMaterial;
        standardMat.colorNode = connectSlot('color', 'color');
        standardMat.roughnessNode = connectSlot('roughness');
        standardMat.metalnessNode = connectSlot('metalness');
        standardMat.emissiveNode = connectSlot('emissive', 'color');
        standardMat.aoNode = connectSlot('ao');
        standardMat.opacityNode = connectSlot('opacity');
        
        const normalEdge = edges.find(e => e.target === outputNode.id && e.targetHandle === 'normal');
        if (normalEdge) standardMat.normalNode = this.buildGraph(normalEdge.source, nodes, edges);
      }

      // Shared Position mapping
      const posEdge = edges.find(e => e.target === outputNode.id && e.targetHandle === 'position');
      if (posEdge) material.positionNode = tsl.positionLocal.add(this.buildGraph(posEdge.source, nodes, edges));

      return material;
    } catch (e) {
      console.error("Material Compilation Error:", e);
      throw e;
    }
  }
}
