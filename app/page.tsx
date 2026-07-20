import type { Metadata } from "next";
import BackgroundRemover from "./background-remover";

export const metadata: Metadata = {
  title: "Free Image Background Remover – Remove Background Online",
  description:
    "Remove image backgrounds online in seconds. No sign-up, no watermark, and no image storage. Download a transparent PNG for free.",
  alternates: { canonical: "/" },
};

const faqs = [
  ["Is this background remover free?", "Yes. You can remove a background and download the result without creating an account or adding a watermark."],
  ["Are my images stored?", "No. Your image is sent securely to our processing partner and returned to your browser. We do not save the original or result."],
  ["Which image formats are supported?", "You can upload JPG, JPEG, PNG, or WebP images up to 12 MB."],
  ["Can I add a white background?", "Yes. Choose transparent, white, black, or any custom color after the background has been removed."],
];

export default function Home() {
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Backgroundly home">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>Backgroundly</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#use-cases">Use cases</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> One click. Clean cutout.</div>
        <h1>Remove the background.<br /><em>Keep what matters.</em></h1>
        <p className="hero-copy">A free image background remover for crisp, ready-to-use cutouts. No sign-up, no watermark, and no image storage.</p>
      </section>

      <BackgroundRemover />

      <section className="proof-strip" aria-label="Product benefits">
        <div><strong>Free</strong><span>No account needed</span></div>
        <div><strong>Private</strong><span>We never store images</span></div>
        <div><strong>Clean</strong><span>No watermark</span></div>
        <div><strong>Flexible</strong><span>Transparent or color</span></div>
      </section>

      <section className="section steps" id="how-it-works">
        <div className="section-heading">
          <span className="section-kicker">How it works</span>
          <h2>From busy to clean<br />in three simple steps.</h2>
        </div>
        <div className="step-grid">
          <article><span>01</span><h3>Upload</h3><p>Drop, paste, or select a JPG, PNG, or WebP image from your device.</p></article>
          <article><span>02</span><h3>Remove</h3><p>We detect the main subject and remove the background automatically.</p></article>
          <article><span>03</span><h3>Download</h3><p>Keep it transparent or add a color, then download your finished PNG.</p></article>
        </div>
      </section>

      <section className="section use-cases" id="use-cases">
        <div className="section-heading light">
          <span className="section-kicker">Made for real work</span>
          <h2>One tool.<br />Plenty of possibilities.</h2>
          <p>Clean up the images you use every day—without learning complex editing software.</p>
        </div>
        <div className="case-grid">
          <article><div className="case-art product" aria-hidden="true"><span /></div><h3>Product photos</h3><p>Make marketplace-ready product shots with transparent or white backgrounds.</p></article>
          <article><div className="case-art portrait" aria-hidden="true"><span /></div><h3>Portraits</h3><p>Create polished profile pictures, headshots, and social content in seconds.</p></article>
          <article><div className="case-art logo" aria-hidden="true"><span>Ab</span></div><h3>Logos & graphics</h3><p>Remove unwanted white space and export clean assets with transparency.</p></article>
        </div>
      </section>

      <section className="section faq" id="faq">
        <div className="section-heading"><span className="section-kicker">Good to know</span><h2>Frequently asked<br />questions.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
        </div>
      </section>

      <footer>
        <div><a className="brand footer-brand" href="#top"><span className="brand-mark">B</span><span>Backgroundly</span></a><p>Make every image easier to use.</p></div>
        <div className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@backgroundly.app">Contact</a></div>
        <small>© {new Date().getFullYear()} Backgroundly</small>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
    </main>
  );
}
