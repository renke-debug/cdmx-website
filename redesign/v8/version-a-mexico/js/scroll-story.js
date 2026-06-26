// redesign/v8/version-a-mexico/js/scroll-story.js
// Smooth scroll + scrub the point-field reveal across hero -> connect.
import { prefersReducedMotion } from './lib.js';

if (!prefersReducedMotion() && window.gsap && window.ScrollTrigger && window.Lenis) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);

  // drive the lamp reveal as the reader descends from hero to the connect block
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    endTrigger: '#connect',
    end: 'bottom center',
    scrub: true,
    onUpdate: (self) => {
      // map scroll progress to a fuller reveal range
      const p = 0.06 + self.progress * 0.94;
      window.__cdmxField?.setProgress(p);
    },
  });

  // the city blazes through the "city act", then settles to a calm backdrop
  // for the human act (growing people -> footer), so lower content stays readable
  gsap.to('#bg-canvas', {
    opacity: 0.3,
    ease: 'none',
    scrollTrigger: { trigger: '#grow', start: 'top 88%', end: 'top 38%', scrub: true },
  });

  // light reveal of content blocks as they enter
  gsap.utils.toArray('.block').forEach((el) => {
    gsap.from(el.querySelectorAll('.reveal'), {
      y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 75%' },
    });
  });
}
