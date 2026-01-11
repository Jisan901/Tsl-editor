import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { WebGPURenderer, MeshStandardNodeMaterial } from 'three/webgpu';
import { CustomNode } from '../types';
import { Edge } from '@xyflow/react';
import { Maximize2, Minimize2, Box, Circle, Disc, Layers, Boxes } from 'lucide-react';
import { MaterialCompiler } from '../services/MaterialCompiler';
import { CodeGenerator } from '../services/CodeGenerator';

interface PreviewCanvasProps {
  nodes: CustomNode[];
  edges: Edge[];
}

const PreviewCanvasComponent: React.FC<PreviewCanvasProps> = ({ nodes, edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const contentRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<any>(null); // Store current compiled material
  const requestRef = useRef<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<'sphere' | 'box' | 'torus' | 'intersection' | 'cubes'>('cubes');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Cache for TSL Uniform objects. Passed to Compiler.
  const uniformCache = useRef<Map<string, any>>(new Map());
  const topologyHash = useRef<string>('');
  
  // Instantiate Compiler once
  const compiler = useMemo(() => new MaterialCompiler(uniformCache.current), []);

  // --- 1. Material Compilation Logic ---
  useEffect(() => {
    // Determine if rebuild is needed
    const outputNode = nodes.find(n => n.type === 'materialNode');
    const isTransparent = outputNode?.data.values?.transparent ? 'true' : 'false';

    const currentTopology = edges.map(e => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`).sort().join('|') + 
                            nodes.map(n => `${n.id}:${n.type}`).sort().join('|') + 
                            isTransparent; // Note: removed activeModel from topology hash as it doesn't affect the shader itself usually

    const needsRebuild = currentTopology !== topologyHash.current;

    if (needsRebuild) {
      try {
        console.groupCollapsed(`[TSL] Compiling Material (${nodes.length} nodes)`);
        
        // Log Node to TSL Code
        const tslCode = CodeGenerator.generateTSL(nodes, edges);
        console.log('%cGenerated TSL:', 'color: #3b82f6; font-weight: bold;', '\n' + tslCode);

        const material = compiler.compile(nodes, edges);
        if (material) {
            materialRef.current = material;
            // Update current mesh immediately if it exists
            if (meshRef.current) {
                meshRef.current.material = material;
            }
            topologyHash.current = currentTopology;
            setError(null);
            console.log('%cMaterial Compiled Successfully', 'color: #22c55e; font-weight: bold;', material);
        }
        console.groupEnd();
      } catch (e: any) {
        console.error('%cMaterial Compilation Failed', 'color: #ef4444; font-weight: bold;', e);
        setError(e.message);
        console.groupEnd();
      }
    }

    // Always update uniforms
    compiler.updateUniforms(nodes);

  }, [nodes, edges, compiler]);


  // --- 2. Scene Content Logic (Geometry Switching) ---
  useEffect(() => {
    if (!contentRef.current) return;
    const group = contentRef.current;
    
    // Clear previous
    group.clear();
    
    // Default material if nothing compiled yet
    const mat = materialRef.current || new MeshStandardNodeMaterial({ color: 0x333333 });
    let heroMesh: THREE.Mesh;

    if (activeModel === 'intersection') {
        // --- Intersecting Cubes Scene ---
        
        // 1. Hero Cube (Receives Material)
        heroMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
        heroMesh.position.set(0, 0, 0);
        heroMesh.castShadow = true;
        heroMesh.receiveShadow = true;
        group.add(heroMesh);

        // 2. Intersecting Neighbor (Standard Grey)
        const box2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.2 })
        );
        box2.position.set(0.6, 0.4, 0.5); 
        box2.castShadow = true;
        box2.receiveShadow = true;
        group.add(box2);

        // 3. Floor/Base Intersection
        const box3 = new THREE.Mesh(
             new THREE.BoxGeometry(2, 0.2, 2),
             new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.5 })
        );
        box3.position.set(0, -0.6, 0); 
        box3.receiveShadow = true;
        group.add(box3);
        
        // 4. Front obstruction
        const box4 = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
        );
        box4.position.set(-0.4, 0.1, 0.7);
        box4.castShadow = true;
        group.add(box4);

    } else if (activeModel === 'cubes') {
        // --- Multiple Overlapping Cubes Cluster ---
        
        // 1. Hero Cube
        heroMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
        heroMesh.position.set(0, 0, 0);
        heroMesh.castShadow = true;
        heroMesh.receiveShadow = true;
        group.add(heroMesh);

        const stdMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.3 });

        // 2. Overlapping Top-Right
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), stdMat);
        c1.position.set(0.5, 0.5, 0.2);
        c1.castShadow = true;
        c1.receiveShadow = true;
        group.add(c1);

        // 3. Overlapping Bottom-Left-Front
        const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), stdMat);
        c2.position.set(-0.5, -0.4, 0.5);
        c2.rotation.y = Math.PI / 6;
        c2.castShadow = true;
        c2.receiveShadow = true;
        group.add(c2);

        // 4. Large Back Plate
        const c3 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), stdMat);
        c3.position.set(0, 0, -0.8);
        c3.receiveShadow = true;
        group.add(c3);

        // 5. Penetrating Cylinder (just to vary shape slightly in the "cubes" scene for interest)
        const c4 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), stdMat);
        c4.position.set(0.2, 0, 0);
        c4.rotation.z = Math.PI / 4;
        c4.castShadow = true;
        c4.receiveShadow = true;
        group.add(c4);

    } else {
        // --- Single Object Scenes ---
        let geometry;
        if (activeModel === 'sphere') geometry = new THREE.IcosahedronGeometry(1, 64);
        else if (activeModel === 'box') geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        else geometry = new THREE.TorusKnotGeometry(0.7, 0.25, 128, 32);

        heroMesh = new THREE.Mesh(geometry, mat);
        heroMesh.castShadow = true;
        heroMesh.receiveShadow = true;
        group.add(heroMesh);
    }

    meshRef.current = heroMesh;

  }, [activeModel]);


  // --- 3. Renderer Init & Loop ---
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Setup Basic Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const contentGroup = new THREE.Group();
    scene.add(contentGroup);
    contentRef.current = contentGroup;
    
    // Trigger initial content build
    // (This is implicitly handled by the activeModel dependency effect running once on mount)

    // Initial dimensions
    const width = containerRef.current.clientWidth || 300;
    const height = containerRef.current.clientHeight || 300;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.5, 2, 3.5);
    cameraRef.current = camera;
    
    const renderer = new WebGPURenderer({ antialias: true });
    // @ts-ignore
    renderer.init().then(() => {
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ReinhardToneMapping; 
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(renderer.domElement);
        }
        rendererRef.current = renderer;
    });

    // Env & Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    
    new THREE.TextureLoader().load('https://threejs.org/manual/examples/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.environment = texture;
        scene.background = new THREE.Color(0x050505); // Use dark color instead of texture for background to see depth better
        scene.environmentIntensity = 0.5;
    });

    const keyLight = new THREE.DirectionalLight(0xfff0dd, 2.0);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0x4488ff, 5.0);
    rimLight.position.set(-2, 3, -4);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = 20;

    // Loop
    const animate = () => {
      controls.update();
      if (rendererRef.current) {
          rendererRef.current.render(scene, camera);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    // Resize
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (cameraRef.current && rendererRef.current && width > 0 && height > 0) {
                cameraRef.current.aspect = width / height;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(width, height);
            }
        }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  const previewSize = isExpanded ? 'w-[500px] h-[500px]' : 'w-56 h-56';

  return (
    <div className={`relative ${previewSize} bg-[#080808] rounded-lg overflow-hidden border border-zinc-800 shadow-2xl group transition-all duration-300`}>
      <div ref={containerRef} className="w-full h-full pointer-events-auto" />
      
      {/* View Selector */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={() => setActiveModel('sphere')} title="Sphere" className={`p-1 rounded-sm border ${activeModel === 'sphere' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Circle size={10} />
         </button>
         <button onClick={() => setActiveModel('box')} title="Box" className={`p-1 rounded-sm border ${activeModel === 'box' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Box size={10} />
         </button>
         <button onClick={() => setActiveModel('torus')} title="Torus" className={`p-1 rounded-sm border ${activeModel === 'torus' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Disc size={10} />
         </button>
         <div className="w-px h-3 bg-zinc-700/50 self-center mx-0.5" />
         <button onClick={() => setActiveModel('intersection')} title="Depth Intersection Scene" className={`p-1 rounded-sm border ${activeModel === 'intersection' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Layers size={10} />
         </button>
         <button onClick={() => setActiveModel('cubes')} title="Overlapping Cubes Cluster" className={`p-1 rounded-sm border ${activeModel === 'cubes' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}>
            <Boxes size={10} />
         </button>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="p-1.5 rounded-sm bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-zinc-500 hover:text-white"
        >
          {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">GPU Live</span>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4 pointer-events-none">
          <div className="bg-zinc-950 border border-red-900/40 p-3 rounded-md shadow-2xl text-center">
             <div className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1">Shader Error</div>
             <div className="text-[7px] text-zinc-400 line-clamp-3 leading-tight font-mono">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PreviewCanvas = React.memo(PreviewCanvasComponent, (prev, next) => {
  // Memoization check
  if (prev.edges !== next.edges) return false;
  if (prev.nodes.length !== next.nodes.length) return false;
  for (let i = 0; i < prev.nodes.length; i++) {
    if (prev.nodes[i] !== next.nodes[i] && prev.nodes[i].data !== next.nodes[i].data) return false;
  }
  return true;
});