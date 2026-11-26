// 2D canvas drawings used as textures on 3D objects (phone screen, cards, coins).
// Styled after the real Ledger app: cream background, navy ink, orange accents,
// Fraunces for display numbers, Libre Franklin for UI text.
type Ctx = CanvasRenderingContext2D;

export const COL = {
  cream: "#f2ede6",
  card: "#fffdf9",
  navy: "#18103a",
  orange: "#d44000",
  orangeL: "#ff7a3d",
  body: "#e2551c",
  muted: "#6f6780",
  line: "#e6ddd0",
  green: "#16a34a",
  greenL: "#34d399",
  purple: "#5a5fcf",
  gold: "#f5b73a",
};
export const SERIF = "Fraunces";
export const SANS = "Libre Franklin";

export type Person = { n: string; c: string };
export const PEOPLE: Person[] = [
  { n: "Sarah", c: "#5a5fcf" },
  { n: "Jordan", c: "#0f9d8a" },
  { n: "Priya", c: "#e0457b" },
  { n: "Marcus", c: "#e89b12" },
  { n: "Maya", c: "#3b82f6" },
  { n: "Alex", c: "#8b5cf6" },
];

const font = (w: number, px: number, fam = SANS, italic = false) => `${italic ? "italic " : ""}${w} ${px}px "${fam}"`;

export const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

const text = (ctx: Ctx, s: string, x: number, y: number, f: string, color: string, align: CanvasTextAlign = "left") => {
  ctx.font = f;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
};

export const avatar = (ctx: Ctx, x: number, y: number, r: number, p: Person, ring = "#fff", live = false) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r + r * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.fill();
  const g = ctx.createLinearGradient(x, y - r, x, y + r);
  g.addColorStop(0, shade(p.c, 0.18));
  g.addColorStop(1, shade(p.c, -0.12));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  text(ctx, p.n[0], x, y + r * 0.36, font(800, r * 1.02), "#fff", "center");
  if (live) {
    ctx.beginPath();
    ctx.arc(x + r * 0.72, y + r * 0.72, r * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.72, y + r * 0.72, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = COL.green;
    ctx.fill();
  }
  ctx.restore();
};

export const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

const fmt = (s: number) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
};

/** Screen chrome: rounded screen, status bar, dynamic island. */
const chrome = (ctx: Ctx, W: number, H: number, bg = COL.cream) => {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  rr(ctx, 0, 0, W, H, 92);
  ctx.clip();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const dark = bg !== COL.cream;
  text(ctx, "9:41", 70, 72, font(700, 30), dark ? "#fff" : COL.navy);
  // battery + signal
  ctx.fillStyle = dark ? "#fff" : COL.navy;
  rr(ctx, W - 118, 50, 50, 24, 7);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    rr(ctx, W - 196 + i * 13, 70 - (i + 1) * 5.5, 9, (i + 1) * 5.5, 2);
    ctx.fill();
  }
  ctx.fillStyle = "#050505";
  rr(ctx, W / 2 - 110, 28, 220, 64, 32);
  ctx.fill();
};
const endChrome = (ctx: Ctx, W: number, H: number) => {
  ctx.fillStyle = "rgba(24,16,58,.85)";
  rr(ctx, W / 2 - 130, H - 34, 260, 10, 5);
  ctx.fill();
  ctx.restore();
};

const appHeader = (ctx: Ctx, W: number, title: string, sub?: string) => {
  text(ctx, title, 56, 192, font(600, 54, SERIF), COL.navy);
  if (sub) text(ctx, sub, 58, 240, font(600, 28), COL.muted);
  // mini Ledger book icon
  ctx.fillStyle = COL.body;
  rr(ctx, W - 108, 146, 52, 62, 12);
  ctx.fill();
  ctx.fillStyle = "#b23a08";
  rr(ctx, W - 108, 146, 12, 62, 6);
  ctx.fill();
};

const card = (ctx: Ctx, x: number, y: number, w: number, h: number, r = 34) => {
  ctx.save();
  ctx.shadowColor = "rgba(24,16,58,.10)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = COL.card;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COL.line;
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, r);
  ctx.stroke();
};

