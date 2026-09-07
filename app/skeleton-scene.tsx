'use client';
import { useEffect, useRef } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  cameraDistance,
  cameraDirections,
  regions,
  type SceneState,
} from './skeleton-state';
type Part = {
  positions: { offset: number; count: number };
  normals: { offset: number; count: number };
  indices: { offset: number; count: number };
  colors?: { offset: number; count: number };
  color?: number[];
  name?: string;
};
type Manifest = Partial<Part> & {
  parts?: Part[];
  byteLength: number;
  file: string;
  vertices: number;
  triangles: number;
};
type Props = {
  state: SceneState;
  onReady: () => void;
  onError: (message: string) => void;
};

export default function SkeletonScene({ state, onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(state);
  const callbacks = useRef({ onReady, onError });
  useEffect(() => {
    latest.current = state;
    callbacks.current = { onReady, onError };
  }, [state, onReady, onError]);
  useEffect(() => {
    const el = host.current!;
    const abort = new AbortController();
    let disposed = false,
      frame = 0,
      dirty = true,
      ready = false;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      callbacks.current.onError(
        'Your browser could not start 3D. Please enable WebGL or try another browser.',
      );
      return;
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, el.clientWidth < 768 ? 1.5 : 2),
    );
    renderer.setClearColor('#f2f3f3');
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      'Chimpanzee anatomy. Drag to rotate; scroll or pinch to zoom. Camera and region buttons provide keyboard controls.',
    );
    renderer.domElement.setAttribute('role', 'img');
    const scene = new T.Scene();
    scene.fog = new T.Fog('#f2f3f3', 9, 22);
    const camera = new T.PerspectiveCamera(32, 1, 0.005, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minDistance = 0.35;
    controls.maxDistance = 18;
    controls.autoRotateSpeed = 1;
    controls.enablePan = true;
    controls.addEventListener('change', () => {
      dirty = true;
    });
    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0xb8bcc2, 1.05));
    const key = new T.DirectionalLight(0xfffaf1, 2.3);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new T.DirectionalLight(0xe5edff, 1.65);
    rim.position.set(3, 3, -4);
    scene.add(rim);
    const platform = new T.Mesh(
      new T.CylinderGeometry(0.85, 0.87, 0.022, 96),
      new T.MeshStandardMaterial({
        color: '#e9eceb',
        roughness: 0.82,
        metalness: 0.05,
      }),
    );
    platform.position.y = -0.025;
    scene.add(platform);
    const ring = new T.Mesh(
      new T.RingGeometry(0.77, 0.773, 128),
      new T.MeshBasicMaterial({
        color: '#a8b1b7',
        transparent: true,
        opacity: 0.42,
        side: T.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.012;
    scene.add(ring);
    const ground = new T.Mesh(
      new T.PlaneGeometry(70, 70),
      new T.MeshStandardMaterial({ color: '#f0f1f1', roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.04;
    scene.add(ground);
    const anatomy = new T.Group();
    scene.add(anatomy);
    let modelWidth = 1.1;
    let oldState: SceneState | undefined;
    const fit = () => {
      const s = latest.current;
      const region =
        s.model === 'skeleton'
          ? regions.find((r) => r.id === s.region)!
          : { center: [0, 1.15, 0] as const, height: 2.3, width: modelWidth };
      const center = new T.Vector3(...region.center);
      const distance = cameraDistance(
        region.height,
        region.width,
        el.clientWidth,
        el.clientHeight,
      );
      const direction = new T.Vector3()
        .fromArray(
          s.model === 'muscles-head' && s.view === 'three-quarter'
            ? [0.9, 0.1, 1]
            : s.model === 'muscles-head' && s.view === 'side'
              ? [1, 0, 0]
              : [...cameraDirections[s.view]],
        )
        .normalize();
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, distance);
      camera.updateProjectionMatrix();
      controls.update();
      dirty = true;
    };
    const resize = () => {
      const width = Math.max(el.clientWidth, 1),
        height = Math.max(el.clientHeight, 1);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      fit();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const contextLost = (event: Event) => {
      event.preventDefault();
      callbacks.current.onError(
        'The 3D view was interrupted. Reload the model to continue.',
      );
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const load = async () => {
      const metaResponse = await fetch(
        `/models/chimp-${latest.current.model}.json`,
        {
          signal: abort.signal,
        },
      );
      if (!metaResponse.ok)
        throw new Error(
          'The anatomy information could not load. Please retry.',
        );
      const meta: Manifest = await metaResponse.json();
      const compressed = typeof DecompressionStream !== 'undefined';
      const response = await fetch(
        compressed ? meta.file : meta.file.replace(/\.gz$/, ''),
        { signal: abort.signal },
      );
      if (!response.ok)
        throw new Error('The anatomy download failed. Please retry.');
      const downloaded = await response.arrayBuffer();
      const prefix = new Uint8Array(
        downloaded,
        0,
        Math.min(2, downloaded.byteLength),
      );
      const buffer =
        prefix[0] === 31 && prefix[1] === 139
          ? await new Response(
              new Blob([downloaded])
                .stream()
                .pipeThrough(new DecompressionStream('gzip')),
            ).arrayBuffer()
          : downloaded;
      if (disposed) return;
      if (buffer.byteLength !== meta.byteLength)
        throw new Error('The anatomy download was incomplete. Please retry.');
      const parts = meta.parts || [meta as Part];
      for (const part of parts) {
        const geometry = new T.BufferGeometry();
        geometry.setAttribute(
          'position',
          new T.BufferAttribute(
            new Float32Array(
              buffer,
              part.positions.offset,
              part.positions.count,
            ),
            3,
          ),
        );
        geometry.setAttribute(
          'normal',
          new T.BufferAttribute(
            new Int16Array(buffer, part.normals.offset, part.normals.count),
            3,
            true,
          ),
        );
        geometry.setIndex(
          new T.BufferAttribute(
            new Uint32Array(buffer, part.indices.offset, part.indices.count),
            1,
          ),
        );
        geometry.computeBoundingSphere();
        if (part.colors) {
          geometry.setAttribute(
            'color',
            new T.BufferAttribute(
              new Uint8Array(buffer, part.colors.offset, part.colors.count),
              3,
              true,
            ),
          );
        }
        const mesh = new T.Mesh(
          geometry,
          new T.MeshStandardMaterial({
            color: part.color
              ? new T.Color().fromArray(part.color)
              : part.colors
                ? '#ffffff'
                : '#ded4b9',
            vertexColors: Boolean(part.colors),
            metalness: 0.03,
            roughness: 0.54,
            side: T.DoubleSide,
          }),
        );
        mesh.name = part.name || latest.current.model;
        anatomy.add(mesh);
      }
      const size = new T.Box3().setFromObject(anatomy).getSize(new T.Vector3());
      modelWidth = Math.max(size.x, size.z);
      ready = true;
      fit();
      callbacks.current.onReady();
    };
    void load().catch((error) => {
      if (!disposed && error.name !== 'AbortError')
        callbacks.current.onError(
          error.message || 'The anatomy could not load.',
        );
    });
    let previousFrameTime = performance.now();
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const now = performance.now();
      const deltaSeconds = Math.min((now - previousFrameTime) / 1000, 0.1);
      previousFrameTime = now;
      const current = latest.current;
      const refit =
        !oldState ||
        current.reset !== oldState.reset ||
        current.region !== oldState.region ||
        current.view !== oldState.view;
      if (refit) fit();
      if (!refit && oldState && current.zoom !== oldState.zoom) {
        const delta = current.zoom - oldState.zoom;
        const offset = camera.position.clone().sub(controls.target);
        const distance = T.MathUtils.clamp(
          offset.length() * Math.pow(0.8, delta),
          controls.minDistance,
          controls.maxDistance,
        );
        camera.position
          .copy(controls.target)
          .add(offset.normalize().multiplyScalar(distance));
        dirty = true;
      }
      controls.autoRotate = current.rotate && ready;
      oldState = current;
      controls.update(deltaSeconds);
      if (dirty || controls.autoRotate) {
        renderer.render(scene, camera);
        dirty = false;
      }
    };
    animate();
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((m) => m.dispose());
        }
      });
      environment.texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div className="scene" ref={host} />;
}
