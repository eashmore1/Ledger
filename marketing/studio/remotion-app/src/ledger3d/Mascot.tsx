// Ledger, the mascot, as a 3D toy: an orange book with cream pages, a darker
// spine, a purple ribbon, big eyes, little arms and legs. Same palette as mascot.js.
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const C = {
  body: "#e2551c", bodyHi: "#f47a3f", spine: "#b23a08", page: "#fff6e6", pageLine: "#e4d2b4",
  ribbon: "#5a5fcf", shoe: "#3d3f9e", ink: "#2a1407", cheek: "#ffb199",
};

export type MascotPose = {
  /** right arm (viewer's left? no: mascot's right = screen left) raise 0..1 */
  wave?: number; // 0..1 how much the waving arm is up
  waveT?: number; // time for the wave wiggle
  cheer?: number; // both arms up 0..1
  point?: number; // right arm points to the side 0..1
  blink?: number; // 0 open, 1 closed
  mouth?: number; // 0 smile, 1 open
  happy?: number; // 0..1 happy (^ ^) eyes
  look?: [number, number]; // pupil offset -1..1
  squash?: number; // + squash, - stretch
  run?: number; // 0..1 blend into a sprint cycle
  runPhase?: number; // radians; one stride per PI
};

const plastic = (color: string, rough = 0.42) => (
  <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.35} clearcoatRoughness={0.4} />
);

const Limb: React.FC<{ from: [number, number, number]; len: number; rot: number; rotY?: number; rotX?: number; color: string; hand?: string; r?: number }> = ({
  from, len, rot, rotY = 0, rotX = 0, color, hand, r = 0.055,
}) => (
  <group position={from} rotation={[rotX, rotY, rot]}>
    <mesh position={[0, -len / 2, 0]}>
      <capsuleGeometry args={[r, len, 8, 16]} />
      {plastic(color, 0.5)}
    </mesh>
    {hand && (
      <mesh position={[0, -len - 0.04, 0]}>
        <sphereGeometry args={[0.095, 24, 24]} />
        {plastic(hand, 0.38)}
      </mesh>
    )}
  </group>
);

