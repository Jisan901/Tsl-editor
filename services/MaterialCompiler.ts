

import * as THREE from 'three';
import * as tsl from 'three/tsl';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';
import { getTslDefinition } from './TslDefinitions';

export class MaterialCompiler {
  private uniformCache: Map<string, any>;

  constructor(uniformCache: Map<string, any>) {
    this.uniformCache = uniformCache;
  }

  /**
   * Retrieves or creates a TSL Uniform.
   * By reusing the same object for the same Node ID + Key, 
   * we can update .value later without recompiling the shader.
   */
  private getUniform(nodeId: string, key: string, initialValue: any, type: 'float' | 'color' | 'vec2' | 'vec3' | 'vec4' = 'float') {
    const uniqueKey = `${nodeId}-${key}`;
    let u = this.uniformCache.get(uniqueKey);
    
    if (!u) {
      if (type === 'color') {
        u = tsl.uniform(new THREE.Color(initialValue));
      } else if (type === 'vec2') {
        u = tsl.uniform(new THREE.Vector2(initialValue?.x ?? 0, initialValue?.y ?? 0));
      } else if (type === 'vec3') {
        u = tsl.uniform(new THREE.Vector3(initialValue?.x ?? 0, initialValue?.y ?? 0, initialValue?.z ?? 0));
      } else if (type === 'vec4') {
        u = tsl.uniform(new THREE.Vector4(initialValue?.x ?? 0, initialValue?.y ?? 0, initialValue?.z ?? 0, initialValue?.w ?? 0));
      } else {
        u = tsl.uniform(Number(initialValue ?? 0));
      }
      this.uniformCache.set(uniqueKey, u);
    }
    return u;
  }

