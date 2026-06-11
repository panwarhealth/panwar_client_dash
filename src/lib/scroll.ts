/**
 * After navigating, wait for a target section to mount (sections often appear
 * only once their data query resolves), then snap to the top and smooth-scroll
 * down to it - a visible top -> section sweep. Driven from the click rather than
 * the destination's effects so it fires on every navigation, not just the first
 * (cached data otherwise keeps the destination's effects from re-running).
 */
export function sweepToSectionAfterNav(id: string, timeoutMs = 2500): void {
  const start = performance.now();
  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: 0 });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          // Land the section ~18% down the viewport (the prime reading zone)
          // rather than jammed against the very top.
          const offset = Math.round(window.innerHeight * 0.18);
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }),
      );
    } else if (performance.now() - start < timeoutMs) {
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}
