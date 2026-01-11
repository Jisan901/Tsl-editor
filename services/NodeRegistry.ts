import React from 'react';
import { NodeType } from '../types';
import { BaseNode } from '../components/BaseNode';
import { PreviewNode } from '../components/PreviewNode';
import { TextureNode } from '../components/TextureNode';
import { 
  Hash, Circle, Square, Triangle, 
  Grid, Activity, Move, Zap, 
  Plus, X, Minus, Waves, Minimize2, Split, Scaling, 
  Combine, Type, 
  Image as ImageIcon, Box, Eye,
  Percent, Divide, ArrowUpLeft, Minimize, Maximize, Target, Layers, ArrowDown
} from 'lucide-react';

export interface NodeDefinition {
  type: NodeType;
  label: string;
  component: React.ComponentType<any>;
  inputs: string[];
  outputs: string[];
  initialValues?: Record<string, any>;
  initialValue?: any;
  category: 'Constants' | 'Attributes' | 'Math' | 'Vectors' | 'Logic' | 'Patterns & Textures' | 'Depth' | 'Tools' | 'Output';
  icon: React.ElementType;
  meta?: Record<string, any>; // Extra flags like showTransparentToggle
}

// Helper to create rotated icon without JSX in .ts file
function Maximize2Icon(props: any) { 
  return React.createElement(Minimize2, { ...props, className: "rotate-180" });
}

