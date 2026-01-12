

import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';
import * as THREE from 'three';

export interface EvaluationContext {
  uv: { x: number, y: number };
  time: number;
  [key: string]: any;
}

export type NodeValue = number | THREE.Vector2 | THREE.Vector3 | THREE.Vector4 | THREE.Color;

// Simple pseudo-random noise for CPU preview (fast approximation)
function pseudoNoise(x: number, y: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const f = x - i;
    const g = y - j;
    
    // 4 corners
    const a = pseudoNoise(i, j);
    const b = pseudoNoise(i + 1, j);
    const c = pseudoNoise(i, j + 1);
    const d = pseudoNoise(i + 1, j + 1);
    
    // Smooth interpolation
    const u = f * f * (3 - 2 * f);
    const v = g * g * (3 - 2 * g);
    
    return a + (b - a) * u + (c - a) * v * (d - b + (a - b) * u) * (1 - v); // Rough bilinear
}

export class NodeEngine {
  
  /**
   * Evaluates a node's output for a specific context (UV coordinate).
   */
  static evaluateNode(
    node: CustomNode, 
    nodes: CustomNode[], 
    edges: Edge[], 
    context: EvaluationContext, 
    depth = 0
  ): NodeValue {
    if (depth > 10) return 0; // Prevent infinite loops

    const type = node.type?.replace('Node', '') as NodeType;

    // Helper to get input value
    const input = (handle: string, defaultVal: any = 0) => {
      const edge = edges.find(e => e.target === node.id && e.targetHandle === handle);
      if (edge) {
        const source = nodes.find(n => n.id === edge.source);
        if (source) {
            const val = this.evaluateNode(source, nodes, edges, context, depth + 1);
            // Handle swizzling (x, y, z, w from Split or similar)
            if (edge.sourceHandle && edge.sourceHandle !== 'out') {
                const h = edge.sourceHandle;
                if (val instanceof THREE.Vector2 || val instanceof THREE.Vector3 || val instanceof THREE.Vector4) {
                    // @ts-ignore
                    return val[h] !== undefined ? val[h] : 0;
                }
                if (val instanceof THREE.Color) {
                    // map x->r, y->g, z->b
                    if (h === 'x' || h === 'r') return val.r;
                    if (h === 'y' || h === 'g') return val.g;
                    if (h === 'z' || h === 'b') return val.b;
                }
                if (typeof val === 'number') return val; // Swizzling a float returns itself
            }
            return val;
        }
      }
      // Fallback to internal data
      const val = node.data.values?.[handle] ?? node.data.value ?? defaultVal;
      // Parse colors if string
      if (typeof val === 'string' && val.startsWith('#')) return new THREE.Color(val);
      return val;
    };

    // Helper: Cast to float (handle strings safely)
    const f = (v: any): number => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (typeof v === 'string') {
          const parsed = parseFloat(v);
          return isNaN(parsed) ? 0 : parsed;
      }
      if (v instanceof THREE.Color) return (v.r + v.g + v.b) / 3;
      if (v instanceof THREE.Vector3) return v.x;
      return 0;
    };
    
    // Helper: Cast to Color/Vec3
    const c = (v: any): THREE.Color => {
      if (v instanceof THREE.Color) return v.clone();
      if (v instanceof THREE.Vector3) return new THREE.Color(v.x, v.y, v.z);
      const val = f(v);
      return new THREE.Color(val, val, val);
    }

    // Helper: Cast to Vector3
    const v3 = (v: any): THREE.Vector3 => {
      if (v instanceof THREE.Vector3) return v.clone();
      if (v instanceof THREE.Color) return new THREE.Vector3(v.r, v.g, v.b);
      const val = f(v);
      return new THREE.Vector3(val, val, val);
    }

