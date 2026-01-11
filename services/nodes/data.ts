import * as tsl from 'three/tsl';
import { NodeType } from '../../types';
import { defineNode, standardOp } from './utils';
import { Hash, Circle, Square, Triangle, Grid, Activity, Move, Zap, Combine, Type, Waves, Globe, Map as MapIcon, BoxSelect } from 'lucide-react';

export const dataNodes = [
    // --- Constants ---
    defineNode(NodeType.FLOAT, 'Float', 'Constants', Hash, { inputs: [], outputs: ['out'], initialValue: 0.5 },
        (i, d) => tsl.float(d.value ?? 0),
        (_, d, id, add) => { add?.('float'); return `const ${id} = float(${d.value ?? 0});`; }
    ),
    defineNode(NodeType.COLOR, 'Color', 'Constants', Circle, { inputs: [], outputs: ['out'], initialValue: '#ffffff' },
        (i, d) => tsl.color(d.value || '#ffffff'),
        (_, d, id, add) => { add?.('color'); return `const ${id} = color('${d.value ?? '#fff'}');`; }
    ),
    defineNode(NodeType.VEC2, 'Vec2', 'Constants', Square, { inputs: ['x', 'y'], outputs: ['out'], initialValues: { x: 0, y: 0 } },
        (i) => tsl.vec2(i.x, i.y),
        (i, _, id, add) => { add?.('vec2'); return `const ${id} = vec2(${i.x}, ${i.y});`; }
    ),
    defineNode(NodeType.VEC3, 'Vec3', 'Constants', Triangle, { inputs: ['x', 'y', 'z'], outputs: ['out'], initialValues: { x: 0, y: 0, z: 0 } },
        (i) => tsl.vec3(i.x, i.y, i.z),
        (i, _, id, add) => { add?.('vec3'); return `const ${id} = vec3(${i.x}, ${i.y}, ${i.z});`; }
    ),
    defineNode(NodeType.VEC4, 'Vec4', 'Constants', Triangle, { inputs: ['x', 'y', 'z', 'w'], outputs: ['out'], initialValues: { x: 0, y: 0, z: 0, w: 0 } },
        (i) => tsl.vec4(i.x, i.y, i.z, i.w),
        (i, _, id, add) => { add?.('vec4'); return `const ${id} = vec4(${i.x}, ${i.y}, ${i.z}, ${i.w});`; }
    ),

    // --- Attributes ---
    defineNode(NodeType.UV, 'UV Scale', 'Attributes', Grid, { inputs: [], outputs: ['out'], initialValue: 1.0 },
        (i, d) => tsl.uv().mul(d.value ?? 1.0),
        (_, d, id, add) => { add?.('uv'); return `const ${id} = uv().mul(${d.value ?? 1.0});`; }
    ),
    defineNode(NodeType.SCREEN_UV, 'Screen UV', 'Attributes', Grid, { inputs: [], outputs: ['out'] },
        () => tsl.screenUV,
        (_, __, id, add) => { add?.('screenUV'); return `const ${id} = screenUV;`; }
    ),
    defineNode(NodeType.VIEWPORT_UV, 'Viewport UV', 'Attributes', BoxSelect, { inputs: [], outputs: ['out'] },
        () => tsl.viewportUV,
        (_, __, id, add) => { add?.('viewportUV'); return `const ${id} = viewportUV;`; }
    ),
    defineNode(NodeType.NORMAL, 'Normal', 'Attributes', Activity, { inputs: [], outputs: ['out'] },
        () => tsl.normalLocal,
        (_, __, id, add) => { add?.('normalLocal'); return `const ${id} = normalLocal;`; }
    ),
    defineNode(NodeType.NORMAL_VIEW, 'Normal (View)', 'Attributes', Activity, { inputs: [], outputs: ['out'] },
        () => tsl.normalView,
        (_, __, id, add) => { add?.('normalView'); return `const ${id} = normalView;`; }
    ),
    defineNode(NodeType.POSITION, 'Position', 'Attributes', Move, { inputs: [], outputs: ['out'] },
        () => tsl.positionLocal,
        (_, __, id, add) => { add?.('positionLocal'); return `const ${id} = positionLocal;`; }
    ),
    defineNode(NodeType.POSITION_VIEW, 'Position (View)', 'Attributes', Move, { inputs: [], outputs: ['out'] },
        () => tsl.positionView,
        (_, __, id, add) => { add?.('positionView'); return `const ${id} = positionView;`; }
    ),
    defineNode(NodeType.MODEL_VIEW_POSITION, 'ModelView Position', 'Attributes', Globe, { inputs: [], outputs: ['out'] },
        () => tsl.modelViewPosition,
        (_, __, id, add) => { add?.('modelViewPosition'); return `const ${id} = modelViewPosition;`; }
    ),
    defineNode(NodeType.TIME, 'Time', 'Attributes', Zap, { inputs: [], outputs: ['out'] },
        () => tsl.time,
        (_, __, id, add) => { add?.('time'); return `const ${id} = time;`; }
    ),

    // --- Logic ---
    defineNode(NodeType.MIX, 'Mix (Lerp)', 'Logic', Combine, { inputs: ['a', 'b', 'alpha'], outputs: ['out'], initialValues: { a: 0.0, b: 1.0, alpha: 0.5 } },
        ...standardOp(tsl.mix, 'mix', ['a', 'b', 'alpha'])
    ),
    defineNode(NodeType.STEP, 'Step', 'Logic', Type, { inputs: ['edge', 'in'], outputs: ['out'], initialValues: { edge: 0.5, in: 0.0 } },
        ...standardOp(tsl.step, 'step', ['edge', 'in'])
    ),
    defineNode(NodeType.SMOOTHSTEP, 'Smoothstep', 'Logic', Waves, { inputs: ['low', 'high', 'in'], outputs: ['out'], initialValues: { low: 0.0, high: 1.0, in: 0.0 } },
        ...standardOp(tsl.smoothstep, 'smoothstep', ['low', 'high', 'in'])
    ),
];