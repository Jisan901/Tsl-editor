
import { Edge } from '@xyflow/react';
import { CustomNode, NodeType } from '../types';
import { Sparkles, Waves, Grid, Layers, Activity, Box, Scan } from 'lucide-react';

export type NodeFactory = (type: string, position: {x: number, y: number}, id?: string) => CustomNode | null;

export interface Example {
    key: string;
    label: string;
    icon: any;
    iconColor?: string;
    generate: (createNode: NodeFactory) => { nodes: CustomNode[], edges: Edge[] };
}

export const EXAMPLES: Example[] = [
    {
        key: 'standard',
        label: 'Standard Material',
        icon: Box,
        generate: (createNode) => {
            const materialNode = createNode(NodeType.MATERIAL, { x: 600, y: 300 }, 'out');
            return { nodes: [materialNode!].filter(Boolean), edges: [] };
        }
    },
    {
        key: 'intersection',
        label: 'Depth Intersection',
        icon: Scan,
        iconColor: 'text-emerald-400',
        generate: (createNode) => {
            const material = createNode(NodeType.MATERIAL, { x: 1100, y: 200 }, 'out');
            if (material) {
                material.data.values = { color: '#00ffff', transparent: true, opacity: 1.0 };
            }

            // Depth / Scene Z Calculation
            const screenUV = createNode(NodeType.SCREEN_UV, { x: 50, y: 50 }, 'scrUV');
            const depthTex = createNode(NodeType.VIEWPORT_DEPTH_TEXTURE, { x: 250, y: 50 }, 'depthTex');
            const camNear = createNode(NodeType.CAMERA_NEAR, { x: 250, y: 150 }, 'camNear');
            const camFar = createNode(NodeType.CAMERA_FAR, { x: 250, y: 250 }, 'camFar');
            const sceneZ = createNode(NodeType.PERSPECTIVE_DEPTH_TO_VIEW_Z, { x: 500, y: 100 }, 'sceneZ');

            // Object Z & Offset
            const viewZ = createNode(NodeType.VIEW_Z, { x: 50, y: 400 }, 'viewZ');
            const offset = createNode(NodeType.FLOAT, { x: 50, y: 500 }, 'offset');
            if(offset) offset.data.value = 0.3;
            const subOffset = createNode(NodeType.SUB, { x: 250, y: 450 }, 'subOffset'); // viewZ - 0.3

            // Difference: SceneZ - (ViewZ - Offset)
            const diff = createNode(NodeType.SUB, { x: 550, y: 300 }, 'diff'); 
            
            // Clamp & Smoothstep for soft edge
            const clamp = createNode(NodeType.CLAMP, { x: 700, y: 300 }, 'clamp');
            if(clamp) clamp.data.values = { min: 0, max: 1 };
            
            const smooth = createNode(NodeType.SMOOTHSTEP, { x: 850, y: 300 }, 'smooth');
            if(smooth) smooth.data.values = { low: 0, high: 1 };

            // Fresnel Effect
            const fresnel = createNode(NodeType.FRESNEL, { x: 700, y: 50 }, 'fresnel');
            if(fresnel) fresnel.data.values = { power: 5.0 };

            // Combine: (Fresnel + Intersection) / 2
            const add = createNode(NodeType.ADD, { x: 850, y: 150 }, 'add');
            const div = createNode(NodeType.DIV, { x: 980, y: 150 }, 'div');
            const two = createNode(NodeType.FLOAT, { x: 850, y: 50 }, 'two');
            if(two) two.data.value = 2.0;

            const nodes = [material, screenUV, depthTex, camNear, camFar, sceneZ, viewZ, offset, subOffset, diff, clamp, smooth, fresnel, add, div, two].filter(Boolean) as CustomNode[];

            const edges: Edge[] = [
                // Scene Z
                { id: 'e1', source: 'scrUV', target: 'depthTex', targetHandle: 'uv' },
                { id: 'e2', source: 'depthTex', target: 'sceneZ', targetHandle: 'depth' },
                { id: 'e3', source: 'camNear', target: 'sceneZ', targetHandle: 'near' },
                { id: 'e4', source: 'camFar', target: 'sceneZ', targetHandle: 'far' },
                
                // Object Z Offset
                { id: 'e5', source: 'viewZ', target: 'subOffset', targetHandle: 'a' },
                { id: 'e6', source: 'offset', target: 'subOffset', targetHandle: 'b' },

                // Difference
                { id: 'e7', source: 'sceneZ', target: 'diff', targetHandle: 'a' },
                { id: 'e8', source: 'subOffset', target: 'diff', targetHandle: 'b' },

                // Softness
                { id: 'e9', source: 'diff', target: 'clamp', targetHandle: 'in' },
                { id: 'e10', source: 'clamp', target: 'smooth', targetHandle: 'in' },

                // Fresnel + Intersection Mixing
                { id: 'e11', source: 'fresnel', target: 'add', targetHandle: 'a' },
                { id: 'e12', source: 'smooth', target: 'add', targetHandle: 'b' },

                { id: 'e13', source: 'add', target: 'div', targetHandle: 'a' },
                { id: 'e14', source: 'two', target: 'div', targetHandle: 'b' },

                // Output
                { id: 'e15', source: 'div', target: 'out', targetHandle: 'opacity' },
                { id: 'e16', source: 'div', target: 'out', targetHandle: 'emissive' },
            ];

            return { nodes, edges };
        }
    },
    {
        key: 'hologram',
        label: 'Hologram Shield',
        icon: Sparkles,
        iconColor: 'text-blue-500',
        generate: (createNode) => {
            const materialNode = createNode(NodeType.MATERIAL, { x: 900, y: 150 }, 'out');
            if(materialNode) materialNode.data.values = { ...materialNode.data.values, transparent: true, opacity: 1.0 };
            
            const fresnel = createNode(NodeType.FRESNEL, { x: 500, y: 0 }, 'fresnel');
            if(fresnel && fresnel.data.values) fresnel.data.values.power = 3.0;

            const time = createNode(NodeType.TIME, { x: 50, y: 250 }, 'time');
            const speed = createNode(NodeType.FLOAT, { x: 50, y: 150 }, 'speed');
            if (speed) speed.data.value = 0.5;
            
            const mulTime = createNode(NodeType.MUL, { x: 200, y: 200 }, 'mulTime');
            const uv = createNode(NodeType.UV, { x: 50, y: 350 }, 'uv');
            const addUV = createNode(NodeType.ADD, { x: 350, y: 300 }, 'addUV');
            
            const noise = createNode(NodeType.SIMPLEX_NOISE_2D, { x: 500, y: 300 }, 'noise');
            
            const color = createNode(NodeType.COLOR, { x: 400, y: -100 }, 'baseColor');
            if(color) color.data.value = '#00ffff';

            const mix = createNode(NodeType.MIX, { x: 700, y: 200 }, 'mix');
            if (mix && mix.data.values) mix.data.values.alpha = 0.5; 
            
            const mul1 = createNode(NodeType.MUL, { x: 700, y: -50 }, 'mul1');
            const mul2 = createNode(NodeType.MUL, { x: 700, y: 50 }, 'mul2'); // * noise

            const nodes = [materialNode!, fresnel!, time!, speed!, mulTime!, uv!, addUV!, noise!, color!, mul1!, mul2!].filter(Boolean);
            
            const edges: Edge[] = [
                { id: 'e_ts', source: 'time', target: 'mulTime', targetHandle: 'a' },
                { id: 'e_ss', source: 'speed', target: 'mulTime', targetHandle: 'b' },
                { id: 'e_ut', source: 'uv', target: 'addUV', targetHandle: 'a' },
                { id: 'e_mt', source: 'mulTime', target: 'addUV', targetHandle: 'b' },
                { id: 'e_nn', source: 'addUV', target: 'noise', targetHandle: 'uv' },
                { id: 'e_fop', source: 'fresnel', target: 'out', targetHandle: 'opacity' },
                { id: 'e_c1', source: 'baseColor', target: 'mul1', targetHandle: 'a' },
                { id: 'e_f1', source: 'fresnel', target: 'mul1', targetHandle: 'b' },
                { id: 'e_m1', source: 'mul1', target: 'mul2', targetHandle: 'a' },
                { id: 'e_n1', source: 'noise', target: 'mul2', targetHandle: 'b' },
                { id: 'e_em', source: 'mul2', target: 'out', targetHandle: 'emissive' },
                { id: 'e_col', source: 'baseColor', target: 'out', targetHandle: 'color' }, 
            ];

            return { nodes, edges };
        }
    },
    {
        key: 'ocean',
        label: 'Ocean (Vertex)',
        icon: Waves,
        iconColor: 'text-cyan-500',
        generate: (createNode) => {
            const materialNode = createNode(NodeType.MATERIAL, { x: 900, y: 150 }, 'out');
            if(materialNode) materialNode.data.values = { ...materialNode.data.values, color: '#0066ff', roughness: 0.1 };
            
            const time = createNode(NodeType.TIME, { x: 50, y: 50 }, 'time');
            const pos = createNode(NodeType.POSITION, { x: 50, y: 200 }, 'pos');
            
            const split = createNode(NodeType.SPLIT, { x: 200, y: 200 }, 'split');
            const add = createNode(NodeType.ADD, { x: 350, y: 100 }, 'add');
            const sin = createNode(NodeType.SIN, { x: 500, y: 100 }, 'sin');
            
            const amp = createNode(NodeType.FLOAT, { x: 500, y: 0 }, 'amp');
            if(amp) amp.data.value = 0.3;
            
            const mul = createNode(NodeType.MUL, { x: 650, y: 100 }, 'mul');
            const vec3 = createNode(NodeType.VEC3, { x: 700, y: 250 }, 'vec3');

            const nodes = [materialNode!, time!, pos!, split!, add!, sin!, amp!, mul!, vec3!].filter(Boolean);
            const edges: Edge[] = [
                { id: 'e1', source: 'pos', target: 'split', targetHandle: 'in' },
                { id: 'e2', source: 'split', target: 'add', targetHandle: 'a', sourceHandle: 'x' },
                { id: 'e3', source: 'time', target: 'add', targetHandle: 'b' },
                { id: 'e4', source: 'add', target: 'sin', targetHandle: 'in' },
                { id: 'e5', source: 'sin', target: 'mul', targetHandle: 'a' },
                { id: 'e6', source: 'amp', target: 'mul', targetHandle: 'b' },
                { id: 'e7', source: 'mul', target: 'vec3', targetHandle: 'y' },
                { id: 'e8', source: 'vec3', target: 'out', targetHandle: 'position' } 
            ];
            return { nodes, edges };
        }
    },
    {
        key: 'basic',
        label: 'Basic Checker',
        icon: Grid,
        generate: (createNode) => {
            const materialNode = createNode(NodeType.MATERIAL, { x: 900, y: 150 }, 'out');
            const checker = createNode(NodeType.CHECKER, { x: 450, y: 150 }, 'check');
            const uv = createNode(NodeType.UV, { x: 150, y: 150 }, 'uv');
            if (uv) uv.data.value = 4.0;
            
            const nodes = [materialNode!, checker!, uv!].filter(Boolean);
            const edges: Edge[] = [
                { id: 'e1', source: 'uv', target: 'check', targetHandle: 'uv' },
                { id: 'e2', source: 'check', target: 'out', targetHandle: 'color' }
            ];
            return { nodes, edges };
        }
    },
    {
        key: 'noise',
        label: 'Animated Noise',
        icon: Activity,
        generate: (createNode) => {
            const materialNode = createNode(NodeType.MATERIAL, { x: 900, y: 150 }, 'out');
            const noise = createNode(NodeType.SIMPLEX_NOISE_2D, { x: 300, y: 150 }, 'noise');
            const time = createNode(NodeType.TIME, { x: 50, y: 50 }, 'time');
            const uv = createNode(NodeType.UV, { x: 50, y: 200 }, 'uv');
            const add = createNode(NodeType.ADD, { x: 180, y: 150 }, 'add');
            
            const nodes = [materialNode!, noise!, time!, uv!, add!].filter(Boolean);
            const edges: Edge[] = [
                { id: 'e1', source: 'uv', target: 'add', targetHandle: 'b' },
                { id: 'e2', source: 'time', target: 'add', targetHandle: 'a' },
                { id: 'e3', source: 'add', target: 'noise', targetHandle: 'uv' },
                { id: 'e4', source: 'noise', target: 'out', targetHandle: 'color' }
            ];
            return { nodes, edges };
        }
    },
    {
        key: 'depth',
        label: 'Viewport Depth',
        icon: Layers,
        generate: (createNode) => {
            const materialNode = createNode(NodeType.MATERIAL, { x: 900, y: 150 }, 'out');
            const depth = createNode(NodeType.VIEWPORT_DEPTH_TEXTURE, { x: 100, y: 150 }, 'depth');
            const linear = createNode(NodeType.LINEAR_DEPTH, { x: 300, y: 150 }, 'linear');
            const remap = createNode(NodeType.REMAP, { x: 500, y: 150 }, 'remap');
            if (remap && remap.data.values) {
                remap.data.values.inLow = 0;
                remap.data.values.inHigh = 20;
                remap.data.values.outLow = 0;
                remap.data.values.outHigh = 1;
            }
            
            const nodes = [materialNode!, depth!, linear!, remap!].filter(Boolean);
            const edges: Edge[] = [
                { id: 'e1', source: 'depth', target: 'linear', targetHandle: 'depth' },
                { id: 'e2', source: 'linear', target: 'remap', targetHandle: 'in' },
                { id: 'e3', source: 'remap', target: 'out', targetHandle: 'color' }
            ];
            return { nodes, edges };
        }
    }
];