const chip = (ctx: Ctx, x: number, y: number, label: string, on: boolean) => {
  ctx.font = font(700, 28);
  const w = ctx.measureText(label).width + 52;
  ctx.fillStyle = on ? COL.navy : "#fff";
  rr(ctx, x, y, w, 60, 30);
  ctx.fill();
  if (!on) {
    ctx.strokeStyle = COL.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  text(ctx, label, x + w / 2, y + 40, font(700, 28), on ? "#fff" : COL.navy, "center");
  return w;
};

const ring = (ctx: Ctx, cx: number, cy: number, r: number, k: number, color: string, track = COL.line, w = 22) => {
  ctx.lineCap = "round";
  ctx.lineWidth = w;
  ctx.strokeStyle = track;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (k > 0.001) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, k));
    ctx.stroke();
  }
};

/* ---------------- phone screens ---------------- */

/** Hook: a study room with nobody in it. */
export const screenAlone = (ctx: Ctx, W: number, H: number, t: number) => {
  chrome(ctx, W, H);
  appHeader(ctx, W, "Study room", "FAR · Just you");
  card(ctx, 50, 290, W - 100, 640);
  ring(ctx, W / 2, 560, 190, 0.08 + t * 0.01, "#b9b2c4", "#efe9e1", 24);
  text(ctx, "00:12", W / 2, 590, font(600, 96, SERIF), "#9a93a6", "center");
  text(ctx, "1 studying", W / 2, 640, font(700, 28), "#a9a2b4", "center");
  text(ctx, "Waiting for friends…", W / 2, 860, font(600, 30), "#a9a2b4", "center");
  // empty seats
  const seats = 5;
  for (let i = 0; i < seats; i++) {
    const x = 120 + i * ((W - 240) / (seats - 1)), y = 1060;
    if (i === 0) avatar(ctx, x, y, 54, { n: "You", c: "#9a93a6" });
    else {
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "#cfc6bb";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  text(ctx, "You", 120, 1150, font(700, 24), "#9a93a6", "center");
  card(ctx, 50, 1220, W - 100, 160);
  text(ctx, "0 friends studying now", 90, 1290, font(700, 32), "#9a93a6");
  text(ctx, "It's quiet in here.", 90, 1336, font(500, 28), "#b4adbf");
  endChrome(ctx, W, H);
};

/** Session timer: Start Session button, then a running clock. */
export const screenStart = (ctx: Ctx, W: number, H: number, s: { press: number; elapsed: number; running: boolean }) => {
  chrome(ctx, W, H);
  appHeader(ctx, W, s.running ? "Studying" : "New session", s.running ? "FAR · Becker" : "Choose your focus");
  let x = 56;
  ["FAR", "AUD", "REG", "BAR"].forEach((l, i) => (x += chip(ctx, x, 280, l, i === 0) + 16));
  card(ctx, 50, 380, W - 100, 690);
  const k = (s.elapsed % 3600) / 3600;
  ring(ctx, W / 2, 680, 220, s.running ? Math.max(0.02, k) : 0, COL.orange, "#f1e7dc", 26);
  text(ctx, fmt(s.elapsed), W / 2, 708, font(600, 92, SERIF), COL.navy, "center");
  if (s.running) {
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(W / 2 - 70, 772, 11, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, "LIVE", W / 2 - 48, 783, font(800, 30), "#ef4444");
    text(ctx, "· friends can see you", W / 2 + 32, 783, font(600, 26), COL.muted);
  } else text(ctx, "Ready when you are", W / 2, 783, font(600, 28), COL.muted, "center");
  // goal bar
  text(ctx, "Today's goal", 96, 990, font(700, 26), COL.muted);
  const gk = Math.min(1, s.elapsed / 7200);
  text(ctx, `${(gk * 2).toFixed(1)}h / 2h`, W - 96, 990, font(800, 26), COL.navy, "right");
  ctx.fillStyle = "#f1e7dc";
  rr(ctx, 96, 1012, W - 192, 22, 11);
  ctx.fill();
  ctx.fillStyle = COL.orange;
  rr(ctx, 96, 1012, Math.max(22, (W - 192) * gk), 22, 11);
  ctx.fill();
  // button
  const pressed = s.press > 0 && s.press < 1 ? Math.sin(Math.PI * s.press) : 0;
  const by = 1150 + pressed * 8, bw = W - 100 - pressed * 24;
  ctx.save();
  ctx.shadowColor = "rgba(212,64,0,.35)";
  ctx.shadowBlur = 30 - pressed * 20;
  ctx.shadowOffsetY = 12 - pressed * 8;
  ctx.fillStyle = s.running ? COL.navy : COL.orange;
  rr(ctx, W / 2 - bw / 2, by, bw, 128, 64);
  ctx.fill();
  ctx.restore();
  text(ctx, s.running ? "End & log session" : "Start Session", W / 2, by + 80, font(800, 40), "#fff", "center");
  if (s.press > 0 && s.press < 1) {
    ctx.strokeStyle = `rgba(255,122,61,${1 - s.press})`;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(W / 2, by + 64, 60 + s.press * 360, 0, Math.PI * 2);
    ctx.stroke();
  }
  endChrome(ctx, W, H);
};

/** Log + post: summary card, then the feed card with props counting up. */
export const screenPost = (ctx: Ctx, W: number, H: number, s: { press: number; posted: number; props: number; comment: number }) => {
  chrome(ctx, W, H);
  appHeader(ctx, W, "Feed", "Your study crew");
  const y0 = 290 + (1 - s.posted) * 60;
  ctx.globalAlpha = 0.25 + 0.75 * s.posted;
  card(ctx, 50, y0, W - 100, 640);
  avatar(ctx, 130, y0 + 90, 46, { n: "You", c: COL.body });
  text(ctx, "You studied FAR", 196, y0 + 82, font(800, 32), COL.navy);
  text(ctx, "Becker · Leases · just now", 196, y0 + 122, font(500, 26), COL.muted);
  text(ctx, "2h 14m", 90, y0 + 270, font(600, 120, SERIF), COL.navy);
  text(ctx, "Leases finally clicked.", 90, y0 + 340, font(500, 32), COL.navy);
  // mini bar chart of the week
  for (let i = 0; i < 7; i++) {
    const h = [60, 90, 40, 110, 80, 120, 150][i];
    ctx.fillStyle = i === 6 ? COL.orange : "#f1d9c8";
    rr(ctx, 90 + i * 74, y0 + 520 - h, 50, h, 10);
    ctx.fill();
  }
  ctx.strokeStyle = COL.line;
  ctx.beginPath();
  ctx.moveTo(90, y0 + 556);
  ctx.lineTo(W - 90, y0 + 556);
  ctx.stroke();
  // props button
  const pp = Math.round(s.props);
  ctx.fillStyle = pp > 0 ? "#fff1ea" : "#f6f1ea";
  rr(ctx, 90, y0 + 572, 200, 50, 25);
  ctx.fill();
  heart(ctx, 128, y0 + 598, 16, pp > 0 ? COL.orange : "#b9b2c4");
  text(ctx, `${pp} props`, 156, y0 + 608, font(800, 26), pp > 0 ? COL.orange : COL.muted);
  text(ctx, "Comment", W - 90, y0 + 608, font(700, 26), COL.muted, "right");
  ctx.globalAlpha = 1;
  // comment bubble
  if (s.comment > 0) {
    ctx.globalAlpha = s.comment;
    const cy = 960 + (1 - s.comment) * 30;
    card(ctx, 50, cy, W - 100, 150, 30);
    avatar(ctx, 120, cy + 75, 38, PEOPLE[4]);
    text(ctx, "Maya", 178, cy + 64, font(800, 28), COL.navy);
    text(ctx, "Let's gooo! Same time tomorrow?", 178, cy + 104, font(500, 27), COL.navy);
    ctx.globalAlpha = 1;
  }
  // log button (slides away after posting)
  if (s.posted < 1) {
    const pressed = s.press > 0 && s.press < 1 ? Math.sin(Math.PI * s.press) : 0;
    ctx.globalAlpha = 1 - s.posted;
    ctx.fillStyle = COL.orange;
    rr(ctx, 50 + pressed * 12, 1210 + s.posted * 120, W - 100 - pressed * 24, 128, 64);
    ctx.fill();
    text(ctx, "✓ Log Session", W / 2, 1290 + s.posted * 120, font(800, 40), "#fff", "center");
    ctx.globalAlpha = 1;
  }
  endChrome(ctx, W, H);
};

export const heart = (ctx: Ctx, x: number, y: number, r: number, color: string) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.3, x, y - r * 0.45);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  ctx.fill();
};

