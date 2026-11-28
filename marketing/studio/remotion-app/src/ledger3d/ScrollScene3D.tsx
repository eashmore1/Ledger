// "One more video" ad: 11:47 PM, he's scrolling instead of studying. A Ledger
// notification says Sarah has been studying for 2h 41m, Ledger calls him out
// from the book stack, he hits start and joins her room.
import { backOut, easeInOut, easeOut, lerp, noise, prog, V3 } from "./anim";
import { Timeline, wordAt } from "./data";
import { Mascot } from "./Mascot";
import { CameraRig, Glow, Phone } from "./Scene3D";
import { screenFeed, screenRoom, screenStart } from "./screens";
import { blinkAt, mouthFor, Room, Shot, shotAt } from "./StoryScene3D";
import { Student } from "./Student";

export const scrollBeats = (tl: Timeline) => {
  const L = tl.L;
  return {
    notif: L.ping.start - 0.45,
    ping: L.ping.start,
    who: L.who.start,
    see: L.see.start,
    start: L.start.start,
    press: wordAt(tl, "start", /^start/i),
    room: L.room.start,
    end: L.brand.start,
    cta: L.cta.start,
    D: tl.duration,
  };
};

const PHONE_POS: V3 = [0.3, -0.62, 0.76];
const PHONE_ROT: V3 = [-0.28, -0.12, 0];

