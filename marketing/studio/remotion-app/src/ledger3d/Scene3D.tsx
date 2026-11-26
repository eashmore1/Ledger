// The 3D world of the Ledger ad. Everything is a pure function of time `t`
// (seconds) so Remotion renders identical frames every time.
import { Billboard, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { backOut, clamp, easeIn, easeInOut, easeOut, expoOut, Key, lerp, life, noise, prog, rand, shake, spring, track, V3 } from "./anim";
import { Timeline, wordAt } from "./data";
import { Mascot } from "./Mascot";
import {
  avatarCoin, badgeFace, clockFace, COL, goalFace, liveCard, passCard, PEOPLE, Person,
  screenAlone, screenPost, screenRoom, screenStart, streakCard,
} from "./screens";

/* ---------------- textures ---------------- */

export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Canvas texture redrawn whenever `key` changes. */
export const useCanvasTex = (w: number, h: number, draw: Draw, key: string) => {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }, [w, h]);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }, [canvas]);
  useMemo(() => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, canvas, tex]);
  return tex;
};

const glowTexCache: Record<string, THREE.Texture> = {};
export const glowTex = (color: string) => {
  if (glowTexCache[color]) return glowTexCache[color];
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color.replace(/[\d.]+\)$/, "0.35)"));
  g.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (glowTexCache[color] = t);
};

export const Glow: React.FC<{ color: string; size: number; opacity?: number; position?: V3 }> = ({ color, size, opacity = 1, position = [0, 0, 0] }) =>
  opacity <= 0.001 ? null : (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={glowTex(color)} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  );

/* ---------------- objects ---------------- */

const PHONE_W = 1.56, PHONE_H = 3.3, SCR_W = 1.44, SCR_H = 3.18;

export const Phone: React.FC<{ draw: Draw; drawKey: string; position: V3; rotation: V3; scale: number }> = ({ draw, drawKey, position, rotation, scale }) => {
  const tex = useCanvasTex(720, 1590, draw, drawKey);
  if (scale <= 0.001) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[PHONE_W, PHONE_H, 0.16]} radius={0.2} smoothness={6}>
        <meshPhysicalMaterial color="#26222e" metalness={0.75} roughness={0.28} clearcoat={0.6} />
      </RoundedBox>
      {/* side buttons */}
      <mesh position={[PHONE_W / 2 + 0.008, 0.75, 0]}>
        <boxGeometry args={[0.02, 0.36, 0.06]} />
        <meshStandardMaterial color="#3a3442" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-PHONE_W / 2 - 0.008, 0.9, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.06]} />
        <meshStandardMaterial color="#3a3442" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[SCR_W, SCR_H]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      {/* glass sheen */}
      <mesh position={[0.25, 0.6, 0.085]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[0.35, 4.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} depthWrite={false} />
      </mesh>
    </group>
  );
};

/** Thin rounded card with a canvas face. */
export const Card: React.FC<{ w: number; h: number; draw: Draw; drawKey: string; position: V3; rotation?: V3; scale: number; px?: number }> = ({
  w, h, draw, drawKey, position, rotation = [0, 0, 0], scale, px = 400,
}) => {
  const tex = useCanvasTex(Math.round(w * px), Math.round(h * px), draw, drawKey);
  if (scale <= 0.001) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[w - 0.02, h - 0.02, 0.06]} radius={Math.min(0.12, h * 0.22)} position={[0, 0, -0.035]}>
        <meshPhysicalMaterial color="#efe6da" roughness={0.5} clearcoat={0.4} />
      </RoundedBox>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

/** A coin: cylinder with a canvas face on the front (and back). */
export const Coin: React.FC<{ r: number; draw: Draw; drawKey: string; position: V3; rotation?: V3; scale: number; edge?: string; thick?: number }> = ({
  r, draw, drawKey, position, rotation = [0, 0, 0], scale, edge = "#e8c46a", thick = 0.09,
}) => {
  const tex = useCanvasTex(512, 512, draw, drawKey);
  tex.center.set(0.5, 0.5);
  tex.rotation = COIN_ROT;
  const mats = useMemo(
    () => [
      new THREE.MeshPhysicalMaterial({ color: edge, metalness: 0.85, roughness: 0.25, clearcoat: 0.5 }),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    ],
    [tex, edge],
  );
  if (scale <= 0.001) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mats}>
        <cylinderGeometry args={[r, r, thick, 64, 1]} />
      </mesh>
    </group>
  );
};

