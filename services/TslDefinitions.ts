import * as tsl from 'three/tsl';
import { NodeType } from '../types';
import { simplexNoise2D } from './ExtraNodes';

// Helper to detect if an input is a default "0" uniform created by the compiler for unconnected sockets
const isDefaultZero = (node: any) => {
    // Check for TSL UniformNode with value 0
    return node && node.isUniformNode && node.value === 0;
};

/**
 * Defines the mapping between NodeTypes and actual TSL operations.
 * This separates the "What it does" from the "How it's connected".
 */
export const getTslDefinition = (type: NodeType, inputs: Record<string, any>) => {
  switch (type) {
    // --- Math Basic ---
    case NodeType.ADD: return tsl.add(inputs.a, inputs.b);
    case NodeType.SUB: return tsl.sub(inputs.a, inputs.b);
    case NodeType.MUL: return tsl.mul(inputs.a, inputs.b);
    case NodeType.DIV: return tsl.div(inputs.a, inputs.b);
    case NodeType.MOD: return tsl.mod(inputs.a, inputs.b);
    case NodeType.ONE_MINUS: return tsl.oneMinus(inputs.in);
    case NodeType.RECIPROCAL: return tsl.reciprocal(inputs.in);
    
    // --- Math Advanced ---
    case NodeType.POW: return tsl.pow(inputs.a, inputs.b);
    case NodeType.SQRT: return tsl.sqrt(inputs.in);
    case NodeType.ABS: return tsl.abs(inputs.in);
    case NodeType.SIGN: return tsl.sign(inputs.in);
    case NodeType.FRACT: return tsl.fract(inputs.in);
    case NodeType.SIN: return tsl.sin(inputs.in);
    case NodeType.COS: return tsl.cos(inputs.in);
    case NodeType.TAN: return tsl.tan(inputs.in);
    case NodeType.FLOOR: return tsl.floor(inputs.in);
    case NodeType.CEIL: return tsl.ceil(inputs.in);
    case NodeType.MIN: return tsl.min(inputs.a, inputs.b);
    case NodeType.MAX: return tsl.max(inputs.a, inputs.b);
    case NodeType.CLAMP: return tsl.clamp(inputs.in, inputs.min, inputs.max);
    case NodeType.REMAP: return tsl.remap(inputs.in, inputs.inLow, inputs.inHigh, inputs.outLow, inputs.outHigh);
    
    // --- Vectors ---
    case NodeType.VEC2: return tsl.vec2(inputs.x, inputs.y);
    case NodeType.VEC3: return tsl.vec3(inputs.x, inputs.y, inputs.z);
    case NodeType.VEC4: return tsl.vec4(inputs.x, inputs.y, inputs.z, inputs.w);
    
    case NodeType.DOT: return tsl.dot(inputs.a, inputs.b);
    case NodeType.CROSS: return tsl.cross(inputs.a, inputs.b);
    case NodeType.LENGTH: return tsl.length(inputs.in);
    case NodeType.DISTANCE: return tsl.distance(inputs.a, inputs.b);
    case NodeType.NORMALIZE: return tsl.normalize(inputs.in);
    case NodeType.REFLECT: return tsl.reflect(inputs.in, inputs.normal);

    // --- Logic / Mix ---
    case NodeType.MIX: return tsl.mix(inputs.a, inputs.b, inputs.alpha);
    case NodeType.STEP: return tsl.step(inputs.edge, inputs.in);
    case NodeType.SMOOTHSTEP: return tsl.smoothstep(inputs.low, inputs.high, inputs.in);
    
    // --- Attributes ---
    case NodeType.NORMAL: return tsl.normalLocal;
    case NodeType.POSITION: return tsl.positionLocal;
    case NodeType.TIME: return tsl.time;
    case NodeType.UV: return tsl.uv().mul(inputs.value || 1.0); 
    case NodeType.SCREEN_UV: return tsl.screenUV;
    
    // --- Patterns & Textures ---
    case NodeType.SIMPLEX_NOISE_2D: return simplexNoise2D(inputs.uv || tsl.uv());
    case NodeType.CHECKER: return tsl.checker(inputs.uv || tsl.uv());
    case NodeType.TEXTURE: return tsl.texture(inputs.map, inputs.uv);
    case NodeType.TRIPLANAR: {
      const tex = tsl.texture(inputs.map);
      return tsl.triplanarTexture(tex, tex, tex, inputs.scale, inputs.position, inputs.normal);
    }
    
    // --- Depth ---
    case NodeType.VIEWPORT_DEPTH_TEXTURE: {
        const uv = isDefaultZero(inputs.uv) ? undefined : inputs.uv;
        const level = isDefaultZero(inputs.level) ? undefined : inputs.level;
        return tsl.viewportDepthTexture(uv, level);
    }
    case NodeType.VIEWPORT_DEPTH: return tsl.depth;
    case NodeType.LINEAR_DEPTH: {
        // linearDepth( depth, near, far )
        // If depth is 0 (unconnected), defaults to viewportDepthTexture()
        const depth = isDefaultZero(inputs.depth) ? tsl.viewportDepthTexture() : inputs.depth;
        // If near/far are provided via MaterialCompiler defaults (cameraNear/Far), use them.
        return tsl.linearDepth(depth, inputs.near, inputs.far);
    }
    case NodeType.CAMERA_NEAR: return tsl.cameraNear;
    case NodeType.CAMERA_FAR: return tsl.cameraFar;
    case NodeType.PERSPECTIVE_DEPTH_TO_VIEW_Z: return tsl.perspectiveDepthToViewZ(inputs.depth, inputs.near, inputs.far);
    case NodeType.VIEW_Z_TO_ORTHOGRAPHIC_DEPTH: return tsl.viewZToOrthographicDepth(inputs.viewZ, inputs.near, inputs.far);

    // --- Utility ---
    case NodeType.SPLIT: return inputs.in; 
    case NodeType.PREVIEW: return inputs.in;

    default: return null;
  }
};