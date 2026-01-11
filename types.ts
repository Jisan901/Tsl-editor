

import { Node, Edge } from '@xyflow/react';

export enum NodeType {
  // Inputs
  FLOAT = 'float',
  COLOR = 'color',
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  VEC4 = 'vec4',
  
  // Attributes
  UV = 'uv',
  SCREEN_UV = 'screenUV',
  VIEWPORT_UV = 'viewportUV', // New
  NORMAL = 'normal',
  NORMAL_VIEW = 'normalView', // New
  POSITION = 'position',
  POSITION_VIEW = 'positionView', // New
  MODEL_VIEW_POSITION = 'modelViewPosition', // New
  TIME = 'time',
  
  // Math Basic
  ADD = 'add',
  SUB = 'sub',
  MUL = 'mul',
  DIV = 'div',
  MOD = 'mod',
  ONE_MINUS = 'oneMinus',
  RECIPROCAL = 'reciprocal',
  
  // Math Advanced
  POW = 'pow',
  ABS = 'abs',
  SQRT = 'sqrt',
  SIN = 'sin',
  COS = 'cos',
  TAN = 'tan',
  FLOOR = 'floor',
  CEIL = 'ceil',
  MIN = 'min',
  MAX = 'max',
  CLAMP = 'clamp',
  FRACT = 'fract',
  SIGN = 'sign',
  REMAP = 'remap',
  
  // Vectors
  DOT = 'dot',
  CROSS = 'cross',
  LENGTH = 'length',
  DISTANCE = 'distance',
  NORMALIZE = 'normalize',
  REFLECT = 'reflect',

  // Logic / Mix
  MIX = 'mix',
  STEP = 'step',
  SMOOTHSTEP = 'smoothstep',
  
  // Patterns
  SIMPLEX_NOISE_2D = 'simplexNoise2d', 
  CHECKER = 'checker',
  VIEWPORT_DEPTH_TEXTURE = 'viewportDepthTexture',
  VIEWPORT_DEPTH = 'viewportDepth',
  VIEWPORT_LINEAR_DEPTH = 'viewportLinearDepth', // New

  // Depth
  LINEAR_DEPTH = 'linearDepth',
  CAMERA_NEAR = 'cameraNear',
  CAMERA_FAR = 'cameraFar',
  PERSPECTIVE_DEPTH_TO_VIEW_Z = 'perspectiveDepthToViewZ',
  VIEW_Z_TO_ORTHOGRAPHIC_DEPTH = 'viewZToOrthographicDepth',
  LOGARITHMIC_DEPTH_TO_VIEW_Z = 'logarithmicDepthToViewZ', // New
  DEPTH = 'depth', // New

  // Textures & Passes
  TEXTURE = 'texture',
  TRIPLANAR = 'triplanar',
  PASS = 'pass', // New
  DEPTH_PASS = 'depthPass', // New

  // Utility
  SPLIT = 'split',
  PREVIEW = 'preview',
  
  // Output
  MATERIAL = 'material',
  BASIC_MATERIAL = 'basicMaterial'
}

export interface NodeData {
  label: string;
  value?: any; 
  values?: Record<string, any>;
  onChange?: (key: string, value: any) => void;
  inputs?: string[];
  outputs?: string[];
  [key: string]: unknown;
}

export type CustomNode = Node<NodeData>;

export interface MaterialState {
  nodes: CustomNode[];
  edges: Edge[];
}