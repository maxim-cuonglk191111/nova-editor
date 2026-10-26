"use client";
// The hero picture, built as a pinned-up collage instead of a clean app screenshot: a
// tilted editor window, a taped photo, a multiplayer-style cursor, a sticker and a chat
// bubble holding the sample prompt. Decorative, so the whole thing is aria-hidden.
import { useI18n } from "@/lib/i18n";
import { Burst, Cursor, Tape } from "./doodles";
import { IconSpark } from "./icons";

export function HeroMockup({ prompt }: { prompt: string }) {
  const L = useI18n().t.landing;
  return (
    <div className="lp-collage" aria-hidden="true">
      <div className="lp-win">
        <div className="lp-win__bar"><i /><i /><i /><span /></div>
        <div className="lp-win__body">
          <div className="lp-win__nav"><b /><span /><span /><span /><em /></div>
          <div className="lp-win__hero">
            <div className="lp-win__copy">
              <span className="lp-win__h" />
              <span className="lp-win__h lp-win__h--short" />
              <span className="lp-win__p" />
              <span className="lp-win__p lp-win__p--short" />
              <span className="lp-win__btn" />
            </div>
            <div className="lp-win__sel">
              <img src="/images/landing/feature-generate.jpg" alt="" width={320} height={213} loading="lazy" />
              <u /><u /><u /><u />
            </div>
          </div>
          <div className="lp-win__row"><span /><span /><span /></div>
        </div>
      </div>

      <figure className="lp-polaroid lp-polaroid--hero">
        <Tape className="lp-tape" />
        <img src="/images/landing/hero-team.jpg" alt="" width={240} height={160} loading="lazy" />
      </figure>

      <div className="lp-cursor">
        <Cursor width={26} height={30} />
        <span>{L.cursorName}</span>
      </div>

      <div className="lp-sticker lp-sticker--lime">
        <Burst className="lp-sticker__bg" />
        <span>{L.stickerFree}</span>
      </div>

      <div className="lp-ask">
        <IconSpark width={18} height={18} />
        <span>{prompt}</span>
      </div>
    </div>
  );
}