export let COIN_ROT = Math.PI / 2;
export const setCoinRot = (r: number) => (COIN_ROT = r);

const heartShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-1.6, 0.2, -0.7, 1.3, 0, 0.45);
  s.bezierCurveTo(0.7, 1.3, 1.6, 0.2, 0, -0.9);
  return s;
})();

export const Heart: React.FC<{ position: V3; rotation: V3; scale: number; color: string }> = ({ position, rotation, scale, color }) => {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(heartShape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.16, bevelSegments: 6, curveSegments: 24 });
    g.center();
    return g;
  }, []);
  if (scale <= 0.001) return null;
  return (
    <mesh geometry={geo} position={position} rotation={rotation} scale={scale}>
      <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} clearcoatRoughness={0.15} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  );
};

export const Flame: React.FC<{ t: number; position: V3; scale: number }> = ({ t, position, scale }) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const y = i / 40;
      pts.push(new THREE.Vector2(Math.pow(1 - y, 0.85) * Math.sqrt(y) * 1.05 + 0.0001, y * 2.2 - 0.55));
    }
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  if (scale <= 0.001) return null;
  const layer = (s: number, color: string, i: number, z: number, emis: number) => {
    const w = 1 + noise(t * 7, i) * 0.06, h = 1 + noise(t * 9, i + 5) * 0.09;
    return (
      <mesh geometry={geo} scale={[s * w, s * h, s * w]} position={[noise(t * 5, i + 9) * 0.03, 0, z]} rotation={[0, 0, noise(t * 6, i + 3) * 0.06]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emis} roughness={0.6} toneMapped={false} transparent opacity={i === 0 ? 1 : 0.95} />
      </mesh>
    );
  };
  return (
    <group position={position} scale={scale}>
      <Glow color="rgba(255,110,40,0.9)" size={4.2} opacity={0.75} position={[0, 0.4, -0.3]} />
      {layer(1, "#ff4d12", 0, 0, 1.2)}
      {layer(0.72, "#ff8a2a", 1, 0.08, 1.4)}
      {layer(0.45, "#ffd36b", 2, 0.16, 1.6)}
      <pointLight position={[0, 0.6, 1.2]} intensity={8} distance={6} color="#ff7a30" />
    </group>
  );
};

