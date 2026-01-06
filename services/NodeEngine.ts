import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';
import * as THREE from 'three';

export interface EvaluationContext {
  time: number;
  [key: string]: any;
}

export type NodeValue = number | string | THREE.Vector3 | THREE.Color;

/**
 * NodeEngine now primarily handles scalar/color resolution for 
 * UI status indicators and property panels. 
 * Heavy spatial logic is handled by the GPU in PreviewCanvas.
 */
export class NodeEngine {
  static resolveValue(
    targetNodeId: string,
    targetHandle: string,
    nodes: CustomNode[],
    edges: Edge[],
    context: EvaluationContext
  ): NodeValue {
    const edge = edges.find(e => e.target === targetNodeId && e.targetHandle === targetHandle);
    const targetNode = nodes.find(n => n.id === targetNodeId);

    if (!edge) {
      if (targetNode?.data.values && targetNode.data.values[targetHandle] !== undefined) {
        return targetNode.data.values[targetHandle];
      }
      return (targetNode?.data.value as NodeValue) ?? 0;
    }

    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return 0;

    return this.evaluateNode(sourceNode, nodes, edges, context);
  }

  static evaluateNode(node: CustomNode, nodes: CustomNode[], edges: Edge[], context: EvaluationContext): NodeValue {
    const type = node.type?.replace('Node', '') as NodeType;

    switch (type) {
      case NodeType.FLOAT:
        return parseFloat(String(node.data.value || 0));
      
      case NodeType.COLOR:
        return String(node.data.value || '#ffffff');

      case NodeType.TIME:
        return context.time;

      case NodeType.UV:
      case NodeType.NORMAL:
      case NodeType.POSITION:
        // These are handled by the GPU. In the UI, we just return a placeholder vector.
        return new THREE.Vector3(0.5, 0.5, 0.5);

      case NodeType.ADD:
      case NodeType.MUL:
      case NodeType.SUB:
      case NodeType.DIV: {
        const a = this.resolveValue(node.id, 'a', nodes, edges, context);
        const b = this.resolveValue(node.id, 'b', nodes, edges, context);
        
        const isColorA = typeof a === 'string' && a.startsWith('#');
        const isColorB = typeof b === 'string' && b.startsWith('#');
        if (isColorA || isColorB) {
          const c1 = new THREE.Color(isColorA ? (a as string) : '#000000');
          const c2 = new THREE.Color(isColorB ? (b as string) : '#000000');
          if (type === NodeType.ADD) c1.add(c2);
          else if (type === NodeType.MUL) c1.multiply(c2);
          return '#' + c1.getHexString();
        }

        const va = Number(a);
        const vb = Number(b);
        if (type === NodeType.ADD) return va + vb;
        if (type === NodeType.MUL) return va * vb;
        return va;
      }

      default:
        return (node.data.value as NodeValue) ?? 0;
    }
  }
}