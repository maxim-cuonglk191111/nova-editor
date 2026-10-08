// Styles for the public landing page (app/page.tsx), kept out of the component.
export const LANDING_CSS = `
        /* ── Base ── */
        .origin-home {
          min-height: 100vh;
          background: #0f1011;
          color: #fff;
          font-family: var(--font-suisse-intl);
          overflow-x: hidden;
        }

        /* ── Typography ── */
        .origin-display-heading {
          font-family: var(--font-lyon-display);
          font-weight: 300;
          font-size: clamp(48px, 8vw, 96px);
          line-height: 0.92;
          color: #fafafa;
          margin: 0 0 24px;
          letter-spacing: -0.025em;
        }
        .origin-display-heading em {
          font-style: normal;
          font-weight: 300;
        }

        .origin-large-heading {
          font-family: var(--font-lyon-display);
          font-weight: 300;
          font-size: clamp(36px, 6vw, 64px);
          line-height: 0.95;
          color: #fafafa;
          margin: 0;
        }

        .origin-text-italics {
          font-family: var(--font-lyon-display);
          font-style: normal;
          font-weight: 300;
        }

        .origin-text-span { display: inline; }

        .origin-font-weight-normal { font-weight: 400; }

        .origin-body-white {
          color: #fafafa;
          font-family: var(--font-suisse-intl);
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
          margin: 0;
        }

        .origin-p60 {
          color: rgba(255,255,255,0.6);
          font-family: var(--font-suisse-intl);
          font-weight: 300;
          font-size: 16px;
          line-height: 1.5;
          margin: 0;
        }

        .origin-smalltext {
          font-family: var(--font-roboto-mono);
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #fafafa;
          margin: 0;
        }

        /* ── Layout ── */
        .origin-container {
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }

        .origin-hero__wrapper {
          text-align: center;
          max-width: 980px;
          margin: 0 auto;
        }

        .origin-hero__sub-wrapper {
          max-width: 420px;
          /* the 0.95 line-height heading's descenders overlap without a top gap */
          margin: 20px auto 24px;
        }

        .origin-site-wrapper {
          padding: 0 32px;
        }

        .origin-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .origin-hero {
          position: relative;
          background: transparent;
        }

        .origin-hero__site-wrapper {
          z-index: 10;
          background-image: linear-gradient(rgba(15,16,17,0), #0f1011);
          width: 100%;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 180px 100px 50px;
          position: relative;
          overflow: hidden;
        }

        .origin-hero__video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
          pointer-events: none;
        }

        .origin-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(15,16,17,0.3), rgba(15,16,17,0.8));
          z-index: 1;
          pointer-events: none;
        }

        /* ── Promo badge ── */
        .origin-promo {
          display: inline-flex;
          align-items: center;
          padding: 8px 20px;
          border-radius: 88px;
          background-image: linear-gradient(rgba(49,44,0,1), rgba(49,44,0,0.24));
          backdrop-filter: blur(296px);
          -webkit-backdrop-filter: blur(296px);
          box-shadow: inset -0.96px -0.96px 7px rgba(255,255,255,0.15);
          margin-bottom: 48px;
        }

        /* ── Buttons ── */
        .origin-button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 12px 18px;
          border-radius: 8px;
          font-family: var(--font-roboto-mono);
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s;
        }

        .origin-button--nav {
          background: #fff;
          color: #000;
        }
        .origin-button--nav:hover {
          background: rgba(255,255,255,0.86);
        }

        .origin-button--dark {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .origin-button--dark:hover {
          background: rgba(255,255,255,0.18);
        }

        /* ── Search bar (typing) ── */
        .origin-search-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px 14px 20px;
          max-width: 520px;
          width: 100%;
          margin: 24px auto 0;
          cursor: text;
          transition: border-color 0.3s;
        }
        .origin-search-bar:hover {
          border-color: rgba(255,255,255,0.2);
        }

        .origin-typed-words {
          color: #fff;
          font-family: var(--font-suisse-intl);
          font-size: 16px;
          font-weight: 300;
          line-height: 1;
          text-align: left;
        }
        .origin-typed-words::after {
          content: "|";
          display: inline;
          animation: origin-blink 1s infinite;
        }

        .origin-search-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        /* ── Trust badges ── */
        .origin-hero__trust {
          margin-top: 32px;
        }

        /* ── Intro sections ── */
        .origin-intro {
          padding: 100px 32px;
        }

        /* ── Track cards ── */
        .origin-track-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 60px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .origin-track-card {
          background-image: linear-gradient(135deg, #2b2b2c, #131313);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .origin-track-card__image-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 40px 0;
        }

        .origin-image-blur-bg {
          position: relative;
        }

        .origin-track-card__img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          display: block;
        }

        .origin-track-card__text {
          padding: 32px 40px;
          position: relative;
          z-index: 2;
        }
        .origin-track-card__text p:first-child {
          margin-bottom: 8px;
        }

        .origin-track-card__gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(19,19,19,0.9), transparent 60%);
          pointer-events: none;
          z-index: 1;
        }

        /* ── AI Section ── */
        .origin-ai-section {
          position: relative;
        }

        .origin-aigradient {
          background-image: linear-gradient(#0f1011, rgba(19,29,39,0.8) 30%, rgba(15,16,17,1));
        }

        .origin-star {
          margin-bottom: 32px;
          animation: origin-pulse 3s ease-in-out infinite;
        }

        .origin-ai-prompt-wrapper {
          max-width: 640px;
          margin: 48px auto 0;
        }

        .origin-ai-prompt {
          background: #000;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .origin-ai-prompt__textarea {
          width: 100%;
          background: transparent;
          border: none;
          padding: 20px 22px 12px;
          font-size: 16px;
          color: #fafafa;
          resize: none;
          outline: none;
          line-height: 1.6;
          font-family: var(--font-suisse-intl);
          font-weight: 300;
          box-sizing: border-box;
        }
        .origin-ai-prompt__textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .origin-ai-prompt__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px 16px 22px;
          gap: 12px;
        }

        .origin-ai-prompt__hint {
          font-size: 11px;
          color: var(--color-fog);
          font-family: var(--font-roboto-mono);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .origin-ai-prompt__submit {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 40px;
          padding: 0 18px;
          border-radius: 8px;
          border: none;
          background: #fff;
          color: #000;
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font-roboto-mono);
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }
        .origin-ai-prompt__submit:hover {
          background: rgba(255,255,255,0.86);
        }
        .origin-ai-prompt__submit:disabled {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4);
          cursor: not-allowed;
        }

        /* ── Examples ── */
        .origin-examples {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }
        .origin-examples__label {
          font-size: 13px;
          color: var(--color-fog);
          font-family: var(--font-suisse-intl);
          display: flex;
          align-items: center;
        }
        .origin-examples__chip {
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: #fafafa;
          font-size: 13px;
          font-family: var(--font-suisse-intl);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .origin-examples__chip:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.2);
        }

        /* ── Updates / Feature cards ── */
        .origin-updates {
          z-index: 4;
          padding: 100px 32px;
          position: relative;
        }

        .origin-3col-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 72px;
        }

        .origin-update-card {
          background-image: linear-gradient(135deg, #2b2b2c, #131313);
          border-radius: 30px;
          padding: 96px 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
          transition: transform 0.3s;
        }
        .origin-update-card:hover {
          transform: translateY(-4px);
        }

        .origin-product-update-title {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .origin-update-card__title {
          font-family: var(--font-lyon-display);
          font-weight: 300;
          font-size: 24px;
          line-height: 1.1;
          color: #fafafa;
          margin: 0;
        }

        /* ── Sphere / Connect section ── */
        .origin-sphere-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 600px;
          padding: 100px 32px;
          position: relative;
          overflow: hidden;
        }

        .origin-sphere-bg {
          position: absolute;
          inset: 0;
          background-image: url("https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9/68af10558a04078593d8f7ce_Group%2048100214.avif");
          background-position: center;
          background-repeat: no-repeat;
          background-size: contain;
          opacity: 0.7;
          pointer-events: none;
        }

        .origin-sphere-center {
          z-index: 1;
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
          position: relative;
        }

        /* ── Testimonials ── */
        .origin-testimonials {
          z-index: 4;
          padding: 100px 32px;
          position: relative;
          overflow: hidden;
        }

        .origin-testimonial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .origin-quote-card {
          text-align: center;
          border-radius: 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          min-height: 440px;
          padding: 32px;
          background-color: #cacaca;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }
        .origin-quote-card--1 {
          background-image: url("https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9/68acd528c25e85a31ee91cea_aea62ac5e3b1a484ce8af496bc9356fd_Frame%201171277260.avif");
        }
        .origin-quote-card--2 {
          background-image: url("https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9/68acd528eff05fd8f147b257_Frame%201171277261.avif");
        }
        .origin-quote-card--3 {
          background-image: url("https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9/68acd5283e22423f13fa59a3_Frame%201171277263.avif");
        }

        .origin-quote-card__stars {
          width: 90px;
          margin-bottom: 20px;
        }

        .origin-quote-card__text {
          font-family: var(--font-suisse-intl);
          font-size: 18px;
          font-weight: 300;
          line-height: 1.5;
          color: #1a1a1a;
          flex: 1;
          display: flex;
          align-items: center;
          margin: 0 0 20px;
        }

        .origin-quote-card__author {
          font-family: var(--font-roboto-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #555;
        }

        /* ── Forecast / CTA section ── */
        .origin-forecast-section {
          padding: 100px 32px;
        }

        .origin-site-wrapper-forecast {
          background-image: linear-gradient(#0f1011, #131d27 18%, #1a4788 37%, #408ac1 69%);
          border-radius: 16px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 124px 5%;
          overflow: hidden;
        }

        .origin-hero-label {
          display: inline-flex;
          backdrop-filter: blur(296px);
          -webkit-backdrop-filter: blur(296px);
          background-image: linear-gradient(rgba(49,44,0,1), rgba(49,44,0,0.24));
          border-radius: 88px;
          max-width: max-content;
          margin: 0 auto 48px;
          padding: 10px 18px;
          box-shadow: inset -0.96px -0.96px 7px rgba(255,255,255,0.15);
        }

        .origin-hero-label-text {
          font-family: var(--font-suisse-intl);
          font-weight: 300;
          font-size: 14px;
          color: #fafafa;
        }

        /* ── Animations ── */
        @keyframes origin-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes origin-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes origin-spin {
          to { transform: rotate(360deg); }
        }

        .origin-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          display: inline-block;
          animation: origin-spin 0.7s linear infinite;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }

        /* ── Responsive ── */
        @media screen and (max-width: 991px) {
          .origin-hero__site-wrapper {
            padding: 160px 32px 60px;
          }
          .origin-track-grid {
            grid-template-columns: 1fr;
          }
          .origin-3col-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media screen and (max-width: 767px) {
          .origin-hero__site-wrapper {
            padding: 140px 20px 40px;
          }
          .origin-intro {
            padding: 60px 20px;
          }
          .origin-updates {
            padding: 60px 20px;
          }
          .origin-testimonials {
            padding: 60px 20px;
          }
          .origin-forecast-section {
            padding: 60px 16px;
          }
          .origin-3col-grid {
            grid-template-columns: 1fr;
          }
          .origin-track-card {
            min-height: 400px;
          }
          .origin-sphere-section {
            min-height: 400px;
            padding: 60px 20px;
          }
          .origin-site-wrapper-forecast {
            padding: 80px 20px;
            border-radius: 12px;
          }
        }

        @media screen and (max-width: 479px) {
          .origin-display-heading {
            font-size: 40px;
          }
          .origin-large-heading {
            font-size: 32px;
          }
          .origin-quote-card {
            min-height: 320px;
          }
        }
`;