export const Ring: React.FC<{ k: number; r: number; tube: number; color: string; track?: string; position: V3; rotation?: V3; scale: number }> = ({
  k, r, tube, color, track: trackCol = "#3b2f52", position, rotation = [0, 0, 0], scale,
}) => {
  const q = Math.round(clamp(k) * 200) / 200;
  const arc = useMemo(() => (q > 0.002 ? new THREE.TorusGeometry(r, tube, 24, 200, Math.PI * 2 * q) : null), [q, r, tube]);
  const full = useMemo(() => new THREE.TorusGeometry(r, tube * 0.6, 16, 160), [r, tube]);
  if (scale <= 0.001) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={full}>
        <meshStandardMaterial color={trackCol} roughness={0.6} />
      </mesh>
      {arc && (
        <mesh geometry={arc} rotation={[0, Math.PI, Math.PI / 2]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.3} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

export const FacePlane: React.FC<{ w: number; h: number; draw: Draw; drawKey: string; position: V3; scale?: number; opacity?: number }> = ({
  w, h, draw, drawKey, position, scale = 1, opacity = 1,
}) => {
  const tex = useCanvasTex(Math.round(w * 300), Math.round(h * 300), draw, drawKey);
  if (scale <= 0.001 || opacity <= 0.001) return null;
  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};

/** Drifting bokeh particles at several depths. */
export const Particles: React.FC<{ t: number; color: string; count?: number; opacity: number }> = ({ t, color, count = 70, opacity }) => {
  const mesh = useMemo(() => new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    map: glowTex("rgba(255,255,255,1)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }), count), [count]);
  (mesh.material as THREE.MeshBasicMaterial).color.set(color);
  (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const z = -14 + rand(i * 3.1) * 18;
    const spread = 1 + (2 - z) * 0.32;
    const x = (rand(i * 7.7) - 0.5) * 5 * spread + noise(t * 0.3, i) * 0.3;
    const range = 9 * spread;
    const y = ((rand(i * 1.9) * range + t * (0.12 + rand(i) * 0.25)) % range) - range / 2;
    const s = 0.05 + rand(i * 5.3) * 0.18 + (z > 0 ? 0.12 : 0);
    m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

/** Confetti for the end card. */
export const Confetti: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const N = 90;
  const mesh = useMemo(() => {
    const mm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.16), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.5 }), N);
    const cols = ["#fff6e6", "#5a5fcf", "#ffd36b", "#18103a", "#ffffff", "#ff9a6b"];
    for (let i = 0; i < N; i++) mm.setColorAt(i, new THREE.Color(cols[i % cols.length]));
    return mm;
  }, []);
  const dt = t - t0;
  if (dt < 0) return null;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < N; i++) {
    const a = rand(i * 2.3) * Math.PI * 2, v = 2.2 + rand(i * 4.1) * 3.2;
    const x = Math.cos(a) * v * 0.55 * Math.min(dt, 0.9) + noise(dt * 1.5, i) * 0.3;
    const y = 0.6 + Math.sin(a) * v * 0.6 * Math.min(dt, 0.9) - dt * dt * 0.9 + 1.2;
    const z = 0.5 + (rand(i * 9.2) - 0.5) * 2.5;
    e.set(dt * (3 + rand(i) * 6), dt * (2 + rand(i * 3) * 5), dt * 4 * rand(i * 5));
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

/* ---------------- timing ---------------- */

export const beats = (tl: Timeline) => {
  const L = tl.L;
  return {
    meet: L.meet.start,
    timer: L.start.start,
    press: wordAt(tl, "start", /^start/i),
    post: L.post.start,
    logPress: L.post.start + 0.1,
    friends: wordAt(tl, "post", /^friends/i),
    live: L.live.start,
    room: L.room.start,
    same: L.same.start,
    focus: wordAt(tl, "same", /^Same/i, 1),
    nobody: wordAt(tl, "same", /^Nobody/i),
    streak: L.streak.start,
    badges: wordAt(tl, "streak", /^unlock/i),
    goal: wordAt(tl, "streak", /^crush/i),
    pass: L.pass.start,
    passWord: wordAt(tl, "pass", /^pass/i),
    end: L.brand.start,
    cta: L.cta.start,
    D: tl.duration,
  };
};

/* ---------------- the scene ---------------- */

export const CameraRig: React.FC<{ pos: V3; look: V3; fov: number }> = ({ pos, look, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...look));
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

export const Scene3D: React.FC<{ t: number; tl: Timeline; aspect: number }> = ({ t, tl, aspect }) => {
  const B = beats(tl);
  const wide = aspect > 1;

  /* ---- camera ---- */
  const camKeys: { pos: Key[]; look: Key[] } = {
    pos: [
      { t: 0, v: [0, 0.2, 10.5] },
      { t: 0.55, v: [0, 0.1, 8.6], ease: expoOut },
      { t: B.meet - 0.05, v: [0.15, 0.05, 8.0] },
      { t: B.meet + 0.35, v: [0.35, -0.05, 9.4], ease: expoOut },
      { t: B.timer - 0.05, v: [0.3, -0.05, 8.7] },
      { t: B.timer + 0.4, v: [-1.4, 0.3, 8.6], ease: expoOut },
      { t: B.post - 0.05, v: [-0.6, 0.15, 8.0] },
      { t: B.post + 0.4, v: [1.3, 0.25, 8.4], ease: expoOut },
      { t: B.live - 0.05, v: [0.6, 0.1, 8.0] },
      { t: B.live + 0.45, v: [0, 0.3, 8.4], ease: expoOut },
      { t: B.room - 0.05, v: [0, 0.1, 7.6] },
      { t: B.room + 0.4, v: [0, 0.2, 8.8], ease: expoOut },
      { t: B.same - 0.05, v: [0, 0.1, 7.6] },
      { t: B.same + 0.4, v: [0, 0.6, 8.4], ease: expoOut },
      { t: B.focus, v: [-0.4, 0.4, 7.8] },
      { t: B.nobody, v: [0.6, 0.3, 7.2] },
      { t: B.streak - 0.05, v: [0, 1.6, 9.6] },
      { t: B.streak + 0.4, v: [0, 0.3, 8.2], ease: expoOut },
      { t: B.goal - 0.05, v: [0.2, 0.1, 7.6] },
      { t: B.goal + 0.35, v: [0, 0.1, 8.0], ease: expoOut },
      { t: B.pass - 0.05, v: [0, 0.0, 7.4] },
      { t: B.pass + 0.45, v: [0, 2.2, 7.8], ease: expoOut },
      { t: B.passWord, v: [0, 1.2, 7.2] },
      { t: B.end - 0.05, v: [0, 0.4, 6.8] },
      { t: B.end + 0.45, v: [0, 0.2, 9.2], ease: expoOut },
      { t: B.D, v: [0, 0.1, 8.4] },
    ],
    look: [
      { t: 0, v: [0, -0.1, 0] },
      { t: B.meet, v: [0, -0.1, 0] },
      { t: B.meet + 0.35, v: [0.35, -0.3, 0.6], ease: expoOut },
      { t: B.timer, v: [0.35, -0.3, 0.6] },
      { t: B.timer + 0.4, v: [0, -0.25, 0], ease: expoOut },
      { t: B.live, v: [0, -0.25, 0] },
      { t: B.live + 0.4, v: [0, 0, 0], ease: expoOut },
      { t: B.room, v: [0, -0.2, 0] },
      { t: B.room + 0.4, v: [0, -0.25, 0], ease: expoOut },
      { t: B.same, v: [0, 0, 0] },
      { t: B.streak, v: [0, 0, 0] },
      { t: B.pass, v: [0, -0.2, 0] },
      { t: B.pass + 0.45, v: [0, -0.4, 0], ease: expoOut },
      { t: B.end, v: [0, -0.2, 0] },
      { t: B.end + 0.45, v: [0, -0.6, 0], ease: expoOut },
    ],
  };
  const hits = [0.55, B.meet + 0.3, B.press + 0.05, B.friends, B.passWord + 0.12, B.end + 0.25];
  const [sx, sy] = shake(t, hits, 0.07);
  const cp = track(camKeys.pos, t), cl0 = track(camKeys.look, t);
  // 16:9: pull back so tall stacks fit, and slide the subject right while the hook headline is up (left side)
  const hookSide = wide ? 1.6 * (1 - easeInOut(prog(t, B.meet - 0.1, 0.4))) : 0;
  const pos: V3 = [cp[0] + sx - hookSide, cp[1] + sy, cp[2] * (wide ? 1.3 : 1)];
  const cl: V3 = [cl0[0] - hookSide, cl0[1], cl0[2]];

  /* ---- phone ---- */
  const phoneOn = (t < B.live + 0.35) || (t > B.room - 0.15 && t < B.same + 0.18);
  const phoneKeys: Key[] = [
    { t: 0, v: [0, 0.4, -9] },
    { t: 0.55, v: [0, -0.3, 0], ease: expoOut },
    { t: B.meet, v: [0, -0.25, 0] },
    { t: B.meet + 0.35, v: [-0.75, 0.25, -1.8], ease: expoOut },
    { t: B.timer, v: [-0.75, 0.25, -1.8] },
    { t: B.timer + 0.4, v: [0, -0.15, 0], ease: expoOut },
    { t: B.live, v: [0, -0.15, 0] },
    { t: B.live + 0.35, v: [0, -6, -1], ease: easeIn },
    { t: B.room - 0.15, v: [0, -6, -1] },
    { t: B.room + 0.3, v: [0, -0.2, 0], ease: expoOut },
    { t: B.same, v: [0, -0.2, 0] },
    { t: B.same + 0.18, v: [0, -0.2, -9], ease: easeIn },
  ];
  const spin = t < 0.55 ? (1 - expoOut(prog(t, 0, 0.55))) * -Math.PI * 2.2 : 0;
  const rotKeys: Key[] = [
    { t: 0, v: [-0.3, 0.3, 0.1] },
    { t: 0.55, v: [-0.06, 0.28, 0.04], ease: expoOut },
    { t: B.meet, v: [-0.04, 0.16, 0.02] },
    { t: B.meet + 0.35, v: [0, 0.5, 0], ease: expoOut },
    { t: B.timer, v: [0, 0.5, 0] },
    { t: B.timer + 0.4, v: [-0.04, 0.3, 0.02], ease: expoOut },
    { t: B.post, v: [-0.03, -0.05, 0] },
    { t: B.post + 0.4, v: [-0.04, -0.32, -0.02], ease: expoOut },
    { t: B.live, v: [-0.04, -0.36, -0.02] },
    { t: B.live + 0.3, v: [0.8, -0.2, 0.3] },
    { t: B.room - 0.15, v: [0.6, 0.6, 0] },
    { t: B.room + 0.3, v: [-0.05, 0.18, 0.02], ease: expoOut },
    { t: B.same, v: [-0.03, -0.12, 0] },
  ];
  const pr = track(rotKeys, t);
  const phoneRot: V3 = [pr[0], pr[1] + spin, pr[2]];
  let screenKey = "alone", screenDraw: Draw = (c, w, h) => screenAlone(c, w, h, t);
  if (t >= B.timer && t < B.post) {
    const press = prog(t, B.press, 0.45);
    const running = t > B.press + 0.15;
    // time-lapse: the clock races to 1:12:43 over the line
    const el = running ? easeOut(prog(t, B.press + 0.15, B.post - B.press - 0.35)) * 4363 : 0;
    screenKey = `start${Math.floor(el)}-${press.toFixed(2)}`;
    screenDraw = (c, w, h) => screenStart(c, w, h, { press, elapsed: el, running });
  } else if (t >= B.post && t < B.room - 0.2) {
    const press = prog(t, B.logPress, 0.4);
    const posted = easeOut(prog(t, B.logPress + 0.35, 0.4));
    const props = easeOut(prog(t, B.friends - 0.1, 1.1)) * 24;
    const comment = easeOut(prog(t, B.friends + 0.5, 0.35));
    screenKey = `post${press.toFixed(2)}-${posted.toFixed(2)}-${Math.round(props)}-${comment.toFixed(2)}`;
    screenDraw = (c, w, h) => screenPost(c, w, h, { press, posted, props, comment });
  } else if (t >= B.room - 0.2) {
    const joined = 1 + Math.max(0, (t - B.room - 0.15) / 0.28);
    const left = 42 * 60 + 11 - (t - B.room) * 1;
    const pulse = (Math.sin(t * 8) + 1) / 2;
    screenKey = `room${joined.toFixed(1)}-${Math.floor(left)}-${pulse.toFixed(1)}`;
    screenDraw = (c, w, h) => screenRoom(c, w, h, { joined, left, pulse });
  } else screenKey = `alone${Math.floor(t * 4)}`;
  const phoneScale = phoneOn ? 0.86 : 0;

  /* ---- mascot ---- */
  const mIn = B.meet, mOut = B.timer + 0.3;
  const mascotOn = (t >= mIn - 0.02 && t < mOut) || t >= B.end;
  const jump = prog(t, mIn, 0.55);
  const mY = t < B.end ? lerp(-4.2, -1.75, backOut(jump, 1.4)) : lerp(-5, -2.05, backOut(prog(t, B.end, 0.6), 1.3));
  const land = t < B.end ? t - (mIn + 0.32) : t - (B.end + 0.38);
  const squash = land > 0 && land < 0.5 ? Math.sin(land * 22) * Math.exp(-land * 8) * 0.22 : (t < mIn + 0.3 ? -0.12 : 0);
  const mascotKeys: Key[] = [
    { t: mIn, v: [0.3, mY, 1.2] },
    { t: B.timer, v: [0.3, -1.75, 1.2] },
    { t: B.timer + 0.3, v: [1.4, -6, 1.2], ease: easeIn },
  ];
  let mPos = track(mascotKeys, t);
  if (t < B.timer) mPos = [0.3, mY, 1.2];
  let mScale = 0.95;
  let mRot: V3 = [0, t < B.timer ? -0.12 : -0.45, 0];
  if (t >= B.end) {
    mPos = [0, mY, 0.6];
    mScale = 0.92;
    mRot = [0, noise(t * 0.6, 4) * 0.15, 0];
  }
  const blinkPh = (t * 1.0) % 3.1;
  const blink = blinkPh > 2.95 ? Math.sin(((blinkPh - 2.95) / 0.15) * Math.PI) : 0;
  const waving = (t > mIn + 0.4 && t < B.timer) || (t > B.cta - 0.2);
  const cheering = t > B.end && t < B.cta - 0.2;
  const pose = {
    wave: waving ? easeOut(prog(t, t < B.timer ? mIn + 0.4 : B.cta - 0.2, 0.25)) : 0,
    waveT: t,
    cheer: cheering ? easeOut(prog(t, B.end + 0.3, 0.25)) * (0.85 + Math.sin(t * 9) * 0.15) : 0,
    point: t > B.timer && t < B.post ? easeOut(prog(t, B.timer + 0.3, 0.3)) : 0,
    mouth: (t > mIn + 0.4 && t < B.timer) || t > B.end + 0.3 ? 1 : 0,
    happy: cheering ? 1 : 0,
    blink,
    look: (t > B.timer && t < B.post ? [-0.9, 0.2] : [0, 0]) as [number, number],
    squash,
  };

  /* ---- hearts + avatar coins around the post ---- */
  const hearts = Array.from({ length: 9 }, (_, i) => {
    const t0 = B.friends + i * 0.07;
    const k = prog(t, t0, 1.3);
    if (k <= 0 || k >= 1 || t > B.live + 0.2) return null;
    const a = rand(i * 3.7) * Math.PI * 2;
    const r = 0.6 + rand(i * 1.3) * 1.2;
    const p: V3 = [Math.cos(a) * r * easeOut(k), Math.sin(a) * r * 0.9 * easeOut(k) + k * 0.8, 0.3 + easeOut(k) * (2.5 + rand(i) * 2)];
    const s = Math.sin(Math.PI * Math.min(1, k * 1.4)) * (0.16 + rand(i * 9) * 0.1);
    return <Heart key={i} position={p} rotation={[0.2, noise(t * 2, i) * 0.6, a * 0.2]} scale={s} color={i % 3 ? COL.orangeL : "#ff4d6d"} />;
  });

  /* ---- live cards ---- */
  const liveData: [Person, string, string][] = [
    [PEOPLE[0], "Sarah is studying FAR", "right now · 1h 12m"],
    [PEOPLE[1], "Jordan is studying AUD", "right now · 48m"],
    [PEOPLE[2], "Priya started REG", "just now · Becker"],
    [PEOPLE[3], "Marcus is in a room", "FAR grind room · 4 people"],
  ];
  const pulse = (Math.sin(t * 7) + 1) / 2;
  const liveCards = liveData.map(([p, a, b], i) => {
    const t0 = B.live + 0.08 + i * 0.16;
    const s = life(t, t0, B.room + 0.25 + i * 0.03, 0.45, 0.3);
    const k = expoOut(prog(t, t0, 0.5));
    const out = easeIn(prog(t, B.room - 0.05 + i * 0.03, 0.3));
    const y = 1.2 - i * 0.68;
    const pos: V3 = [lerp(3.5, (i % 2 ? 0.06 : -0.06), k) + out * (i % 2 ? 4 : -4), y, lerp(-3, i * 0.35, k)];
    return (
      <Card key={i} w={2.05} h={0.56} px={470} drawKey={`live${i}-${pulse.toFixed(1)}`} draw={(c, w, h) => liveCard(c, w, h, p, a, b, pulse)}
        position={pos} rotation={[0.05, lerp(-0.9, (i % 2 ? -0.18 : 0.18), k), lerp(0.2, 0, k)]} scale={s} />
    );
  });

  /* ---- room: avatar coins popping around the phone ---- */
  const roomCoins = PEOPLE.slice(0, 5).map((p, i) => {
    const t0 = B.room + 0.15 + i * 0.28;
    const s = life(t, t0, B.same + 0.25, 0.4, 0.2);
    const ang = [-2.4, -0.75, 2.5, 0.65, -1.6][i];
    const pos: V3 = [Math.cos(ang) * 1.0, Math.sin(ang) * 1.45 - 0.1 + noise(t, i) * 0.05, 1.0 + (i % 2) * 0.4];
    return <Coin key={i} r={0.22} drawKey={`ac${i}`} draw={(c, w) => avatarCoin(c, w, p)} position={pos} rotation={[0, noise(t * 0.8, i) * 0.5, 0]} scale={s} edge="#ffffff" />;
  });

  /* ---- same timer ring with orbiting avatars ---- */
  const ringS = life(t, B.same + 0.08, B.streak + 0.15, 0.5, 0.25);
  const ringK = easeOut(prog(t, B.same, 0.6)) * 0.84;
  const orbit = PEOPLE.map((p, i) => {
    const s = life(t, B.focus + i * 0.06, B.streak + 0.1, 0.35, 0.2);
    const a = (i / 6) * Math.PI * 2 + t * 0.9;
    const pos: V3 = [Math.cos(a) * 0.92, Math.sin(a) * 0.32 + 0.25, Math.sin(a) * 0.8 + 0.2];
    return <Coin key={i} r={0.18} drawKey={`oc${i}`} draw={(c, w) => avatarCoin(c, w, p)} position={pos} scale={s} edge="#ffffff" />;
  });
  const left = 42 * 60 - (t - B.same) * 1;

  /* ---- streak: flame, counter, badges, goal ring ---- */
  const flameS = life(t, B.streak - 0.05, B.goal + 0.05, 0.45, 0.18);
  const nStreak = Math.round(1 + easeOut(prog(t, B.streak + 0.1, 1.0)) * 46);
  const badgeKinds = ["week", "month", "century"];
  const badges = badgeKinds.map((k, i) => {
    const t0 = B.badges + i * 0.12;
    const s = life(t, t0, B.goal + 0.05, 0.45, 0.18);
    const flip = (1 - expoOut(prog(t, t0, 0.7))) * Math.PI * 2;
    return <Coin key={k} r={0.3} thick={0.1} drawKey={`b${k}`} draw={(c, w) => badgeFace(c, w, k)} position={[(i - 1) * 0.66, -0.25 + (i === 1 ? -0.08 : 0), 1.3]} rotation={[0, flip + (i - 1) * -0.18, 0]} scale={s} />;
  });
  const goalS = life(t, B.goal + 0.08, B.pass + 0.15, 0.45, 0.22);
  const goalK = easeOut(prog(t, B.goal + 0.1, 0.9));
  const hours = lerp(9.5, 15, goalK);

  /* ---- consistency heatmap + passed card ---- */
  const gridS = life(t, B.pass - 0.05, B.end + 0.1, 0.45, 0.2);
  const tiles: React.ReactElement[] = [];
  if (gridS > 0) {
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 7; c++) {
        const i = r * 7 + c;
        const k = easeOut(prog(t, B.pass + 0.05 + (c + r) * 0.045, 0.3));
        const level = rand(i * 2.7) < 0.12 ? 0.35 : 0.65 + rand(i * 1.7) * 0.35;
        const col = new THREE.Color("#3a2c55").lerp(new THREE.Color(level > 0.5 ? "#ff6a1f" : "#a8401a"), k * level + (k > 0 ? 0.1 : 0));
        tiles.push(
          <RoundedBox key={i} args={[0.3, 0.3, 0.12 + k * 0.18 * level]} radius={0.05} position={[(c - 3) * 0.36, (2.5 - r) * 0.36, k * 0.09 * level]}>
            <meshPhysicalMaterial color={col} roughness={0.35} clearcoat={0.5} emissive={col} emissiveIntensity={k * 0.35} />
          </RoundedBox>,
        );
      }
  }
  const passS = life(t, B.passWord - 0.12, B.end + 0.1, 0.3, 0.2);
  const passK = expoOut(prog(t, B.passWord - 0.12, 0.35));
  const stamp = easeOut(prog(t, B.passWord + 0.1, 0.25));

  /* ---- particles colour per section ---- */
  const endK = easeInOut(prog(t, B.end - 0.05, 0.4));
  const pColor = t < B.meet ? "#8fa3ff" : endK > 0.5 ? "#fff1df" : "#ff9a5c";

  return (
    <>
      <CameraRig pos={pos} look={cl} fov={wide ? 26 : 30} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 6]} intensity={2.4} color="#fff3e6" />
      <directionalLight position={[-5, 2, -4]} intensity={3} color={endK > 0.5 ? "#ffffff" : "#ff7a3d"} />
      <directionalLight position={[4, -3, 3]} intensity={0.7} color="#8f8cff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[6, 2, 1]} color="#fff2e2" />
        <Lightformer form="rect" intensity={2} position={[-5, 0, 2]} scale={[2, 6, 1]} color="#ff8a4c" />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, -2]} scale={[2, 6, 1]} color="#7d7cff" />
      </Environment>

      <Particles t={t} color={pColor} opacity={t < B.meet ? 0.35 : 0.5} />

      {/* hook glow behind phone */}
      <Glow color={t < B.meet ? "rgba(120,140,255,0.9)" : "rgba(255,120,50,0.9)"} size={7} opacity={phoneOn ? 0.32 : 0} position={[0, 0, -2.5]} />

      {phoneOn && (
        <Phone draw={screenDraw} drawKey={screenKey} position={track(phoneKeys, t)} rotation={phoneRot} scale={phoneScale} />
      )}

      {mascotOn && <Mascot {...pose} position={mPos} rotation={mRot} scale={mScale} />}
      {t >= mIn && t < B.timer && <Glow color="rgba(255,140,60,0.9)" size={4} opacity={0.35 * easeOut(prog(t, mIn, 0.4))} position={[0.3, -0.6, 0.4]} />}

      {hearts}
      {liveCards}
      {roomCoins}

      {ringS > 0 && (
        <group scale={ringS * 0.74} position={[0, 0.25, 0]} rotation={[0.12 + noise(t * 0.5, 2) * 0.05, -0.2 + (t - B.same) * 0.12, 0]}>
          <Glow color="rgba(255,110,40,0.9)" size={5} opacity={0.4 + (t > B.nobody ? 0.25 : 0)} position={[0, 0, -0.6]} />
          <Ring k={ringK} r={1.12} tube={0.085} color="#ff6a1f" position={[0, 0, 0]} scale={1} />
          <FacePlane w={1.7} h={1.2} drawKey={`clk${Math.floor(left)}`} draw={(c, w, h) => clockFace(c, w, h, left)} position={[0, 0, 0.02]} />
        </group>
      )}
      {orbit}

      <Flame t={t} position={[0, 1.0, 0]} scale={flameS * 0.62} />
      {flameS > 0 && (
        <FacePlane w={2.2} h={1.1} drawKey={`st${nStreak}`} draw={(c, w, h) => streakCard(c, w, h, nStreak)}
          position={[0, 0.9, 1.0]} scale={flameS * 0.8} />
      )}
      {badges}
      {goalS > 0 && (
        <group scale={goalS * 0.8} position={[0, 0.3, 0]} rotation={[0.1, noise(t * 0.6, 7) * 0.2, 0]}>
          <Glow color={hours >= 15 ? "rgba(52,211,153,0.9)" : "rgba(255,110,40,0.9)"} size={5} opacity={0.4} position={[0, 0, -0.5]} />
          <Ring k={goalK} r={1.05} tube={0.1} color={hours >= 15 ? "#34d399" : "#ff6a1f"} position={[0, 0, 0]} scale={1} />
          <FacePlane w={1.6} h={1.0} drawKey={`g${hours.toFixed(1)}`} draw={(c, w, h) => goalFace(c, w, h, hours)} position={[0, 0, 0.02]} />
        </group>
      )}

      {gridS > 0 && (
        <group scale={gridS * 0.68} position={[0, 0.2, -0.4]} rotation={[-0.75 + easeOut(prog(t, B.pass, 1.2)) * 0.25, 0, 0]}>
          {tiles}
        </group>
      )}
      <Card w={1.5} h={1.32} px={504} drawKey={`pass${stamp.toFixed(2)}`} draw={(c, w, h) => passCard(c, w, h, stamp)}
        position={[0, lerp(-4, 0.35, passK), lerp(4, 1.2, passK)]} rotation={[lerp(-1.2, -0.05, passK), lerp(0.6, 0.12, passK), lerp(-0.3, 0.04, passK)]} scale={passS} />
      {passS > 0 && <Glow color="rgba(52,211,153,0.9)" size={4} opacity={0.35 * stamp} position={[0, 0.3, 1.0]} />}

      {t > B.end && <Confetti t={t} t0={B.end + 0.3} />}
      {t > B.end && <Glow color="rgba(255,240,210,0.9)" size={6} opacity={0.35} position={[0, -0.4, -1]} />}
      {/* keep a tiny spring on the hook landing for the impact frame */}
      {t < 0.8 && <Glow color="rgba(255,255,255,0.9)" size={3} opacity={Math.max(0, 1 - Math.abs(t - 0.55) * 8) * 0.6 * spring(prog(t, 0.45, 0.2))} position={[0, -0.3, 0.6]} />}
    </>
  );
};
