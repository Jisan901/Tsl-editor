import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { WebGPURenderer, MeshStandardNodeMaterial, PostProcessing } from 'three/webgpu';
import { pass } from 'three/tsl';
// @ts-ignore

interface PreviewSceneProps {
    material: MeshStandardNodeMaterial | null;
    activeModel: string;
    onShaderUpdate?: (shader: { vertexShader: string, fragmentShader: string }) => void;
}

export const PreviewScene: React.FC<PreviewSceneProps> = ({ material, activeModel, onShaderUpdate }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<WebGPURenderer | null>(null);
    const postProcessingRef = useRef<PostProcessing | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const contentRef = useRef<THREE.Group | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const requestRef = useRef<number | null>(null);
    const [isRendererReady, setIsRendererReady] = useState(false);

    // 1. Init Renderer & Scene
    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth || 300;
        const height = containerRef.current.clientHeight || 300;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(2.5, 2, 3.5);
        cameraRef.current = camera;

        // WebGPURenderer with antialias: true and forceWebGL: true
        const renderer = new WebGPURenderer({ 
            antialias: true, 
            forceWebGL: true 
        });

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
            
            setIsRendererReady(true);

            // Setup PostProcessing
            try {
                const postProcessing = new PostProcessing(renderer);
                
                const scenePass = pass(scene, camera);
                
                postProcessing.outputNode = scenePass;
                postProcessingRef.current = postProcessing;
            } catch (e) {
                console.error("Failed to setup PostProcessing", e);
            }
        }).catch(e => {
            console.error("Failed to init WebGPURenderer", e);
            if (document.getElementById('fatal-error-display')) {
                const el = document.getElementById('fatal-error-display');
                if(el) {
                    el.textContent = 'Renderer Init Failed: ' + e.message;
                    el.style.display = 'block';
                }
            }
        });

        // Environment
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);
        
        new THREE.TextureLoader().load('https://threejs.org/manual/examples/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            scene.environment = texture;
            scene.background = texture;
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

        const contentGroup = new THREE.Group();
        scene.add(contentGroup);
        contentRef.current = contentGroup;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 1;
        controls.maxDistance = 20;

        // Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0 && rendererRef.current) {
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    rendererRef.current.setSize(width, height);
                }
            }
        });
        resizeObserver.observe(containerRef.current);

        // Render Loop
        const animate = () => {
             if (postProcessingRef.current) {
                 try {
                    postProcessingRef.current.render();
                 } catch(e) {
                    console.warn("PostProcessing render failed, falling back", e);
                    postProcessingRef.current = null; 
                 }
             } else if (rendererRef.current) {
                 rendererRef.current.render(scene, camera);
             }
             requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);

        return () => {
            resizeObserver.disconnect();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (rendererRef.current) rendererRef.current.dispose();
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, []);

    // 2. Update Content based on activeModel or Material
    useEffect(() => {
        if (!contentRef.current || !isRendererReady) return;
        const group = contentRef.current;
        group.clear();
        
        const mat = material || new MeshStandardNodeMaterial({ color: 0x333333 });

        // Expose to window for debugging
        (window as any).material = mat;
        
        let heroMesh: THREE.Mesh;

        if (activeModel === 'intersection') {
            // Hero
            heroMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
            heroMesh.castShadow = true; heroMesh.receiveShadow = true;
            group.add(heroMesh);

            // Neighbor
            const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.2 }));
            box2.position.set(0.6, 0.4, 0.5); 
            box2.castShadow = true; box2.receiveShadow = true;
            group.add(box2);

            // Floor
            const box3 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.5 }));
            box3.position.set(0, -0.6, 0); 
            box3.receiveShadow = true;
            group.add(box3);
            
            // Obstruction
            const box4 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
            box4.position.set(-0.4, 0.1, 0.7);
            box4.castShadow = true;
            group.add(box4);

        } else if (activeModel === 'cubes') {
            // Hero
            heroMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
            heroMesh.castShadow = true; heroMesh.receiveShadow = true;
            group.add(heroMesh);

            const stdMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.3 });

            // Neighbors
            const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), stdMat);
            c1.position.set(0.5, 0.5, 0.2); c1.castShadow = true; c1.receiveShadow = true;
            group.add(c1);

            const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), stdMat);
            c2.position.set(-0.5, -0.4, 0.5); c2.rotation.y = Math.PI / 6;
            c2.castShadow = true; c2.receiveShadow = true;
            group.add(c2);

            const c3 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), stdMat);
            c3.position.set(0, 0, -0.8); c3.receiveShadow = true;
            group.add(c3);

            const c4 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), stdMat);
            c4.position.set(0.2, 0, 0); c4.rotation.z = Math.PI / 4;
            c4.castShadow = true; c4.receiveShadow = true;
            group.add(c4);

        } else {
            let geometry;
            if (activeModel === 'sphere') geometry = new THREE.IcosahedronGeometry(1, 64);
            else if (activeModel === 'box') geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            else geometry = new THREE.TorusKnotGeometry(0.7, 0.25, 128, 32);

            heroMesh = new THREE.Mesh(geometry, mat);
            heroMesh.castShadow = true; heroMesh.receiveShadow = true;
            group.add(heroMesh);
        }

        // Debug Shader Code using getShaderAsync
        if (rendererRef.current && sceneRef.current && cameraRef.current && heroMesh) {
             // @ts-ignore
             if (rendererRef.current.debug && rendererRef.current.debug.getShaderAsync) {
                 // @ts-ignore
                 rendererRef.current.debug.getShaderAsync(sceneRef.current, cameraRef.current, heroMesh)
                 .then((shader: any) => {
                     if (onShaderUpdate) onShaderUpdate(shader);
                 })
                 .catch((e: any) => {
                     // console.warn('Failed to get shader debug info', e);
                 });
             }
        }

    }, [activeModel, material, isRendererReady, onShaderUpdate]);

    return <div ref={containerRef} className="w-full h-full pointer-events-auto" />;
};