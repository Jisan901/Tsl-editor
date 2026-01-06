
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
  NORMAL = 'normal',
  POSITION = 'position',
  TIME = 'time',
  
  // Math Basic
  ADD = 'add',
  SUB = 'sub',
  MUL = 'mul',
  DIV = 'div',
  
  // Math Advanced
  POW = 'pow',
  ABS = 'abs',
  SIN = 'sin',
  COS = 'cos',
  TAN = 'tan',
  FLOOR = 'floor',
  CEIL = 'ceil',
  MIN = 'min',
  MAX = 'max',
  
  // Logic / Mix
  MIX = 'mix',
  STEP = 'step',
  SMOOTHSTEP = 'smoothstep',
  
  // Patterns
  NOISE = 'noise',
  CHECKER = 'checker',
  
  // Output
  MATERIAL = 'material'
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