/** Live study room: shared focus clock and member tiles filling up. */
export const screenRoom = (ctx: Ctx, W: number, H: number, s: { joined: number; left: number; pulse: number }) => {
  chrome(ctx, W, H, "#16102e");
  text(ctx, "FAR grind room", 56, 192, font(600, 52, SERIF), "#fff");
  const n = Math.min(6, Math.floor(s.joined));
  ctx.fillStyle = COL.green;
  ctx.beginPath();
  ctx.arc(70, 230, 9 + s.pulse * 3, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, `${n + 1} studying now`, 92, 240, font(700, 28), COL.greenL);
  // shared clock
  ctx.fillStyle = "rgba(255,255,255,.06)";
  rr(ctx, 50, 290, W - 100, 400, 40);
  ctx.fill();
  text(ctx, "FOCUS", W / 2, 370, font(800, 28), COL.orangeL, "center");
  const m = Math.floor(s.left / 60), sec = Math.floor(s.left % 60);
  text(ctx, `${m}:${String(sec).padStart(2, "0")}`, W / 2, 530, font(600, 160, SERIF), "#fff", "center");
  text(ctx, "50 min focus · 10 min break", W / 2, 620, font(600, 26), "rgba(255,255,255,.55)", "center");
  // tiles
  const all = [{ n: "You", c: COL.body }, ...PEOPLE];
  for (let i = 0; i < 6; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 50 + col * ((W - 116) / 2 + 16), y = 730 + row * 230, w = (W - 116) / 2, h = 210;
    const p = all[i];
    const on = i === 0 || i <= n;
    const k = i === 0 ? 1 : Math.max(0, Math.min(1, s.joined - i + 1));
    ctx.fillStyle = on ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.03)";
    rr(ctx, x, y, w, h, 32);
    ctx.fill();
    if (on) {
      ctx.save();
      ctx.globalAlpha = k;
      avatar(ctx, x + 72, y + 80, 44, p, "#16102e", true);
      text(ctx, p.n, x + 132, y + 74, font(800, 30), "#fff");
      text(ctx, ["FAR", "FAR", "FAR", "FAR", "FAR", "FAR"][i], x + 132, y + 110, font(600, 24), "rgba(255,255,255,.55)");
      text(ctx, `${[48, 31, 52, 17, 40, 26][i]}m in`, x + 34, y + 176, font(700, 26), COL.greenL);
      ctx.restore();
    } else {
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + 72, y + 80, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  endChrome(ctx, W, H);
};

/* ---------------- floating cards ---------------- */

export const liveCard = (ctx: Ctx, W: number, H: number, p: Person, title: string, sub: string, pulse: number) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COL.card;
  rr(ctx, 0, 0, W, H, H * 0.24);
  ctx.fill();
  avatar(ctx, H * 0.5, H * 0.5, H * 0.3, p, "#fff", true);
  text(ctx, title, H * 0.95, H * 0.46, font(800, H * 0.17), COL.navy);
  text(ctx, sub, H * 0.95, H * 0.72, font(600, H * 0.13), COL.muted);
  // live pill
  const px = W - H * 0.62, py = H * 0.5;
  ctx.fillStyle = "rgba(22,163,74,.12)";
  rr(ctx, px - H * 0.36, py - H * 0.15, H * 0.72, H * 0.3, H * 0.15);
  ctx.fill();
  ctx.fillStyle = COL.green;
  ctx.beginPath();
  ctx.arc(px - H * 0.2, py, H * (0.045 + pulse * 0.02), 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "LIVE", px + H * 0.06, py + H * 0.05, font(800, H * 0.13), COL.green, "center");
};