    switch (type) {
      case NodeType.FLOAT: return f(node.data.value);
      case NodeType.COLOR: return new THREE.Color(node.data.value ?? '#ffffff');
      case NodeType.VEC2: return new THREE.Vector2(f(input('x')), f(input('y')));
      case NodeType.VEC3: return new THREE.Vector3(f(input('x')), f(input('y')), f(input('z')));
      case NodeType.VEC4: return new THREE.Vector4(f(input('x')), f(input('y')), f(input('z')), f(input('w')));
      
      case NodeType.UV: {
        const scale = f(input('value', 1.0));
        return new THREE.Vector2(context.uv.x * scale, context.uv.y * scale);
      }

      case NodeType.SCREEN_UV: 
      case NodeType.VIEWPORT_UV: {
        // In the context of a preview quad, Screen UV ~ UV
        return new THREE.Vector2(context.uv.x, context.uv.y);
      }
      
      case NodeType.CHECKER: {
        const uvVal = input('uv');
        const uv = (uvVal instanceof THREE.Vector2) ? uvVal : new THREE.Vector2(context.uv.x, context.uv.y);
        const cx = Math.floor(uv.x * 2);
        const cy = Math.floor(uv.y * 2);
        return (cx + cy) % 2 === 0 ? 1 : 0;
      }
      
      case NodeType.SIMPLEX_NOISE_2D: {
        const uvVal = input('uv'); // Or 'in'
        const inputVec = (uvVal instanceof THREE.Vector2) ? uvVal : new THREE.Vector2(context.uv.x, context.uv.y);
        // Simple scale for preview visibility
        return smoothNoise(inputVec.x * 5, inputVec.y * 5);
      }

      case NodeType.TEXTURE:
      case NodeType.TRIPLANAR:
      case NodeType.PASS:
          // Return a placeholder grid pattern for CPU preview since we can't easily sample DOM image synchronously without canvas overhead
          return (Math.floor(context.uv.x * 5) + Math.floor(context.uv.y * 5)) % 2 === 0 ? 0.2 : 0.8;
      
      case NodeType.VIEWPORT_DEPTH_TEXTURE:
          // Return a gradient to approximate depth for CPU preview (0 to 1)
          return context.uv.x;

      case NodeType.VIEWPORT_DEPTH:
      case NodeType.VIEWPORT_LINEAR_DEPTH:
      case NodeType.DEPTH:
      case NodeType.DEPTH_PASS:
          return 0.5; // Constant depth for preview
          
      case NodeType.LINEAR_DEPTH:
          return f(input('depth')); // Pass through for preview
      
      case NodeType.SCENE_VIEW_Z:
      case NodeType.LOGARITHMIC_DEPTH_TO_VIEW_Z:
      case NodeType.PERSPECTIVE_DEPTH_TO_VIEW_Z: 
          return f(input('depth')) * 10; 

      case NodeType.VIEW_Z_TO_ORTHOGRAPHIC_DEPTH: 
          return f(input('viewZ')) / 10;
          
      case NodeType.VIEW_Z:
          return 0; // View Z approx for flat preview
          
      case NodeType.VIEW_DIRECTION:
          return new THREE.Vector3(0, 0, 1);

      case NodeType.CAMERA_NEAR: return 0.1;
      case NodeType.CAMERA_FAR: return 100.0;
      
      case NodeType.NORMAL:
      case NodeType.NORMAL_VIEW:
          return new THREE.Vector3(0, 0, 1);
          
      case NodeType.POSITION:
      case NodeType.POSITION_VIEW:
      case NodeType.MODEL_VIEW_POSITION:
          return new THREE.Vector3(context.uv.x, context.uv.y, 0);
          
      case NodeType.FRESNEL: {
          const power = f(input('power', 5.0));
          const viewDir = v3(input('viewDir')); 
          const norm = v3(input('normal')) || new THREE.Vector3(0,0,1);
          // If viewDir input is missing, default to (0,0,1) for preview
          const vd = (viewDir.lengthSq() === 0) ? new THREE.Vector3(0,0,1) : viewDir;
          const dot = Math.max(0, norm.dot(vd));
          return Math.pow(1.0 - dot, power);
      }

      case NodeType.SPLIT: return input('in'); 
      case NodeType.PREVIEW: return input('in');
      
      case NodeType.REMAP: {
        const v = f(input('in'));
        const inLow = f(input('inLow', 0));
        const inHigh = f(input('inHigh', 1));
        const outLow = f(input('outLow', 0));
        const outHigh = f(input('outHigh', 1));
        // Avoid div by zero
        const div = (inHigh - inLow);
        return outLow + (v - inLow) * (outHigh - outLow) / (div === 0 ? 0.0001 : div);
      }
      
      case NodeType.CLAMP: {
        const v = f(input('in'));
        const mn = f(input('min', 0));
        const mx = f(input('max', 1));
        return Math.max(mn, Math.min(mx, v));
      }

      case NodeType.ADD: {
         const a = input('a'); const b = input('b');
         if (a instanceof THREE.Color || b instanceof THREE.Color) return c(a).add(c(b));
         return f(a) + f(b);
      }
      case NodeType.SUB: {
        const a = input('a'); const b = input('b');
        if (a instanceof THREE.Color || b instanceof THREE.Color) return c(a).sub(c(b));
        return f(a) - f(b);
      }
      case NodeType.MUL: {
        const a = input('a'); const b = input('b');
        if (a instanceof THREE.Color || b instanceof THREE.Color) return c(a).multiply(c(b));
        return f(a) * f(b);
      }
      case NodeType.DIV: return f(input('a')) / (f(input('b')) || 0.001);
      
      case NodeType.MOD: return f(input('a')) % (f(input('b')) || 1);
      
      case NodeType.ONE_MINUS: return 1.0 - f(input('in'));
      case NodeType.RECIPROCAL: return 1.0 / (f(input('in')) || 0.001);
      
      case NodeType.SIN: return Math.sin(f(input('in')));
      case NodeType.COS: return Math.cos(f(input('in')));
      case NodeType.TAN: return Math.tan(f(input('in')));
      
      case NodeType.ABS: return Math.abs(f(input('in')));
      case NodeType.SIGN: return Math.sign(f(input('in')));
      case NodeType.FRACT: {
         const v = f(input('in'));
         return v - Math.floor(v);
      }
      case NodeType.SQRT: return Math.sqrt(Math.max(0, f(input('in'))));
      case NodeType.POW: return Math.pow(f(input('a')), f(input('b')));
      case NodeType.MIN: return Math.min(f(input('a')), f(input('b')));
      case NodeType.MAX: return Math.max(f(input('a')), f(input('b')));
      case NodeType.FLOOR: return Math.floor(f(input('in')));
      case NodeType.CEIL: return Math.ceil(f(input('in')));

      case NodeType.DOT: return v3(input('a')).dot(v3(input('b')));
      case NodeType.CROSS: return v3(input('a')).cross(v3(input('b')));
      case NodeType.LENGTH: return v3(input('in')).length();
      case NodeType.DISTANCE: return v3(input('a')).distanceTo(v3(input('b')));
      case NodeType.NORMALIZE: return v3(input('in')).normalize();
      
      // Rough CPU reflect approximation
      case NodeType.REFLECT: {
          const I = v3(input('in'));
          const N = v3(input('normal'));
          // I - 2 * dot(N, I) * N
          return I.clone().sub( N.clone().multiplyScalar(2 * N.dot(I)) );
      }

      case NodeType.MIX: {
          const x = c(input('a'));
          const y = c(input('b'));
          const alpha = f(input('alpha'));
          return x.lerp(y, alpha);
      }
      
      default: return 0;
    }
  }

  /**
   * Renders a preview of the node output to a canvas 2D context.
   */
  static renderPreview(
    node: CustomNode, 
    nodes: CustomNode[], 
    edges: Edge[], 
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) {
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = 1.0 - (y / height); 

        const val = this.evaluateNode(node, nodes, edges, { uv: { x: u, y: v }, time: 0 });
        
        const index = (y * width + x) * 4;
        
        let r=0, g=0, b=0;

        if (val instanceof THREE.Color) {
            r = val.r; g = val.g; b = val.b;
        } else if (val instanceof THREE.Vector2) {
            r = val.x; g = val.y; b = 0;
        } else if (val instanceof THREE.Vector3) {
            r = val.x; g = val.y; b = val.z;
        } else if (typeof val === 'number') {
            r = val; g = val; b = val;
        }

        data[index] = Math.max(0, Math.min(1, r)) * 255;
        data[index + 1] = Math.max(0, Math.min(1, g)) * 255;
        data[index + 2] = Math.max(0, Math.min(1, b)) * 255;
        data[index + 3] = 255; 
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
}