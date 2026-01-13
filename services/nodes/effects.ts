

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
             return tsl.triplanarTexture(tex, tex, tex, i.scale || tsl.float(1), i.position || tsl.float(0), i.normal || tsl.float(0));
        },
        (i, d, id, add) => {
             add?.('texture'); add?.('triplanarTexture');
             return `const ${id}_tex = texture(textureLoader.load('${d.value || 'texture.jpg'}'));\nconst ${id} = triplanarTexture(${id}_tex, ${id}_tex, ${id}_tex, ${i.scale || '1.0'}, ${i.position || 'positionLocal'}, ${i.normal || 'normalLocal'});`;
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
        (i) => tsl.pass(i.in || tsl.float(0)),
        (i, _, __, add) => { add?.('pass'); return `pass(${i.in || 'float(0)'})`; }
    ),
    defineNode(NodeType.DEPTH_PASS, 'Depth Pass', 'Patterns & Textures', Scan, { inputs: [], outputs: ['out'] },
        // depthPass usually requires scene/camera in TSL, we simulate a basic version or default
        // @ts-ignore
        () => tsl.depthPass(undefined, undefined),
        (_, __, ___, add) => { add?.('depthPass'); return `depthPass(scene, camera)`; }
    ),
    
    // --- Effects & Math ---
    defineNode(NodeType.FRESNEL, 'Fresnel', 'Math', Zap, { inputs: ['viewDir', 'power'], outputs: ['out'], initialValues: { power: 5.0 } },
        (i) => {
            // Default viewDir to normalize(positionView.negate()) if not connected (i.viewDir is null)
            const viewDir = i.viewDir || tsl.positionView.negate().normalize();
            const power = i.power || tsl.float(5.0);
            return tsl.pow(tsl.float(1).sub(tsl.dot(tsl.normalView, viewDir)), power);
        },
        (i, _, id, add) => {
            add?.('pow'); add?.('dot'); add?.('normalView'); add?.('float');
            const viewDir = i.viewDir || 'normalize(positionView.negate())';
            if (!i.viewDir) {
                add?.('normalize');
                add?.('positionView');
            }
            const power = i.power || '5.0';
            return `const ${id} = pow(float(1).sub(dot(normalView, ${viewDir})), ${power});`;
        }
    ),

    // --- Depth ---
    defineNode(NodeType.DEPTH, 'Fragment Depth', 'Depth', ArrowDown, { inputs: [], outputs: ['out'] },
        () => tsl.depth,
        (_, __, ___, add) => { add?.('depth'); return `depth`; }
    ),
    defineNode(NodeType.SCENE_VIEW_Z, 'Scene View Z', 'Depth', ArrowDown, { inputs: ['depth', 'near', 'far'], outputs: ['out'] },
        (i) => tsl.perspectiveDepthToViewZ(i.depth || tsl.viewportDepthTexture(), i.near || tsl.cameraNear, i.far || tsl.cameraFar).mul(1).toVar(),
        (i, _, id, add) => { 
            add?.('perspectiveDepthToViewZ'); 
            return `const ${id} = perspectiveDepthToViewZ(${i.depth || 'viewportDepthTexture()'}, ${i.near || 'cameraNear'}, ${i.far || 'cameraFar'}).mul(1).toVar();`; 
        }
    ),
    defineNode(NodeType.VIEWPORT_DEPTH_TEXTURE, 'Viewport Depth Tex', 'Depth', Layers, { inputs: ['uv'], outputs: ['out'] },
        (i) => tsl.viewportDepthTexture(i.uv), // tsl.viewportDepthTexture() is valid, it handles null uv implicitly or takes vec2
        (i, _, __, add) => { add?.('viewportDepthTexture'); return `viewportDepthTexture(${i.uv || ''})`; }
    ),
    defineNode(NodeType.VIEWPORT_LINEAR_DEPTH, 'Viewport Linear Depth', 'Depth', ArrowDown, { inputs: [], outputs: ['out'] },
        () => tsl.viewportLinearDepth,
        (_, __, ___, add) => { add?.('viewportLinearDepth'); return `viewportLinearDepth`; }
    ),
    defineNode(NodeType.LINEAR_DEPTH, 'Linear Depth', 'Depth', ArrowDown, { inputs: ['depth'], outputs: ['out'] },
        (i) => tsl.linearDepth(i.depth || tsl.viewportDepthTexture()),
        (i, _, __, add) => { add?.('linearDepth'); add?.('viewportDepthTexture'); return `linearDepth(${i.depth || 'viewportDepthTexture()'})`; }
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
        (i) => i.in || tsl.float(0),
        (i) => i.in || 'float(0)',
        PreviewNode
    ),

    // --- Output ---
    defineNode(NodeType.MATERIAL, 'Standard Material', 'Output', Box, 
        { 
            inputs: ['color', 'roughness', 'metalness', 'emissive', 'ao', 'normal', 'opacity', 'position'], 
            outputs: [],
            initialValues: { 
                color: '#ffffff', roughness: 0.2, metalness: 0.8, emissive: '#000000', ao: 1.0, 
                normal: 0, opacity: 1.0, transparent: false, side: 0 
            },
            meta: { 
                settings: ['transparent'],
                enums: { side: { options: { Front: 0, Back: 1, Double: 2 } } }
            }
        },
        () => tsl.float(0), 
        () => '', 
    ),
    defineNode(NodeType.BASIC_MATERIAL, 'Basic Material', 'Output', Zap, 
        { 
            inputs: ['fragment', 'opacity', 'position'], 
            outputs: [],
            initialValues: { 
                fragment: '#ffffff', opacity: 1.0, transparent: false, side: 0 
            },
            meta: { 
                settings: ['transparent'],
                enums: { side: { options: { Front: 0, Back: 1, Double: 2 } } }
            }
        },
        () => tsl.float(0),
        () => '', 
    )
];
