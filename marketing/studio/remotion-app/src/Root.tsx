import { Composition } from "remotion";
import { adDuration, LedgerAd, LedgerAdProps } from "./ledger3d/LedgerAd";
import { StoryAd, StoryAdProps, storyDuration } from "./ledger3d/StoryAd";
import { HusAd, HusAdProps, husDuration } from "./ledger3d/HusAd";
import { HussAd, HussAdProps, hussDuration } from "./ledger3d/HussAd";

const FPS = 30;
const meta = ({ props }: { props: LedgerAdProps }) => ({ durationInFrames: adDuration(props.variant, FPS) });

export const RemotionRoot: React.FC = () => (
  <>
    {/* Studio presets: vertical for TikTok / Reels / Shorts, widescreen for YouTube / Meta feed */}
    <Composition id="ViralVertical3D" component={LedgerAd} fps={FPS} width={1080} height={1920} durationInFrames={840}
      defaultProps={{ variant: "A", withAudio: true } as LedgerAdProps} calculateMetadata={meta} />
    <Composition id="WidescreenAd3D" component={LedgerAd} fps={FPS} width={1920} height={1080} durationInFrames={840}
      defaultProps={{ variant: "A", withAudio: true } as LedgerAdProps} calculateMetadata={meta} />
    {/* Hook A/B/C test cuts of the Ledger ad */}
    {(["A", "B", "C"] as const).map((v) => (
      <Composition key={v} id={`Ledger3D-${v}`} component={LedgerAd} fps={FPS} width={1080} height={1920} durationInFrames={840}
        defaultProps={{ variant: v, withAudio: true } as LedgerAdProps} calculateMetadata={meta} />
    ))}
    {/* Story cut: failed exam on a rainy night -> Ledger -> pass */}
    {(["A", "B", "C"] as const).map((v) => (
      <Composition key={`s${v}`} id={`LedgerStory3D-${v}`} component={StoryAd} fps={FPS} width={1080} height={1920} durationInFrames={840}
        defaultProps={{ variant: v, withAudio: true } as StoryAdProps}
        calculateMetadata={({ props }: { props: StoryAdProps }) => ({ durationInFrames: storyDuration(props.variant, FPS) })} />
    ))}
    {/* Meme cut: "huss huss huss / while they're out partying" */}
    {(["A", "B", "C"] as const).map((v) => (
      <Composition key={`hs${v}`} id={`LedgerHuss-${v}`} component={HussAd} fps={FPS} width={1080} height={1920} durationInFrames={510}
        defaultProps={{ variant: v, withAudio: true } as HussAdProps}
        calculateMetadata={({ props }: { props: HussAdProps }) => ({ durationInFrames: hussDuration(props.variant, FPS) })} />
    ))}
    {/* Bonus cut: Ledger sprints the desk to save the streak */}
    {(["A", "B", "C"] as const).map((v) => (
      <Composition key={`h${v}`} id={`LedgerHus-${v}`} component={HusAd} fps={FPS} width={1080} height={1920} durationInFrames={540}
        defaultProps={{ variant: v, withAudio: true } as HusAdProps}
        calculateMetadata={({ props }: { props: HusAdProps }) => ({ durationInFrames: husDuration(props.variant, FPS) })} />
    ))}
  </>
);