export const NODE_REGISTRY: NodeDefinition[] = [
  // --- Constants ---
  { 
    type: NodeType.FLOAT, label: 'Float', component: BaseNode, category: 'Constants', icon: Hash,
    inputs: [], outputs: ['out'], initialValue: 0.5 
  },
  { 
    type: NodeType.COLOR, label: 'Color', component: BaseNode, category: 'Constants', icon: Circle,
    inputs: [], outputs: ['out'], initialValue: '#ffffff' 
  },
  { 
    type: NodeType.VEC2, label: 'Vec2', component: BaseNode, category: 'Constants', icon: Square,
    inputs: ['x', 'y'], outputs: ['out'], initialValues: { x: 0, y: 0 } 
  },
  { 
    type: NodeType.VEC3, label: 'Vec3', component: BaseNode, category: 'Constants', icon: Triangle,
    inputs: ['x', 'y', 'z'], outputs: ['out'], initialValues: { x: 0, y: 0, z: 0 } 
  },
  { 
    type: NodeType.VEC4, label: 'Vec4', component: BaseNode, category: 'Constants', icon: Triangle,
    inputs: ['x', 'y', 'z', 'w'], outputs: ['out'], initialValues: { x: 0, y: 0, z: 0, w: 0 } 
  },

  // --- Attributes ---
  { 
    type: NodeType.UV, label: 'UV Scale', component: BaseNode, category: 'Attributes', icon: Grid,
    inputs: [], outputs: ['out'], initialValue: 1.0 
  },
  { 
    type: NodeType.SCREEN_UV, label: 'Screen UV', component: BaseNode, category: 'Attributes', icon: Grid,
    inputs: [], outputs: ['out'] 
  },
  { 
    type: NodeType.NORMAL, label: 'Normal', component: BaseNode, category: 'Attributes', icon: Activity,
    inputs: [], outputs: ['out'] 
  },
  { 
    type: NodeType.POSITION, label: 'Position', component: BaseNode, category: 'Attributes', icon: Move,
    inputs: [], outputs: ['out'] 
  },
  { 
    type: NodeType.TIME, label: 'Time', component: BaseNode, category: 'Attributes', icon: Zap,
    inputs: [], outputs: ['out'] 
  },

  // --- Math ---
  { 
    type: NodeType.ADD, label: 'Add', component: BaseNode, category: 'Math', icon: Plus,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } 
  },
  { 
    type: NodeType.SUB, label: 'Subtract', component: BaseNode, category: 'Math', icon: Minus,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } 
  },
  { 
    type: NodeType.MUL, label: 'Multiply', component: BaseNode, category: 'Math', icon: X,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } 
  },
  { 
    type: NodeType.DIV, label: 'Divide', component: BaseNode, category: 'Math', icon: Divide,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } 
  },
  { 
    type: NodeType.MOD, label: 'Modulo', component: BaseNode, category: 'Math', icon: Percent,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } 
  },
  { 
    type: NodeType.POW, label: 'Power', component: BaseNode, category: 'Math', icon: Zap,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } 
  },
  { 
    type: NodeType.SQRT, label: 'Sqrt', component: BaseNode, category: 'Math', icon: Activity,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 1.0 } 
  },
  { 
    type: NodeType.RECIPROCAL, label: 'Reciprocal (1/x)', component: BaseNode, category: 'Math', icon: Divide,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 1.0 } 
  },
  { 
    type: NodeType.ONE_MINUS, label: 'One Minus (1-x)', component: BaseNode, category: 'Math', icon: Minus,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.SIN, label: 'Sin', component: BaseNode, category: 'Math', icon: Waves,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.COS, label: 'Cos', component: BaseNode, category: 'Math', icon: Waves,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.TAN, label: 'Tan', component: BaseNode, category: 'Math', icon: Waves,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.ABS, label: 'Abs', component: BaseNode, category: 'Math', icon: Activity,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.FLOOR, label: 'Floor', component: BaseNode, category: 'Math', icon: Minimize,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.CEIL, label: 'Ceil', component: BaseNode, category: 'Math', icon: Maximize,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.FRACT, label: 'Fract', component: BaseNode, category: 'Math', icon: Activity,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.SIGN, label: 'Sign', component: BaseNode, category: 'Math', icon: Activity,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } 
  },
  { 
    type: NodeType.MIN, label: 'Min', component: BaseNode, category: 'Math', icon: Minimize2,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } 
  },
  { 
    type: NodeType.MAX, label: 'Max', component: BaseNode, category: 'Math', icon: Maximize2Icon,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } 
  },
  { 
    type: NodeType.CLAMP, label: 'Clamp', component: BaseNode, category: 'Math', icon: Scaling,
    inputs: ['in', 'min', 'max'], outputs: ['out'], initialValues: { in: 0, min: 0, max: 1 } 
  },
  { 
    type: NodeType.REMAP, label: 'Remap', component: BaseNode, category: 'Math', icon: Scaling,
    inputs: ['in', 'inLow', 'inHigh', 'outLow', 'outHigh'], outputs: ['out'],
    initialValues: { in: 0.5, inLow: 0, inHigh: 1, outLow: 0, outHigh: 1 }
  },
  { 
    type: NodeType.SPLIT, label: 'Split / Separate', component: BaseNode, category: 'Math', icon: Split,
    inputs: ['in'], outputs: ['x', 'y', 'z', 'w'] 
  },

  // --- Vectors ---
  { 
    type: NodeType.DOT, label: 'Dot Product', component: BaseNode, category: 'Vectors', icon: Circle,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } 
  },
  { 
    type: NodeType.CROSS, label: 'Cross Product', component: BaseNode, category: 'Vectors', icon: X,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } 
  },
  { 
    type: NodeType.LENGTH, label: 'Length', component: BaseNode, category: 'Vectors', icon: Maximize2Icon,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0 } 
  },
  { 
    type: NodeType.DISTANCE, label: 'Distance', component: BaseNode, category: 'Vectors', icon: Maximize,
    inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } 
  },
  { 
    type: NodeType.NORMALIZE, label: 'Normalize', component: BaseNode, category: 'Vectors', icon: Target,
    inputs: ['in'], outputs: ['out'], initialValues: { in: 0 } 
  },
  { 
    type: NodeType.REFLECT, label: 'Reflect', component: BaseNode, category: 'Vectors', icon: ArrowUpLeft,
    inputs: ['in', 'normal'], outputs: ['out'], initialValues: { in: 0, normal: 0 } 
  },

  // --- Logic ---
  { 
    type: NodeType.MIX, label: 'Mix (Lerp)', component: BaseNode, category: 'Logic', icon: Combine,
    inputs: ['a', 'b', 'alpha'], outputs: ['out'], initialValues: { a: 0.0, b: 1.0, alpha: 0.5 } 
  },
  { 
    type: NodeType.STEP, label: 'Step', component: BaseNode, category: 'Logic', icon: Type,
    inputs: ['edge', 'in'], outputs: ['out'], initialValues: { edge: 0.5, in: 0.0 } 
  },
  { 
    type: NodeType.SMOOTHSTEP, label: 'Smoothstep', component: BaseNode, category: 'Logic', icon: Waves,
    inputs: ['low', 'high', 'in'], outputs: ['out'], initialValues: { low: 0.0, high: 1.0, in: 0.0 } 
  },

  // --- Patterns & Textures ---
  { 
    type: NodeType.TEXTURE, label: 'Texture 2D', component: TextureNode, category: 'Patterns & Textures', icon: ImageIcon,
    inputs: ['uv'], outputs: ['out'] 
  },
  { 
    type: NodeType.TRIPLANAR, label: 'Triplanar', component: TextureNode, category: 'Patterns & Textures', icon: Box,
    inputs: ['scale', 'normal', 'position'], outputs: ['out'], initialValues: { scale: 1.0 } 
  },
  { 
    type: NodeType.CHECKER, label: 'Checker', component: BaseNode, category: 'Patterns & Textures', icon: Grid,
    inputs: ['uv'], outputs: ['out'] 
  },
  { 
    type: NodeType.SIMPLEX_NOISE_2D, label: 'Simplex Noise 2D', component: BaseNode, category: 'Patterns & Textures', icon: Waves,
    inputs: ['uv'], outputs: ['out'] 
  },
  
  // --- Depth ---
  { 
    type: NodeType.VIEWPORT_DEPTH_TEXTURE, label: 'Viewport Depth Tex', component: BaseNode, category: 'Depth', icon: Layers,
    inputs: ['uv', 'level'], outputs: ['out'] 
  },
  { 
    type: NodeType.VIEWPORT_DEPTH, label: 'Viewport Depth', component: BaseNode, category: 'Depth', icon: ArrowDown,
    inputs: [], outputs: ['out'] 
  },
  { 
    type: NodeType.LINEAR_DEPTH, label: 'Linear Depth', component: BaseNode, category: 'Depth', icon: ArrowDown,
    inputs: ['depth', 'near', 'far'], outputs: ['out'] 
  },
  { 
    type: NodeType.CAMERA_NEAR, label: 'Camera Near', component: BaseNode, category: 'Depth', icon: Minimize2,
    inputs: [], outputs: ['out'] 
  },
  { 
    type: NodeType.CAMERA_FAR, label: 'Camera Far', component: BaseNode, category: 'Depth', icon: Maximize,
    inputs: [], outputs: ['out'] 
  },
  { 
    type: NodeType.PERSPECTIVE_DEPTH_TO_VIEW_Z, label: 'Depth → ViewZ', component: BaseNode, category: 'Depth', icon: ArrowDown,
    inputs: ['depth', 'near', 'far'], outputs: ['out'] 
  },
  { 
    type: NodeType.VIEW_Z_TO_ORTHOGRAPHIC_DEPTH, label: 'ViewZ → OrthoDepth', component: BaseNode, category: 'Depth', icon: ArrowDown,
    inputs: ['viewZ', 'near', 'far'], outputs: ['out'] 
  },

  // --- Tools ---
  { 
    type: NodeType.PREVIEW, label: 'Preview', component: PreviewNode, category: 'Tools', icon: Eye,
    inputs: ['in'], outputs: [] 
  },

  // --- Output ---
  { 
    type: NodeType.MATERIAL, label: 'Material Output', component: BaseNode, category: 'Output', icon: Box,
    inputs: ['color', 'roughness', 'metalness', 'emissive', 'ao', 'normal', 'opacity', 'position', 'depth', 'alphaTest'], outputs: [],
    initialValues: { 
      color: '#ffffff', roughness: 0.2, metalness: 0.8, emissive: '#000000', ao: 1.0, 
      normal: 0, opacity: 1.0, transparent: false, depthWrite: true, depthTest: true, position: 0, depth: 0, alphaTest: 0 
    },
    meta: { settings: ['transparent', 'depthWrite', 'depthTest'] } 
  }
];

export const nodeTypes = NODE_REGISTRY.reduce((acc, node) => {
  acc[`${node.type}Node`] = node.component;
  return acc;
}, {} as Record<string, React.ComponentType<any>>);

export const getNodeDefinition = (type: string | NodeType): NodeDefinition | undefined => {
  const rawType = type.replace('Node', '') as NodeType;
  return NODE_REGISTRY.find(n => n.type === rawType);
};