  /**
   * Loads or retrieves a texture from cache.
   */
  private getTexture(nodeId: string, url: string) {
    const uniqueKey = `${nodeId}-texture`;
    let tex = this.uniformCache.get(uniqueKey);
    
    // Check if the URL changed for this node
    if (tex && tex.userData.url !== url) {
       tex = null; // force reload
    }

    if (!tex) {
       const loader = new THREE.TextureLoader();
       // Use a fallback image that is guaranteed to exist/load or be handled
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

  /**
   * Updates the values of existing uniforms based on current node data.
   * Call this on every render frame or node change.
   */
  public updateUniforms(nodes: CustomNode[]) {
    nodes.forEach(node => {
      const type = node.type?.replace('Node', '') as NodeType;
      
      // Handle Texture Updates
      if (type === NodeType.TEXTURE || type === NodeType.TRIPLANAR) {
          if (node.data.value) {
              // We don't hot-swap textures efficiently here yet; usually requires rebuild for the shader graph 
              // if texture object changes, but we can check if we can update the image data. 
              // For now, rebuild handles texture swaps.
          }
      }

      // 1. Update 'value' (e.g., FloatNode, ColorNode)
      if (node.data.value !== undefined) {
        const u = this.uniformCache.get(`${node.id}-value`);
        if (u) {
          if (u.value.isColor) u.value.set(node.data.value);
          else u.value = Number(node.data.value);
        }
      }
      // 2. Update 'values' dictionary (e.g., AddNode inputs, MaterialNode props)
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
               u.value = Number(v);
            }
          }
        });
      }
    });
  }

  /**
   * Recursively builds the TSL graph starting from a specific node.
   */
  private buildGraph(nodeId: string, nodes: CustomNode[], edges: Edge[], visited: Set<string> = new Set()): any {
    if (visited.has(nodeId)) return tsl.float(0);
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return tsl.float(0);

    const type = node.type?.replace('Node', '') as NodeType;

    // Helper: Resolve input connection or fallback to local uniform
    const resolveInput = (handle: string, defaultVal: any = 0) => {
      const edge = edges.find(e => e.target === nodeId && e.targetHandle === handle);
      if (edge) {
         const sourceVal = this.buildGraph(edge.source, nodes, edges, new Set(visited));
         
         // Handle Swizzling for Split Nodes (or any multi-output node)
         // If sourceHandle is not 'out', try to access that property on the TSL node
         if (edge.sourceHandle && edge.sourceHandle !== 'out') {
             // TSL supports .x, .y, .r, .g accessors
             try {
                return sourceVal[edge.sourceHandle];
             } catch (e) {
                console.warn(`Failed to access property ${edge.sourceHandle} on node output`);
                return sourceVal;
             }
         }
         return sourceVal;
      }
      
      // Default to appropriate TSL nodes for semantic handles if disconnected
      if (handle === 'uv') return tsl.uv();
      if (handle === 'normal') return tsl.normalLocal;
      if (handle === 'position') return tsl.positionLocal;
      // Depth-specific defaults
      if (handle === 'near') return tsl.cameraNear;
      if (handle === 'far') return tsl.cameraFar;

      const localVal = node.data.values?.[handle] ?? node.data.value ?? defaultVal;
      const isColor = typeof localVal === 'string' && localVal.startsWith('#');
      
      // We use the node's ID and handle name to persist the uniform
      return this.getUniform(nodeId, handle, localVal, isColor ? 'color' : 'float');
    };

    // 1. Handle Leaf/Input Nodes directly (using uniforms)
    if (type === NodeType.FLOAT) return this.getUniform(nodeId, 'value', node.data.value ?? 0);
    if (type === NodeType.COLOR) return this.getUniform(nodeId, 'value', node.data.value || '#ffffff', 'color');

    // 2. Prepare inputs for Definition
    const inputs: Record<string, any> = {};
    
    // Common inputs
    if (node.data.inputs) {
        node.data.inputs.forEach(inputKey => {
            inputs[inputKey] = resolveInput(inputKey);
        });
    }

    // Special case for UV node 'value' which is a property, not an input socket usually
    if (type === NodeType.UV) {
        inputs['value'] = this.getUniform(nodeId, 'value', node.data.value ?? 1.0);
    }

    // Special case for Textures
    if (type === NodeType.TEXTURE || type === NodeType.TRIPLANAR) {
        inputs['map'] = this.getTexture(nodeId, node.data.value);
    }

    // 3. Get TSL from Definition
    const tslNode = getTslDefinition(type, inputs);
    return tslNode ?? tsl.float(0);
  }

  /**
   * Main entry point: Generates the full Material.
   */
  public compile(nodes: CustomNode[], edges: Edge[]): MeshStandardNodeMaterial | null {
    const outputNode = nodes.find(n => n.type === 'materialNode');
    if (!outputNode) return null;

    try {
      const material = new MeshStandardNodeMaterial();
      material.color = new THREE.Color(0xffffff); // Base fallback
      
      // Detect Viewport Depth Texture usage. 
      // If used, transparency MUST be enabled to prevent read/write cycles on the depth buffer 
      // which crashes the WebGPU loop for opaque objects.
      const hasDepthRead = nodes.some(n => 
          n.type === NodeType.VIEWPORT_DEPTH_TEXTURE + 'Node' || 
          n.type === NodeType.LINEAR_DEPTH + 'Node' ||
          n.type === NodeType.PERSPECTIVE_DEPTH_TO_VIEW_Z + 'Node'
      );

      // Transparency: Use user setting, but force true if depth read is present.
      material.transparent = hasDepthRead ? true : !!outputNode.data.values?.transparent;

      // Depth Write: Default to true unless explicitly disabled
      if (outputNode.data.values?.depthWrite !== undefined) {
         material.depthWrite = outputNode.data.values.depthWrite;
      } else {
         material.depthWrite = true;
      }
      
      // Depth Test: Default to true unless explicitly disabled
      if (outputNode.data.values?.depthTest !== undefined) {
         material.depthTest = outputNode.data.values.depthTest;
      } else {
         material.depthTest = true;
      }

      // Helper to connect material slots
      const connectSlot = (handle: string, type: 'float'|'color' = 'float') => {
         const edge = edges.find(e => e.target === outputNode.id && e.targetHandle === handle);
         if (edge) {
            // Need to handle swizzling here too if connecting directly to material
            const sourceVal = this.buildGraph(edge.source, nodes, edges);
            if (edge.sourceHandle && edge.sourceHandle !== 'out') {
               try { return sourceVal[edge.sourceHandle]; } catch(e) { return sourceVal; }
            }
            return sourceVal;
         } else {
            // Unconnected slots become uniforms so they can be tweaked via UI
            const val = outputNode.data.values?.[handle];
            let defaultVal: any = 0;
            if (handle === 'roughness') defaultVal = 0.5;
            if (handle === 'metalness') defaultVal = 0.0;
            if (handle === 'color' || handle === 'emissive') defaultVal = '#000000';
            if (handle === 'color') defaultVal = '#ffffff';
            if (handle === 'ao' || handle === 'opacity') defaultVal = 1.0;
            if (handle === 'depth') defaultVal = 0; 
            if (handle === 'alphaTest') defaultVal = 0;

            // Optional slots that shouldn't be assigned if unused
            if ((handle === 'depth' || handle === 'alphaTest') && !val && val !== 0) return null;

            return this.getUniform(outputNode.id, handle, val ?? defaultVal, type);
         }
      }

      material.colorNode = connectSlot('color', 'color');
      material.roughnessNode = connectSlot('roughness');
      material.metalnessNode = connectSlot('metalness');
      material.emissiveNode = connectSlot('emissive', 'color');
      material.aoNode = connectSlot('ao');
      material.opacityNode = connectSlot('opacity');
      
      const depthNode = connectSlot('depth');
      if (depthNode) material.depthNode = depthNode;
      
      const alphaTestNode = connectSlot('alphaTest');
      if (alphaTestNode) material.alphaTestNode = alphaTestNode;

      const normalEdge = edges.find(e => e.target === outputNode.id && e.targetHandle === 'normal');
      if (normalEdge) material.normalNode = this.buildGraph(normalEdge.source, nodes, edges);

      const posEdge = edges.find(e => e.target === outputNode.id && e.targetHandle === 'position');
      if (posEdge) material.positionNode = tsl.positionLocal.add(this.buildGraph(posEdge.source, nodes, edges));

      return material;
    } catch (e) {
      console.error("Material Compilation Error:", e);
      throw e;
    }
  }
}