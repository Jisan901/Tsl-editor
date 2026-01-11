import * as tsl from 'three/tsl';
import { NodeType } from '../../types';
import { defineNode, standardOp } from './utils';
import { Image as ImageIcon, Box, Grid, Waves, Layers, ArrowDown, Minimize2, Maximize, Eye, Play, Scan, Zap } from 'lucide-react';
import { simplexNoise2D } from '../ExtraNodes';
import { TextureNode } from '../../components/TextureNode';
import { PreviewNode } from '../../components/PreviewNode';

export const effectNodes = [
    // --- Patterns & Textures ---
    defineNode(NodeType.TEXTURE, 'Texture 2D', 'Patterns & Textures', ImageIcon, { inputs: ['uv'], outputs: ['out'], initialValue: null },
        (i) => tsl.texture(i.map, i.uv),
        (i, d, id, add) => { 
            add?.('texture'); 
            return `const ${id} = texture(textureLoader.load('${d.value || 'texture.jpg'}'), ${i.uv || 'uv()'});`; 
        },
        TextureNode
    ),
    defineNode(NodeType.TRIPLANAR, 'Triplanar', 'Patterns & Textures', Box, { inputs: ['scale', 'normal', 'position'], outputs: ['out'], initialValues: { scale: 1.0 } },
        (i) => {
             const tex = tsl.texture(i.map);
             return tsl.triplanarTexture(tex, tex, tex, i.scale, i.position, i.normal);
        },
        (i, d, id, add) => {
             add?.('texture'); add?.('triplanarTexture');
             return `const ${id}_tex = texture(textureLoader.load('${d.value || 'texture.jpg'}'));\nconst ${id} = triplanarTexture(${id}_tex, ${id}_tex, ${id}_tex, ${i.scale}, ${i.position}, ${i.normal});`;
        },
        TextureNode
    ),
    defineNode(NodeType.CHECKER, 'Checker', 'Patterns & Textures', Grid, { inputs: ['uv'], outputs: ['out'] },
        (i) => tsl.checker(i.uv || tsl.uv()),
        (i, _, __, add) => { add?.('checker'); return `checker(${i.uv || 'uv()'})`; }
    ),
    defineNode(NodeType.SIMPLEX_NOISE_2D, 'Simplex Noise 2D', 'Patterns & Textures', Waves, { inputs: ['uv'], outputs: ['out'] },
        (i) => simplexNoise2D(i.uv || tsl.uv()),
        (i, _, __, add) => { add?.('simplexNoise2D'); return `simplexNoise2D(${i.uv || 'uv()'})`; }
    ),
    
    // --- Passes ---
    defineNode(NodeType.PASS, 'Pass', 'Patterns & Textures', Play, { inputs: ['in'], outputs: ['out'] },
        (i) => tsl.pass(i.in),
        (i, _, __, add) => { add?.('pass'); return `pass(${i.in})`; }
    ),
    defineNode(NodeType.DEPTH_PASS, 'Depth Pass', 'Patterns & Textures', Scan, { inputs: [], outputs: ['out'] },
        // depthPass usually requires scene/camera in TSL, we simulate a basic version or default
        // @ts-ignore
        () => tsl.depthPass(undefined, undefined),
        (_, __, ___, add) => { add?.('depthPass'); return `depthPass(scene, camera)`; }
    ),


    // --- Depth ---
    defineNode(NodeType.DEPTH, 'Fragment Depth', 'Depth', ArrowDown, { inputs: [], outputs: ['out'] },
        () => tsl.depth,
        (_, __, ___, add) => { add?.('depth'); return `depth`; }
    ),
    defineNode(NodeType.VIEWPORT_DEPTH_TEXTURE, 'Viewport Depth Tex', 'Depth', Layers, { inputs: ['uv', 'level'], outputs: ['out'] },
        (i) => tsl.viewportDepthTexture(i.uv, i.level),
        (i, _, __, add) => { add?.('viewportDepthTexture'); return `viewportDepthTexture(${i.uv || 'null'}, ${i.level})`; }
    ),
    defineNode(NodeType.VIEWPORT_DEPTH, 'Viewport Depth', 'Depth', ArrowDown, { inputs: [], outputs: ['out'] },
        () => tsl.viewportDepth,
        (_, __, ___, add) => { add?.('viewportDepth'); return `viewportDepth`; }
    ),
    defineNode(NodeType.VIEWPORT_LINEAR_DEPTH, 'Viewport Linear Depth', 'Depth', ArrowDown, { inputs: [], outputs: ['out'] },
        () => tsl.viewportLinearDepth,
        (_, __, ___, add) => { add?.('viewportLinearDepth'); return `viewportLinearDepth`; }
    ),
    defineNode(NodeType.LINEAR_DEPTH, 'Linear Depth', 'Depth', ArrowDown, { inputs: ['depth', 'near', 'far'], outputs: ['out'] },
        (i) => tsl.linearDepth(i.depth || tsl.viewportDepthTexture(), i.near, i.far),
        (i, _, __, add) => { add?.('linearDepth'); add?.('viewportDepthTexture'); return `linearDepth(${i.depth || 'viewportDepthTexture()'}, ${i.near || 'cameraNear'}, ${i.far || 'cameraFar'})`; }
    ),
    defineNode(NodeType.CAMERA_NEAR, 'Camera Near', 'Depth', Minimize2, { inputs: [], outputs: ['out'] },
        () => tsl.cameraNear,
        (_, __, ___, add) => { add?.('cameraNear'); return `cameraNear`; }
    ),
    defineNode(NodeType.CAMERA_FAR, 'Camera Far', 'Depth', Maximize, { inputs: [], outputs: ['out'] },
        () => tsl.cameraFar,
        (_, __, ___, add) => { add?.('cameraFar'); return `cameraFar`; }
    ),
    defineNode(NodeType.PERSPECTIVE_DEPTH_TO_VIEW_Z, 'Depth → ViewZ (Persp)', 'Depth', ArrowDown, { inputs: ['depth', 'near', 'far'], outputs: ['out'] },
        ...standardOp(tsl.perspectiveDepthToViewZ, 'perspectiveDepthToViewZ', ['depth', 'near', 'far'])
    ),
    defineNode(NodeType.LOGARITHMIC_DEPTH_TO_VIEW_Z, 'Depth → ViewZ (Log)', 'Depth', ArrowDown, { inputs: ['depth', 'near', 'far'], outputs: ['out'] },
        ...standardOp(tsl.logarithmicDepthToViewZ, 'logarithmicDepthToViewZ', ['depth', 'near', 'far'])
    ),
    defineNode(NodeType.VIEW_Z_TO_ORTHOGRAPHIC_DEPTH, 'ViewZ → OrthoDepth', 'Depth', ArrowDown, { inputs: ['viewZ', 'near', 'far'], outputs: ['out'] },
        ...standardOp(tsl.viewZToOrthographicDepth, 'viewZToOrthographicDepth', ['viewZ', 'near', 'far'])
    ),

    // --- Tools ---
    defineNode(NodeType.PREVIEW, 'Preview', 'Tools', Eye, { inputs: ['in'], outputs: [] },
        (i) => i.in,
        (i) => i.in,
        PreviewNode
    ),

    // --- Output ---
    defineNode(NodeType.MATERIAL, 'Standard Material', 'Output', Box, 
        { 
            inputs: ['color', 'roughness', 'metalness', 'emissive', 'ao', 'normal', 'opacity', 'position'], 
            outputs: [],
            initialValues: { 
                color: '#ffffff', roughness: 0.2, metalness: 0.8, emissive: '#000000', ao: 1.0, 
                normal: 0, opacity: 1.0, transparent: false, position: 0 
            },
            meta: { settings: ['transparent'] }
        },
        () => tsl.float(0), // No-op for material compilation, special handled in compiler
        () => '', // No-op for code gen
    ),
    defineNode(NodeType.BASIC_MATERIAL, 'Basic Material', 'Output', Zap, 
        { 
            inputs: ['fragment', 'opacity', 'position'], 
            outputs: [],
            initialValues: { 
                fragment: '#ffffff', opacity: 1.0, transparent: false, position: 0 
            },
            meta: { settings: ['transparent'] }
        },
        () => tsl.float(0),
        () => '', 
    )
];