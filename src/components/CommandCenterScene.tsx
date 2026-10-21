import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function readToken(name: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Color();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  ctx.fillRect(0, 0, 1, 1);
  const pixel = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color((pixel[0] ?? 0) / 255, (pixel[1] ?? 0) / 255, (pixel[2] ?? 0) / 255).convertSRGBToLinear();
}

function Architecture({ tilt, running }: { tilt: [number, number]; running: boolean }) {
  const stage = useRef<THREE.Group>(null);
  const { primary, base, surface } = useMemo(() => ({ primary: readToken("--primary"), base: readToken("--ayra-scene-base"), surface: readToken("--ayra-scene-muted") }), []);
  const reduced = useRef(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = media.matches; };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const texture = useMemo(() => {
    const data = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const v = x % 32 === 0 || y % 32 === 0 ? 160 : 48 + ((x * 17 + y * 13) % 9);
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
    const map = new THREE.DataTexture(data, 128, 128);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(5, 5);
    map.needsUpdate = true;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const arcs = useMemo(() => [-2.8, 3.4].map(y => new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => {
    const x = (i - 12) * 1.3;
    return new THREE.Vector3(x, y + x * x * 0.002, -8 + x * x * 0.028);
  }))), []);
  useFrame((_, rawDelta) => {
    if (!stage.current) return;
    const blend = reduced.current ? 1 : 1 - Math.exp(-3 * Math.min(rawDelta, 0.05));
    stage.current.rotation.y = THREE.MathUtils.lerp(stage.current.rotation.y, reduced.current ? 0 : tilt[0] * 0.07, blend);
    stage.current.position.z = THREE.MathUtils.lerp(stage.current.position.z, running ? -0.8 : 0, blend);
  });
  return <>
    <ambientLight intensity={0.8} />
    <directionalLight position={[4, 6, 6]} intensity={2.2} color={surface} />
    <pointLight position={[-7, 2, 2]} intensity={35} color={primary} />
    <Environment resolution={64}>
      <Lightformer intensity={2} position={[0, 5, -2]} scale={[14, 5, 1]} />
      <Lightformer intensity={2} color={primary} position={[-8, 0, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
    </Environment>
    <group ref={stage}>
      <mesh position={[0, -3, -6]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[60, 36, 1, 1]} />
        <meshStandardMaterial color={base} map={texture} metalness={0.7} roughness={0.42} />
      </mesh>
      {/* Horizontal glowing arcs removed at the user's request */}
      {void arcs}
      {[-12, -10, 10, 12].map(x => <mesh key={x} position={[x, 0, -5]} rotation-y={-x * 0.03}>
        <boxGeometry args={[0.12, 6.8, 0.4]} /><meshStandardMaterial color={surface} metalness={0.75} roughness={0.3} />
      </mesh>)}
    </group>
  </>;
}

export default function CommandCenterScene(props: { tilt: [number, number]; running: boolean }) {
  return <div className="command-center-scene" aria-hidden="true">
    <Canvas dpr={1} camera={{ position: [0, 0.8, 11], fov: 43 }} gl={{ alpha: true, antialias: true }}>
      <Architecture {...props} />
    </Canvas>
  </div>;
}