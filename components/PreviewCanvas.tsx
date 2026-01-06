import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { WebGPURenderer } from 'three/webgpu';
import * as Nodes from 'three/nodes';
import { CustomNode, NodeType } from '../types';
import { Edge } from '@xyflow/react';

interface PreviewCanvasProps {
  nodes: CustomNode[];
  edges: Edge[];
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ nodes, edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const requestRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<'sphere' | 'box' | 'torus'>('sphere');

  const buildThreeNode = (nodeId: string, visited: Set<string> = new Set()): any => {
    if (visited.has(nodeId)) return Nodes.float(0);
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return Nodes.float(0);

    const type = node.type?.replace('Node', '') as NodeType;

    const getIn = (handle: string, defaultVal: any = 0) => {
      const edge = edges.find(e => e.target === nodeId && e.targetHandle === handle);
      if (edge) return buildThreeNode(edge.source, new Set(visited));
      
      const local = node.data.values?.[handle] ?? node.data.value;
      if (typeof local === 'string' && local.startsWith('#')) return Nodes.color(new THREE.Color(local));
      return Nodes.float(Number(local ?? defaultVal));
    };

    switch (type) {
      case NodeType.FLOAT: return Nodes.uniform(Number(node.data.value || 0));
      case NodeType.COLOR: return Nodes.uniform(new THREE.Color(node.data.value || '#ffffff'));
      case NodeType.TIME: return Nodes.timerGlobal();
      case NodeType.UV: return Nodes.uv().mul(Nodes.uniform(Number(node.data.value ?? 1.0)));
      case NodeType.NORMAL: return Nodes.normalLocal;
      case NodeType.POSITION: return Nodes.positionLocal;
      case NodeType.VEC2: return Nodes.vec2(getIn('x'), getIn('y'));
      case NodeType.VEC3: return Nodes.vec3(getIn('x'), getIn('y'), getIn('z'));
      case NodeType.VEC4: return Nodes.vec4(getIn('x'), getIn('y'), getIn('z'), getIn('w'));
      case NodeType.ADD: return Nodes.add(getIn('a'), getIn('b'));
      case NodeType.SUB: return Nodes.sub(getIn('a'), getIn('b'));
      case NodeType.MUL: return Nodes.mul(getIn('a'), getIn('b'));
      case NodeType.DIV: return Nodes.div(getIn('a'), getIn('b'));
      case NodeType.POW: return Nodes.pow(getIn('a'), getIn('b'));
      case NodeType.ABS: return Nodes.abs(getIn('in'));
      case NodeType.SIN: return Nodes.sin(getIn('in'));
      case NodeType.COS: return Nodes.cos(getIn('in'));
      case NodeType.TAN: return Nodes.tan(getIn('in'));
      case NodeType.FLOOR: return Nodes.floor(getIn('in'));
      case NodeType.CEIL: return Nodes.ceil(getIn('in'));
      case NodeType.MIN: return Nodes.min(getIn('a'), getIn('b'));
      case NodeType.MAX: return Nodes.max(getIn('a'), getIn('b'));
      case NodeType.MIX: return Nodes.mix(getIn('a'), getIn('b'), getIn('alpha'));
      case NodeType.STEP: return Nodes.step(getIn('edge'), getIn('in'));
      case NodeType.SMOOTHSTEP: return Nodes.smoothstep(getIn('low'), getIn('high'), getIn('in'));
      case NodeType.NOISE: return Nodes.noise(getIn('in'));
      case NodeType.CHECKER: return Nodes.checker(getIn('uv', Nodes.uv()));
      default: return Nodes.float(0);
    }
  };

  const updateMaterial = () => {
    if (!meshRef.current) return;
    const outputNode = nodes.find(n => n.type === 'materialNode');
    if (!outputNode) return;

    try {
      const material = new Nodes.MeshStandardNodeMaterial();
      const getSlot = (handle: string) => {
        const edge = edges.find(e => e.target === outputNode.id && e.targetHandle === handle);
        if (edge) return buildThreeNode(edge.source);
        const local = outputNode.data.values?.[handle];
        if (typeof local === 'string' && local.startsWith('#')) return Nodes.color(new THREE.Color(local));
        return Nodes.float(Number(local ?? 0));
      };

      material.colorNode = getSlot('color');
      material.roughnessNode = getSlot('roughness');
      material.metalnessNode = getSlot('metalness');
      material.emissiveNode = getSlot('emissive');
      
      const normalNode = getSlot('normal');
      if (normalNode && normalNode.isNode) material.normalNode = normalNode;

      const pos = getSlot('position');
      if (pos && pos.isNode) material.positionNode = Nodes.positionLocal.add(pos);

      meshRef.current.material = material;
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => { updateMaterial(); }, [nodes, edges]);

  useEffect(() => {
    if (!containerRef.current) return;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: WebGPURenderer;
    let controls: OrbitControls;

    const init = async () => {
      try {
        const width = containerRef.current!.clientWidth;
        const height = containerRef.current!.clientHeight;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);
        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(3, 2, 4);
        renderer = new WebGPURenderer({ antialias: true });
        await renderer.init(); 
        renderer.setSize(width, height);
        containerRef.current!.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(ambient);
        const spot = new THREE.SpotLight(0xffffff, 50);
        spot.position.set(5, 10, 5);
        scene.add(spot);
        const mesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1, 128),
          new Nodes.MeshStandardNodeMaterial({ color: 0xffffff })
        );
        scene.add(mesh);
        meshRef.current = mesh;
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        const animate = () => {
          controls.update();
          renderer.render(scene, camera);
          requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        updateMaterial();
      } catch (err) {
        setError("Renderer failed: " + err);
      }
    };
    init();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  const changeGeom = (type: 'sphere' | 'box' | 'torus') => {
    if (!meshRef.current) return;
    setActiveModel(type);
    meshRef.current.geometry.dispose();
    if (type === 'sphere') meshRef.current.geometry = new THREE.IcosahedronGeometry(1, 128);
    else if (type === 'box') meshRef.current.geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2, 64, 64, 64);
    else if (type === 'torus') meshRef.current.geometry = new THREE.TorusKnotGeometry(0.7, 0.25, 256, 64);
    updateMaterial();
  };

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 flex gap-1 bg-zinc-950/80 p-1 rounded border border-zinc-800 backdrop-blur-md">
        {(['sphere', 'box', 'torus'] as const).map(t => (
          <button 
            key={t}
            onClick={() => changeGeom(t)}
            className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${activeModel === t ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 backdrop-blur-sm p-4 pointer-events-none">
          <div className="bg-zinc-950 border border-red-900/50 p-3 rounded shadow-2xl max-w-xs">
             <div className="text-red-500 text-[9px] font-mono leading-tight break-words uppercase">Compilation Error:</div>
             <div className="text-zinc-400 text-[8px] mt-1 font-mono">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};