export const ScrollScene3D: React.FC<{ t: number; tl: Timeline; aspect: number }> = ({ t, tl, aspect }) => {
  const B = scrollBeats(tl);
  const wide = aspect > 1;
  const inRoom = t < B.end;
  const PH: V3 = [PHONE_POS[0], PHONE_POS[1] + 0.02, PHONE_POS[2]];
  const FACE: V3 = [0, 0.55, -0.6];
  const shots: Shot[] = [
    // the feed, close, slow push; the notification lands
    { at: 0, p0: [0.33, -0.5, 1.95], p1: [0.32, -0.53, 1.66], l0: PH, l1: PH },
    // Ledger is standing on the book stack, arms out; he's still on his phone
    { at: B.ping + 0.85, p0: [-0.7, 0.28, 4.2], p1: [-0.58, 0.26, 3.95], l0: [0.4, -0.12, 0], l1: [0.42, -0.14, 0.02] },
    // his face: caught
    { at: B.who, p0: [0.3, 0.62, 3.0], p1: [0.27, 0.6, 2.8], l0: FACE, l1: FACE },
    // two-shot
    { at: B.see, p0: [0.55, 0.22, 3.9], p1: [0.5, 0.2, 3.65], l0: [0.38, -0.05, -0.05], l1: [0.4, -0.08, 0] },
    // insert: he hits start
    { at: B.start, p0: [0.33, -0.5, 1.9], p1: [0.32, -0.53, 1.72], l0: PH, l1: PH },
    // him, game face, the room on the phone in the foreground
    { at: B.room, p0: [0.18, 0.2, 3.3], p1: [0.14, 0.24, 3.0], l0: [0.08, 0.2, -0.4], l1: [0.06, 0.26, -0.45] },
    { at: B.end, p0: [0, 0.2, 9.0], p1: [0, 0.15, 8.4], l0: [0, -0.6, 0], l1: [0, -0.6, 0] },
  ];
  const cam = shotAt(shots, t);
  const camPos: V3 = [cam.pos[0], cam.pos[1], cam.pos[2] * (wide ? 1.25 : 1)];

  /* ---- student ---- */
  const surprise = t > B.who - 0.15 && t < B.see + 0.6 ? easeOut(prog(t, B.who - 0.15, 0.25)) * (1 - easeInOut(prog(t, B.see + 0.1, 0.5))) : 0;
  const grin = easeOut(prog(t, B.room - 0.1, 0.4));
  const onPhone = t < B.ping + 1.2 || (t >= B.start && t < B.room);
  const atLedger = t >= B.ping + 1.2 && t < B.start;
  const studentPose = {
    slump: (t < B.ping + 1.2 ? 0.35 : lerp(0.35, 0.05, easeOut(prog(t, B.ping + 1.2, 0.5)))) + noise(t * 0.3, 3) * 0.04,
    tired: t < B.who ? 0.45 : 0,
    sad: t >= B.see && t < B.start ? 0.25 : 0,
    surprise,
    smile: Math.max(grin, t < B.ping ? 0.12 : 0),
    talk: mouthFor(tl, "S", t),
    cheer: 0,
    blink: blinkAt(t, 17),
    look: (onPhone ? [0.45, -0.85] : atLedger ? [0.9, -0.35] : [noise(t * 0.5, 5) * 0.2, -0.1]) as [number, number],
    headTurn: (atLedger ? 0.3 * easeOut(prog(t, B.ping + 1.2, 0.35)) : 0) + noise(t * 0.35, 7) * 0.05,
  };
  const breath = 1 + Math.sin(t * 2.3) * 0.008;

  /* ---- Ledger ---- */
  const appear = B.ping - 0.3;
  const ledgerOn = t >= appear && inRoom;
  const STACK_TOP = -0.8 + 0.07 + 2 * 0.14 + 0.065;
  const jump = prog(t, appear, 0.45);
  const lY = STACK_TOP + Math.sin(Math.PI * Math.min(1, jump)) * 0.45;
  const land = t - (appear + 0.45);
  const ledgerPose = {
    wave: t > B.see && t < B.start ? easeOut(prog(t, B.see, 0.3)) : 0,
    waveT: t,
    cheer: t > B.room && t < B.end ? easeOut(prog(t, B.room + 0.2, 0.4)) * (0.85 + Math.sin(t * 7) * 0.15) : 0,
    mouth: mouthFor(tl, "L", t),
    happy: t > B.room ? 1 : 0,
    blink: blinkAt(t, 23),
    look: (t >= B.start && t < B.room ? [-0.6, -0.6] : [-0.8, 0.3]) as [number, number],
    squash: land > 0 && land < 0.6 ? Math.sin(land * 18) * Math.exp(-land * 7) * 0.16 : 0,
  };

  /* ---- phone ---- */
  let screen: { draw: (c: CanvasRenderingContext2D, w: number, h: number) => void; key: string };
  if (t < B.start - 0.05) {
    const scroll = easeInOut(prog(t, 1.05, 0.32));
    const notif = easeOut(prog(t, B.notif, 0.35));
    screen = { draw: (c, w, h) => screenFeed(c, w, h, { scroll, notif, likes: 0 }), key: `f${scroll.toFixed(2)}-${notif.toFixed(2)}` };
  } else if (t < B.room - 0.05) {
    const press = prog(t, B.press, 0.45), running = t > B.press + 0.15;
    const el = running ? (t - B.press - 0.15) * 1 : 0;
    screen = { draw: (c, w, h) => screenStart(c, w, h, { press, elapsed: el, running }), key: `s${Math.floor(el * 10)}-${press.toFixed(2)}` };
  } else {
    const joined = 1 + Math.max(0, (t - B.room + 0.1) / 0.3), left = 50 * 60 - (t - B.room), pulse = (Math.sin(t * 6) + 1) / 2;
    screen = { draw: (c, w, h) => screenRoom(c, w, h, { joined, left, pulse }), key: `r${joined.toFixed(1)}-${Math.floor(left)}-${pulse.toFixed(1)}` };
  }
  const phoneGlow = t < B.ping + 1.2 ? 1 : 0.6;

  return (
    <>
      <CameraRig pos={camPos} look={cam.look} fov={wide ? 26 : cam.fov} />
      {inRoom && <fog attach="fog" args={["#0d0c16", 6, 16]} />}
      <hemisphereLight args={[inRoom ? "#5a68a8" : "#ffffff", "#1a120c", inRoom ? 0.32 : 0.7]} />
      <directionalLight position={[-3, 2.5, -1]} intensity={inRoom ? 0.7 : 2.0} color={inRoom ? "#8ea2ff" : "#ffbf80"} />
      <directionalLight position={[3, 2, 4]} intensity={inRoom ? 0.3 : 1.4} color="#fff1e0" />
      {inRoom && (
        <>
          <Room t={t} day={0} flash={0} bookGlow={Math.max(0, 0.5 - Math.abs(t - appear) * 1.6)} bookShake={0} rain={false} />
          {/* phone light on his face */}
          <pointLight position={[0.12, 0.25, -0.28]} intensity={1.2 * phoneGlow * (1 + noise(t * 4, 2) * 0.08)} distance={1.6} color="#cfd8ff" />
          <group position={[0, -0.15, -0.6]} scale={[1, breath, 1]}>
            <Student {...studentPose} />
          </group>
          {ledgerOn && <Mascot {...ledgerPose} position={[0.85, lY, 0.45]} rotation={[0, -0.45 + noise(t * 0.4, 13) * 0.08, 0]} scale={0.42} />}
          <mesh position={[PHONE_POS[0], -0.78, PHONE_POS[2] - 0.05]} rotation={[-0.5, -0.12, 0]}>
            <boxGeometry args={[0.12, 0.05, 0.14]} />
            <meshStandardMaterial color="#2d2a33" roughness={0.5} />
          </mesh>
          <Phone draw={screen.draw} drawKey={screen.key} position={PHONE_POS} rotation={PHONE_ROT} scale={0.11} />
        </>
      )}
      {!inRoom && (
        <>
          <Mascot wave={t > B.cta - 0.2 ? easeOut(prog(t, B.cta - 0.2, 0.3)) : 0} waveT={t} cheer={t < B.cta - 0.2 ? easeOut(prog(t, B.end + 0.3, 0.3)) * (0.85 + Math.sin(t * 7) * 0.15) : 0}
            mouth={mouthFor(tl, "L", t)} happy={t < B.cta - 0.2 ? 1 : 0} blink={blinkAt(t, 29)}
            position={[0, lerp(-5, -2.05, backOut(prog(t, B.end, 0.7), 1.2)), 0.6]} rotation={[0, noise(t * 0.6, 4) * 0.12, 0]} scale={0.92}
            squash={(() => { const l = t - (B.end + 0.45); return l > 0 && l < 0.6 ? Math.sin(l * 18) * Math.exp(-l * 7) * 0.16 : 0; })()} />
          <Glow color="rgba(255,240,210,0.9)" size={6} opacity={0.25} position={[0, -0.4, -1]} />
        </>
      )}
    </>
  );
};
