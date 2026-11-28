// Timeline data for the "one more video" ad (built by ads/ledger-scroll/build.py).
import A from "../../public/ledger-scroll/ledger-scroll-A.words.json";
import MA from "../../public/ledger-scroll/mouth-A.json";
import { buildTimeline, Raw, Timeline } from "./data";

export const scrollTimeline = (): Timeline => ({ ...buildTimeline(A as Raw, "A"), mouth: MA as Timeline["mouth"] });