export const Mascot: React.FC<MascotPose & { position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }> = ({
  wave = 0, waveT = 0, cheer = 0, point = 0, blink = 0, mouth = 0, happy = 0, look = [0, 0], squash = 0, run = 0, runPhase = 0,
  position = [0, 0, 0], rotation = [0, 0, 0], scale = 1,
}) => {
  const smile = useMemo(() => new THREE.TorusGeometry(0.085, 0.022, 12, 32, Math.PI), []);
  const happyEye = useMemo(() => new THREE.TorusGeometry(0.075, 0.022, 12, 32, Math.PI), []);
  const sy = 1 - squash, sxz = 1 + squash * 0.6;
  const eyeY = 1.3, eyeX = 0.19, front = 0.2;
  // Arms: rotation about z at the shoulder. Down = small angle; up = ~ +/-2.6 rad.
  const wig = Math.sin(waveT * 12) * 0.35;
  const rightArm = -0.35 - cheer * 2.25 - wave * (2.35 + wig) - point * 1.25; // screen-left side is mascot's right
  const leftArm = 0.35 + cheer * 2.25;
  // sprint: legs swing from the hip, arms pump opposite, body bobs twice per cycle
  const swing = Math.sin(runPhase) * run;
  const bob = Math.abs(Math.cos(runPhase)) * 0.08 * run;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* soft blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={[1 + squash * 0.3, 1, 1]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group scale={[sxz, sy, sxz]} position={[0, bob, 0]}>
        {/* legs + shoes */}
        {[-0.22, 0.22].map((x) => (
          <group key={x} position={[x, 0.55, 0]} rotation={[(x < 0 ? 1 : -1) * swing * 0.95, 0, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.06, 0.34, 8, 16]} />
              {plastic(C.spine, 0.5)}
            </mesh>
            <RoundedBox args={[0.26, 0.13, 0.34]} radius={0.06} position={[x < 0 ? -0.03 : 0.03, -0.48, 0.05]}>
              {plastic(C.shoe, 0.4)}
            </RoundedBox>
          </group>
        ))}
        {/* arms (behind cover edges) */}
        <Limb from={[-0.6, 1.2, 0.02]} len={0.42} rot={rightArm * (1 - run) - 0.2 * run} rotX={swing * 1.25} color={C.spine} hand={C.bodyHi} />
        <Limb from={[0.6, 1.2, 0.02]} len={0.42} rot={leftArm * (1 - run) + 0.2 * run} rotX={-swing * 1.25} color={C.spine} hand={C.bodyHi} />
        {/* back cover, pages, front cover, spine */}
        <RoundedBox args={[1.2, 1.42, 0.09]} radius={0.04} position={[0.04, 1.08, -0.15]}>
          {plastic(C.body)}
        </RoundedBox>
        <RoundedBox args={[1.16, 1.36, 0.24]} radius={0.05} position={[0.07, 1.03, 0]}>
          <meshStandardMaterial color={C.page} roughness={0.85} />
        </RoundedBox>
        {[0.95, 1.0, 1.05].map((k, i) => (
          <mesh key={i} position={[0.655, 1.03, -0.08 + i * 0.08]}>
            <boxGeometry args={[0.004, 1.24 * k * 0.95, 0.006]} />
            <meshBasicMaterial color={C.pageLine} />
          </mesh>
        ))}
        <RoundedBox args={[1.2, 1.42, 0.1]} radius={0.045} position={[0, 1.1, 0.15]}>
          {plastic(C.body)}
        </RoundedBox>
        <RoundedBox args={[0.2, 1.43, 0.42]} radius={0.08} position={[-0.56, 1.09, 0]}>
          {plastic(C.spine, 0.5)}
        </RoundedBox>
        {/* cover highlight band */}
        <mesh position={[0.1, 1.68, front + 0.001]}>
          <planeGeometry args={[0.72, 0.08]} />
          <meshBasicMaterial color={C.bodyHi} transparent opacity={0.55} />
        </mesh>
        {/* ribbon */}
        <group position={[0.32, 1.86, 0]}>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.16, 0.22, 0.03]} />
            {plastic(C.ribbon, 0.5)}
          </mesh>
          <mesh position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.08, 0.08, 0.031]} />
            <meshBasicMaterial color={C.page} />
          </mesh>
        </group>
        {/* eyes */}
        {[-eyeX, eyeX].map((x) => (
          <group key={x} position={[x + 0.04, eyeY, front]}>
            {happy > 0.5 ? (
              <mesh geometry={happyEye} position={[0, -0.02, 0.02]}>
                <meshBasicMaterial color={C.ink} />
              </mesh>
            ) : (
              <group scale={[1, Math.max(0.08, 1 - blink), 1]}>
                <mesh scale={[0.115, 0.125, 0.05]}>
                  <sphereGeometry args={[1, 32, 24]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.2} />
                </mesh>
                <mesh position={[look[0] * 0.03 + 0.008, look[1] * 0.03 - 0.01, 0.045]} scale={[0.06, 0.064, 0.02]}>
                  <sphereGeometry args={[1, 24, 16]} />
                  <meshStandardMaterial color={C.ink} roughness={0.15} />
                </mesh>
                <mesh position={[look[0] * 0.03 - 0.016, look[1] * 0.03 + 0.016, 0.066]} scale={[0.022, 0.022, 0.01]}>
                  <sphereGeometry args={[1, 12, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            )}
          </group>
        ))}
        {/* cheeks */}
        {[-0.3, 0.38].map((x) => (
          <mesh key={x} position={[x, 1.1, front + 0.002]}>
            <circleGeometry args={[0.06, 24]} />
            <meshBasicMaterial color={C.cheek} transparent opacity={0.8} />
          </mesh>
        ))}
        {/* mouth: smile <-> open */}
        <group position={[0.04, 1.1, front + 0.004]}>
          {mouth < 0.3 ? (
            <mesh geometry={smile} rotation={[0, 0, Math.PI]}>
              <meshBasicMaterial color={C.ink} />
            </mesh>
          ) : (
            <group scale={[1, 0.6 + mouth * 0.5, 1]}>
              <mesh rotation={[0, 0, Math.PI]}>
                <circleGeometry args={[0.1, 32, 0, Math.PI]} />
                <meshBasicMaterial color={C.ink} />
              </mesh>
              <mesh position={[0, -0.06, 0.001]} scale={[1, 0.55, 1]}>
                <circleGeometry args={[0.055, 24]} />
                <meshBasicMaterial color="#ff8c7a" />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
};
