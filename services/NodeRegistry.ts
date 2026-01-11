import React from 'react';
import { NodeType } from '../types';
import { coreNodes, NodeDef } from './nodes/coreNodes';

export type NodeDefinition = NodeDef;

export const NODE_REGISTRY: NodeDefinition[] = coreNodes;

export const nodeTypes = NODE_REGISTRY.reduce((acc, node) => {
  acc[`${node.type}Node`] = node.component;
  return acc;
}, {} as Record<string, React.ComponentType<any>>);

export const getNodeDefinition = (type: string | NodeType): NodeDefinition | undefined => {
  const rawType = type.replace('Node', '') as NodeType;
  return NODE_REGISTRY.find(n => n.type === rawType);
};