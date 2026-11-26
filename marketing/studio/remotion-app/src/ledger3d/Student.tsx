// The CPA candidate: a stylized 3D toy figure (same toy language as Ledger), seen
// from the chest up behind a desk. All expression comes in as props.
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const SKIN = "#d9a27c", SKIN_D = "#c08560", HAIR = "#2b1d16", HOODIE = "#2a7f86", HOODIE_D = "#1f6268", INK = "#24140c";

export type StudentPose = {
  slump?: number;   // 0 upright .. 1 head down, shoulders forward
  tired?: number;   // eyelids half shut
  sad?: number;     // brows tilted up in the middle, frown
  surprise?: number; // brows up, eyes wide, mouth "o"
  smile?: number;   // 0..1 smile
  talk?: number;    // 0..1 mouth open (lip sync)
  cheer?: number;   // arms up
  blink?: number;
  look?: [number, number];
  headTurn?: number; // radians, + looks to his left (screen right)
};

const skin = (c = SKIN) => <meshPhysicalMaterial color={c} roughness={0.55} clearcoat={0.15} />;

export const Student: React.FC<StudentPose & { position?: [number, number, number]; scale?: number }> = ({
  slump = 0, tired = 0, sad = 0, surprise = 0, smile = 0, talk = 0, cheer = 0, blink = 0, look = [0, 0], headTurn = 0,
  position = [0, 0, 0], scale = 1,
}) => {
  const frown = useMemo(() => new THREE.TorusGeometry(0.075, 0.018, 10, 28, Math.PI), []);
  const headTilt = slump * 0.38 - surprise * 0.08 - cheer * 0.1;
  const lid = Math.min(1, Math.max(tired * 0.55, blink));
  const eyeOpen = 1 + surprise * 0.25;
  const browIn = (sad - surprise * 0.2) * 0.35;
  const browY = 0.93 + surprise * 0.06 - tired * 0.02;
  const armUp = cheer;
  return (
    <group position={position} scale={scale}>
      {/* torso: hoodie */}
      <group rotation={[slump * 0.18, 0, 0]}>
        <RoundedBox args={[1.15, 1.25, 0.6]} radius={0.26} smoothness={5} position={[0, -0.32, 0]}>
          <meshPhysicalMaterial color={HOODIE} roughness={0.85} />
        </RoundedBox>
        {/* hood lump behind neck */}
        <mesh position={[0, 0.27, -0.2]} scale={[0.55, 0.22, 0.28]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshPhysicalMaterial color={HOODIE_D} roughness={0.9} />
        </mesh>
        {/* drawstrings */}
        {[-0.11, 0.11].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.31]}>
            <capsuleGeometry args={[0.014, 0.22, 4, 8]} />
            <meshStandardMaterial color="#f2efe8" roughness={0.6} />
          </mesh>
        ))}
        {/* neck */}
        <mesh position={[0, 0.33, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.22, 20]} />
          {skin(SKIN_D)}
        </mesh>
        {/* arms: shoulders -> forearms resting on the desk (or raised) */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[sd * 0.56, 0.05, 0]} rotation={[-(1 - armUp) * 0.9 + armUp * 0.2, 0, sd * (0.15 + armUp * 2.5)]}>
            <mesh position={[0, -0.32, 0]}>
              <capsuleGeometry args={[0.13, 0.42, 8, 16]} />
              <meshPhysicalMaterial color={HOODIE} roughness={0.85} />
            </mesh>
            <group position={[0, -0.62, 0]} rotation={[-(1 - armUp) * 0.9, 0, -sd * armUp * 0.3]}>
              <mesh position={[0, -0.25, 0]}>
                <capsuleGeometry args={[0.12, 0.38, 8, 16]} />
                <meshPhysicalMaterial color={HOODIE} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.55, 0]}>
                <sphereGeometry args={[0.11, 20, 16]} />
                {skin()}
              </mesh>
            </group>
          </group>
        ))}
        {/* head */}
        <group position={[0, 0.48, 0.02]} rotation={[headTilt, headTurn, 0]}>
          <group position={[0, 0.3, 0]}>
            <mesh scale={[1, 1.06, 0.96]}>
              <sphereGeometry args={[0.42, 48, 32]} />
              {skin()}
            </mesh>
            {/* ears */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.41, 0, -0.02]} scale={[0.5, 1, 0.8]}>
                <sphereGeometry args={[0.09, 16, 12]} />
                {skin(SKIN_D)}
              </mesh>
            ))}
            {/* hair: cap + fringe + a few tufts */}
            <mesh position={[0, 0.08, -0.04]} scale={[1.05, 0.98, 1.02]}>
              <sphereGeometry args={[0.43, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
              <meshPhysicalMaterial color={HAIR} roughness={0.7} sheen={0.4} />
            </mesh>
            <RoundedBox args={[0.7, 0.16, 0.2]} radius={0.07} position={[0.04, 0.29, 0.29]} rotation={[0.5, 0, -0.12]}>
              <meshPhysicalMaterial color={HAIR} roughness={0.7} />
            </RoundedBox>
            {[[-0.18, 0.43, 0.05, 0.4], [0.06, 0.46, 0.02, -0.2], [0.24, 0.4, 0.06, -0.6]].map(([x, y, z, r], i) => (
              <mesh key={i} position={[x, y, z]} rotation={[0, 0, r]} scale={[0.09, 0.16, 0.09]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshPhysicalMaterial color={HAIR} roughness={0.7} />
              </mesh>
            ))}
            {/* eyes */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 0.15, 0.03, 0.36]}>
                <mesh scale={[0.085, 0.095 * eyeOpen, 0.05]}>
                  <sphereGeometry args={[1, 24, 16]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.2} />
                </mesh>
                <mesh position={[look[0] * 0.025, look[1] * 0.025 - 0.005, 0.042]} scale={[0.045, 0.05, 0.02]}>
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshStandardMaterial color="#3b2416" roughness={0.15} />
                </mesh>
                <mesh position={[look[0] * 0.025 - 0.014, look[1] * 0.025 + 0.014, 0.058]} scale={[0.014, 0.014, 0.008]}>
                  <sphereGeometry args={[1, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                {/* upper eyelid (tired / blink) */}
                {lid > 0.02 && (
                  <mesh position={[0, 0.095 * eyeOpen * (1 - lid), 0.012]} scale={[0.092, 0.1 * lid + 0.005, 0.058]}>
                    <sphereGeometry args={[1, 20, 12]} />
                    {skin()}
                  </mesh>
                )}
                {/* tired shadows */}
                {tired > 0.1 && (
                  <mesh position={[0, -0.1, 0.035]} scale={[0.07, 0.02, 0.01]}>
                    <sphereGeometry args={[1, 12, 8]} />
                    <meshBasicMaterial color="#9a6a55" transparent opacity={tired * 0.6} />
                  </mesh>
                )}
                {/* brow */}
                <RoundedBox args={[0.16, 0.035, 0.03]} radius={0.015} position={[0, browY - 0.85 + 0.06, 0.06]} rotation={[0, 0, -sd * browIn]}>
                  <meshStandardMaterial color={HAIR} />
                </RoundedBox>
              </group>
            ))}
            {/* nose */}
            <mesh position={[0, -0.07, 0.41]} scale={[0.055, 0.05, 0.05]}>
              <sphereGeometry args={[1, 16, 12]} />
              {skin(SKIN_D)}
            </mesh>
            {/* cheeks */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.24, -0.1, 0.33]} rotation={[0, sd * 0.5, 0]}>
                <circleGeometry args={[0.05, 20]} />
                <meshBasicMaterial color="#e98f7c" transparent opacity={0.35 + smile * 0.3} />
              </mesh>
            ))}
            {/* mouth */}
            <group position={[0, -0.2, 0.39]} rotation={[-0.2, 0, 0]}>
              {talk > 0.08 || surprise > 0.4 ? (
                <group>
                  {/* open mouth: dark cavity, teeth line, tongue */}
                  <mesh scale={[0.07 + smile * 0.02 - surprise * 0.012, 0.018 + Math.max(talk, surprise * 0.8) * 0.075, 0.02]}>
                    <sphereGeometry args={[1, 24, 14]} />
                    <meshBasicMaterial color="#3d1510" />
                  </mesh>
                  <mesh position={[0, 0.012 + Math.max(talk, surprise * 0.8) * 0.05, 0.012]} scale={[0.05, 0.012, 0.01]}>
                    <sphereGeometry args={[1, 12, 8]} />
                    <meshBasicMaterial color="#f6efe8" />
                  </mesh>
                  <mesh position={[0, -0.01 - Math.max(talk, surprise * 0.8) * 0.04, 0.01]} scale={[0.04, 0.02 + talk * 0.015, 0.01]}>
                    <sphereGeometry args={[1, 12, 8]} />
                    <meshBasicMaterial color="#d9685e" />
                  </mesh>
                </group>
              ) : Math.max(smile, sad) < 0.2 ? (
                <RoundedBox args={[0.13, 0.022, 0.02]} radius={0.01}>
                  <meshBasicMaterial color={INK} />
                </RoundedBox>
              ) : (
                <mesh geometry={frown} rotation={[0, 0, smile > sad ? Math.PI : 0]} position={[0, smile > sad ? 0.04 : -0.04, 0]} scale={[1, 0.55 + Math.max(smile, sad) * 0.45, 1]}>
                  <meshBasicMaterial color={INK} />
                </mesh>
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
