// Single source of truth for motion gating.
// Other modules import `motionState` and check before firing expensive animations.

const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
const lowMemory = (navigator.deviceMemory && navigator.deviceMemory < 2);

export const motionState = {
  reduced: mq.matches,
  lowMemory,
  allowOrganism: !mq.matches && !lowMemory,
  allowSubstrate: !mq.matches,
  allowSigil: !mq.matches,
  allowConstellationAnim: !mq.matches,
};

mq.addEventListener('change', (e) => {
  motionState.reduced = e.matches;
  motionState.allowOrganism = !e.matches && !lowMemory;
  motionState.allowSubstrate = !e.matches;
  motionState.allowSigil = !e.matches;
  motionState.allowConstellationAnim = !e.matches;
  window.dispatchEvent(new CustomEvent('motionstate', { detail: motionState }));
});