export const streakCard = (ctx: Ctx, W: number, H: number, n: number) => {
  ctx.clearRect(0, 0, W, H);
  text(ctx, String(n), W / 2, H * 0.66, font(700, H * 0.62, SERIF), "#fff", "center");
  text(ctx, "DAY STREAK", W / 2, H * 0.92, font(800, H * 0.13), "#ffd7bf", "center");
};

const BADGES: Record<string, { name: string; sub: string; c1: string; c2: string; glyph: (ctx: Ctx, x: number, y: number, r: number) => void }> = {
  week: {
    name: "Week Warrior", sub: "7-day streak", c1: "#ff8a4c", c2: "#c33b00",
    glyph: (ctx, x, y, r) => {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr2 = i % 2 ? r * 0.42 : r;
        ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
      }
      ctx.fill();
    },
  },
  month: {
    name: "Month Machine", sub: "30-day streak", c1: "#7c81ff", c2: "#3a3fa8",
    glyph: (ctx, x, y, r) => text(ctx, "30", x, y + r * 0.42, font(700, r * 1.25, SERIF), "#fff", "center"),
  },
  century: {
    name: "Century Club", sub: "100 hours", c1: "#ffd36b", c2: "#c98a00",
    glyph: (ctx, x, y, r) => text(ctx, "100", x, y + r * 0.36, font(700, r * 0.98, SERIF), "#fff", "center"),
  },
};

