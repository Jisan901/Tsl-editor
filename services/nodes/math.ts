
import * as tsl from 'three/tsl';
import { NodeType } from '../../types';
import { defineNode, standardOp, methodOp } from './utils';
import { Plus, Minus, X, Divide, Percent, Zap, Activity, Waves, Minimize, Maximize, Minimize2, Scaling, Split } from 'lucide-react';
import React from 'react';

// Helper to create rotated icon
function Maximize2Icon(props: any) { return React.createElement(Minimize2, { ...props, className: "rotate-180" }); }

const safe = (v: any) => v || tsl.float(0);

export const mathNodes = [
    defineNode(NodeType.ADD, 'Add', 'Math', Plus, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } },
        (i) => tsl.add(safe(i.a), safe(i.b)),
        (i, _, __, add) => { add?.('add'); return `${i.a || 'float(0)'}.add(${i.b || 'float(0)'})`; }
    ),
    defineNode(NodeType.SUB, 'Subtract', 'Math', Minus, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } },
        (i) => tsl.sub(safe(i.a), safe(i.b)),
        (i, _, __, add) => { add?.('sub'); return `${i.a || 'float(0)'}.sub(${i.b || 'float(0)'})`; }
    ),
    defineNode(NodeType.MUL, 'Multiply', 'Math', X, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } },
        (i) => tsl.mul(safe(i.a), safe(i.b)),
        (i, _, __, add) => { add?.('mul'); return `${i.a || 'float(0)'}.mul(${i.b || 'float(0)'})`; }
    ),
    defineNode(NodeType.DIV, 'Divide', 'Math', Divide, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } },
        (i) => tsl.div(safe(i.a), safe(i.b)),
        (i, _, __, add) => { add?.('div'); return `${i.a || 'float(0)'}.div(${i.b || 'float(0)'})`; }
    ),
    defineNode(NodeType.MOD, 'Modulo', 'Math', Percent, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } },
        ...standardOp(tsl.mod, 'mod', ['a', 'b'])
    ),
    
    // Advanced
    defineNode(NodeType.POW, 'Power', 'Math', Zap, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 1.0, b: 1.0 } },
        ...standardOp(tsl.pow, 'pow', ['a', 'b'])
    ),
    defineNode(NodeType.SQRT, 'Sqrt', 'Math', Activity, { inputs: ['in'], outputs: ['out'], initialValues: { in: 1.0 } },
        ...standardOp(tsl.sqrt, 'sqrt', ['in'])
    ),
    defineNode(NodeType.RECIPROCAL, 'Reciprocal (1/x)', 'Math', Divide, { inputs: ['in'], outputs: ['out'], initialValues: { in: 1.0 } },
        ...standardOp(tsl.reciprocal, 'reciprocal', ['in'])
    ),
    defineNode(NodeType.ONE_MINUS, 'One Minus (1-x)', 'Math', Minus, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.oneMinus, 'oneMinus', ['in'])
    ),
    defineNode(NodeType.SIN, 'Sin', 'Math', Waves, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.sin, 'sin', ['in'])
    ),
    defineNode(NodeType.COS, 'Cos', 'Math', Waves, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.cos, 'cos', ['in'])
    ),
    defineNode(NodeType.TAN, 'Tan', 'Math', Waves, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.tan, 'tan', ['in'])
    ),
    defineNode(NodeType.ABS, 'Abs', 'Math', Activity, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.abs, 'abs', ['in'])
    ),
    defineNode(NodeType.FLOOR, 'Floor', 'Math', Minimize, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.floor, 'floor', ['in'])
    ),
    defineNode(NodeType.CEIL, 'Ceil', 'Math', Maximize, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.ceil, 'ceil', ['in'])
    ),
    defineNode(NodeType.FRACT, 'Fract', 'Math', Activity, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.fract, 'fract', ['in'])
    ),
    defineNode(NodeType.SIGN, 'Sign', 'Math', Activity, { inputs: ['in'], outputs: ['out'], initialValues: { in: 0.0 } },
        ...standardOp(tsl.sign, 'sign', ['in'])
    ),
    defineNode(NodeType.MIN, 'Min', 'Math', Minimize2, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } },
        ...standardOp(tsl.min, 'min', ['a', 'b'])
    ),
    defineNode(NodeType.MAX, 'Max', 'Math', Maximize2Icon, { inputs: ['a', 'b'], outputs: ['out'], initialValues: { a: 0, b: 0 } },
        ...standardOp(tsl.max, 'max', ['a', 'b'])
    ),
    defineNode(NodeType.CLAMP, 'Clamp', 'Math', Scaling, { inputs: ['in', 'min', 'max'], outputs: ['out'], initialValues: { in: 0, min: 0, max: 1 } },
        ...standardOp(tsl.clamp, 'clamp', ['in', 'min', 'max'])
    ),
    defineNode(NodeType.REMAP, 'Remap', 'Math', Scaling, { inputs: ['in', 'inLow', 'inHigh', 'outLow', 'outHigh'], outputs: ['out'], initialValues: { in: 0.5, inLow: 0, inHigh: 1, outLow: 0, outHigh: 1 } },
        ...standardOp(tsl.remap, 'remap', ['in', 'inLow', 'inHigh', 'outLow', 'outHigh'])
    ),
    defineNode(NodeType.SPLIT, 'Split / Separate', 'Math', Split, { inputs: ['in'], outputs: ['x', 'y', 'z', 'w'] },
        (i) => safe(i.in),
        (i) => i.in || 'float(0)'
    ),
];
