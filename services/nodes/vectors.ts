import * as tsl from 'three/tsl';
import { NodeType } from '../../types';
import { defineNode, standardOp } from './utils';
import { Circle, X, Maximize2, Maximize, Target, ArrowUpLeft, Minimize2 } from 'lucide-react';
import React from 'react';

// Helper to create rotated icon
function Maximize2Icon(props: any) { return React.createElement(Minimize2, { ...props, className: "rotate-180" }); }

export const vectorNodes = [
    defineNode(NodeType.DOT, 'Dot Product', 'Vectors', Circle, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } },
        ...standardOp(tsl.dot, 'dot', ['a', 'b'])
    ),
    defineNode(NodeType.CROSS, 'Cross Product', 'Vectors', X, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } },
        ...standardOp(tsl.cross, 'cross', ['a', 'b'])
    ),
    defineNode(NodeType.LENGTH, 'Length', 'Vectors', Maximize2Icon, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0 } },
        ...standardOp(tsl.length, 'length', ['in'])
    ),
    defineNode(NodeType.DISTANCE, 'Distance', 'Vectors', Maximize, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } },
        ...standardOp(tsl.distance, 'distance', ['a', 'b'])
    ),
    defineNode(NodeType.NORMALIZE, 'Normalize', 'Vectors', Target, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0 } },
        ...standardOp(tsl.normalize, 'normalize', ['in'])
    ),
    defineNode(NodeType.REFLECT, 'Reflect', 'Vectors', ArrowUpLeft, { inputs: ['in', 'normal'], outputs: ['out'], initialValues: { in: 0, normal: 0 } },
        ...standardOp(tsl.reflect, 'reflect', ['in', 'normal'])
    ),
];