export const badgeFace = (ctx: Ctx, S: number, kind: keyof typeof BADGES | string) => {
  const b = BADGES[kind];
  ctx.clearRect(0, 0, S, S);
  const g = ctx.createRadialGradient(S * 0.4, S * 0.35, S * 0.05, S / 2, S / 2, S / 2);
  g.addColorStop(0, b.c1);
  g.addColorStop(1, b.c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = S * 0.025;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.43, 0, Math.PI * 2);
  ctx.stroke();
  b.glyph(ctx, S / 2, S * 0.43, S * 0.2);
  text(ctx, b.name.toUpperCase(), S / 2, S * 0.75, font(800, S * 0.068), "#fff", "center");
};

export const avatarCoin = (ctx: Ctx, S: number, p: Person) => {
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, S, S);
  avatar(ctx, S / 2, S / 2, S * 0.42, p, "#fff");
};

export const clockFace = (ctx: Ctx, W: number, H: number, left: number) => {
  ctx.clearRect(0, 0, W, H);
  const m = Math.floor(left / 60), s = Math.floor(left % 60);
  text(ctx, "FOCUS", W / 2, H * 0.24, font(800, H * 0.085), COL.orangeL, "center");
  text(ctx, `${m}:${String(s).padStart(2, "0")}`, W / 2, H * 0.66, font(600, H * 0.4, SERIF), "#fff", "center");
  text(ctx, "everyone · same clock", W / 2, H * 0.86, font(700, H * 0.07), "rgba(255,255,255,.7)", "center");
};

export const goalFace = (ctx: Ctx, W: number, H: number, hours: number) => {
  ctx.clearRect(0, 0, W, H);
  text(ctx, `${hours.toFixed(1)}h`, W / 2, H * 0.58, font(600, H * 0.36, SERIF), "#fff", "center");
  text(ctx, "OF 15H WEEKLY GOAL", W / 2, H * 0.8, font(800, H * 0.075), hours >= 15 ? COL.greenL : "#ffd7bf", "center");
};

export const passCard = (ctx: Ctx, W: number, H: number, stamp: number) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COL.card;
  rr(ctx, 0, 0, W, H, 48);
  ctx.fill();
  text(ctx, "CPA EXAM · FAR", 64, 110, font(800, 40), COL.muted);
  text(ctx, "Score", 64, 200, font(600, 44), COL.navy);
  text(ctx, "84", 64, 400, font(700, 230, SERIF), COL.navy);
  text(ctx, "75 to pass", 64, 470, font(600, 36), COL.muted);
  if (stamp > 0) {
    ctx.save();
    ctx.translate(W * 0.68, H * 0.6);
    ctx.rotate(-0.22);
    const s = 1 + (1 - Math.min(1, stamp)) * 1.6;
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, stamp * 1.5);
    ctx.strokeStyle = COL.green;
    ctx.lineWidth = 12;
    rr(ctx, -190, -78, 380, 156, 26);
    ctx.stroke();
    text(ctx, "PASSED", 0, 30, font(900, 92), COL.green, "center");
    ctx.restore();
  }
};

