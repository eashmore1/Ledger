import { Composition } from "remotion";
import { adDuration, LedgerAd, LedgerAdProps } from "./ledger3d/LedgerAd";

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
  </>
);
