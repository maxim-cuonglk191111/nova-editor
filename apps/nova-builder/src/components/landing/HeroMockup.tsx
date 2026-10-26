"use client";
// Decorative picture of the editor for the hero: a site on the canvas with one element
// selected, a tool rail and an inspector. Built from boxes, not a screenshot, so it
// stays sharp at any size and carries no invented UI text. The whole thing is aria-hidden.
import { IconCursor, IconDevices, IconLayers, IconPages, IconSpark } from "./icons";

export function HeroMockup({ prompt }: { prompt: string }) {
  return (
    <div className="lp-mock" aria-hidden="true">
      <div className="lp-mock__window">
        <div className="lp-mock__bar">
          <i /><i /><i />
          <span className="lp-mock__url" />
        </div>
        <div className="lp-mock__body">
          <div className="lp-mock__rail">
            <IconCursor width={18} height={18} />
            <IconLayers width={18} height={18} />
            <IconPages width={18} height={18} />
            <IconDevices width={18} height={18} />
          </div>
          <div className="lp-mock__canvas">
            <div className="lp-mock__site">
              <div className="lp-mock__nav"><b /><span /><span /><span /><em /></div>
              <div className="lp-mock__hero">
                <div className="lp-mock__copy">
                  <div className="lp-mock__sel"><u /><u /><u /><u /><strong /><strong /></div>
                  <span className="lp-mock__line lp-mock__line--w" />
                  <span className="lp-mock__line" />
                  <span className="lp-mock__cta" />
                </div>
                <img src="/images/landing/feature-generate.jpg" alt="" width={320} height={213} loading="lazy" />
              </div>
              <div className="lp-mock__cards"><span /><span /><span /></div>
            </div>
          </div>
          <div className="lp-mock__panel">
            <span className="lp-mock__k" /><span className="lp-mock__row" />
            <span className="lp-mock__k" />
            <div className="lp-mock__sw"><i style={{ background: "#24262a" }} /><i style={{ background: "#6a39bb" }} /><i style={{ background: "#a980e6" }} /><i style={{ background: "#dac7fa" }} /></div>
            <span className="lp-mock__k" /><span className="lp-mock__row lp-mock__row--s" />
          </div>
        </div>
      </div>
      <div className="lp-mock__ask">
        <IconSpark width={18} height={18} />
        <span>{prompt}</span>
      </div>
    </div>
  );
}