/* ---------------- story ad ---------------- */

/** Score report: 72 "did not pass" (hook) or 84 "passed" (payoff). */
export const scoreCard = (ctx: Ctx, W: number, H: number, pass: boolean, stamp: number) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COL.card;
  rr(ctx, 0, 0, W, H, 44);
  ctx.fill();
  const accent = pass ? COL.green : "#dc2626";
  ctx.fillStyle = accent;
  rr(ctx, 0, 0, W, 16, 8);
  ctx.fill();
  text(ctx, "CPA EXAM · FAR", 56, 96, font(800, 36), COL.muted);
  text(ctx, "Score", 56, 170, font(600, 40), COL.navy);
  text(ctx, pass ? "84" : "72", 50, 345, font(700, 170, SERIF), pass ? COL.navy : "#7a1d1d");
  text(ctx, "75 to pass", 60, 430, font(600, 34), COL.muted);
  if (stamp > 0) {
    ctx.save();
    ctx.translate(W * 0.69, H * 0.7);
    ctx.rotate(-0.2);
    const s = (1 + (1 - Math.min(1, stamp)) * 1.6) * (pass ? 0.66 : 0.6);
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, stamp * 1.5);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 11;
    const label = pass ? "PASSED" : "NOT PASSED";
    ctx.font = font(900, pass ? 84 : 62);
    const w = ctx.measureText(label).width + 70;
    rr(ctx, -w / 2, -70, w, 140, 24);
    ctx.stroke();
    text(ctx, label, 0, pass ? 30 : 22, font(900, pass ? 84 : 62), accent, "center");
    ctx.restore();
  }
};

/** Window sky: stormy night -> sunrise, k in 0..1. */
export const skyFace = (ctx: Ctx, W: number, H: number, k: number, flash: number) => {
  const mixc = (a: number[], b: number[]) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * k)).join(",")})`;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mixc([18, 24, 48], [120, 170, 235]));
  g.addColorStop(0.6, mixc([34, 40, 70], [255, 196, 140]));
  g.addColorStop(1, mixc([44, 46, 72], [255, 150, 90]));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (k > 0.02) {
    const sun = ctx.createRadialGradient(W * 0.62, H * 0.78, 0, W * 0.62, H * 0.78, W * 0.7);
    sun.addColorStop(0, `rgba(255,236,180,${k})`);
    sun.addColorStop(0.25, `rgba(255,190,120,${0.6 * k})`);
    sun.addColorStop(1, "rgba(255,160,90,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
  }
  // city silhouette
  ctx.fillStyle = mixc([12, 14, 26], [92, 70, 90]);
  for (let i = 0; i < 9; i++) {
    const bw = W / 9, bh = H * (0.12 + ((i * 37) % 23) / 100);
    ctx.fillRect(i * bw, H - bh, bw - 4, bh);
    if (k < 0.6) {
      ctx.fillStyle = `rgba(255,214,140,${0.5 * (1 - k)})`;
      for (let j = 0; j < 4; j++) if ((i * 7 + j * 3) % 5 < 2) ctx.fillRect(i * bw + 8 + (j % 2) * 18, H - bh + 14 + Math.floor(j / 2) * 22, 8, 10);
      ctx.fillStyle = mixc([12, 14, 26], [92, 70, 90]);
    }
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(220,230,255,${flash})`;
    ctx.fillRect(0, 0, W, H);
  }
};

/** Book spine label. */
export const spineFace = (ctx: Ctx, W: number, H: number, label: string, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.fillRect(0, H * 0.12, W, H * 0.08);
  ctx.fillRect(0, H * 0.8, W, H * 0.08);
  text(ctx, label, W / 2, H * 0.66, font(900, H * 0.42), "#fff", "center");
};
