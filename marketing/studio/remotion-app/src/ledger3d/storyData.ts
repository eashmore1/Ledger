// Timeline data for the Ledger story ad (rainy night -> Ledger shows up -> pass).
import A from "../../public/ledger-3d-story/ledger-3d-story-A.words.json";
import B from "../../public/ledger-3d-story/ledger-3d-story-B.words.json";
import C from "../../public/ledger-3d-story/ledger-3d-story-C.words.json";
import MA from "../../public/ledger-3d-story/mouth-A.json";
import MB from "../../public/ledger-3d-story/mouth-B.json";
import MC from "../../public/ledger-3d-story/mouth-C.json";
import { buildTimeline, Raw, Timeline, Variant } from "./data";

const RAW: Record<Variant, Raw> = { A: A as Raw, B: B as Raw, C: C as Raw };
const MOUTH = { A: MA, B: MB, C: MC } as Record<Variant, Timeline["mouth"]>;
export const storyTimeline = (v: Variant): Timeline => ({ ...buildTimeline(RAW[v], v), mouth: MOUTH[v] });
