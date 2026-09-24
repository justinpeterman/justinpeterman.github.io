import { config, type Rect } from './scene';
import { createWorkbenchRenderer } from './workbench';

export function mountBanner(host: HTMLElement) {
  const canvas = host.querySelector('canvas');
  const container = host.parentElement;
  const heading = container?.querySelector('h1');
  if (!canvas || !container || !heading) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const styles = getComputedStyle(container);
  const palette = {
    accentColor: styles.getPropertyValue('--ink').trim(),
    backgroundColor: styles.getPropertyValue('--teal').trim(),
    panelBackgroundColor: styles.getPropertyValue('--teal-subtle').trim(),
  };
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverMedia = matchMedia('(hover: hover) and (pointer: fine)');
  let reducedMotion = media.matches;
  let artwork = createWorkbenchRenderer();
  let measured = false;
  let elapsed = 0;
  let animationElapsed = 0;
  let lastUpdate = 0;
  let previous: number | undefined;
  let frame = 0;
  let visible = false;
  let workbenchHovered = false;
  let disposed = false;
  let paintedKey: number | undefined;
  function paint(force = false) {
    const ambientTime = reducedMotion ? 0 : elapsed;
    const key = artwork.frameKey(ambientTime);
    if (!force && key === paintedKey) return;
    artwork.draw(ctx!, palette, ambientTime);
    paintedKey = key;
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = undefined;
  }
  function tick(now: number) {
    frame = 0;
    if (previous !== undefined) {
      const delta = Math.min(now - previous, 100);
      elapsed = Math.min(config.introDurationMs, elapsed + delta);
      const hoverMultiplier = workbenchHovered ? config.workbench.hoverSpeedMultiplier : 1;
      animationElapsed += delta * config.motionSpeed * hoverMultiplier;
    }
    previous = now;
    if (animationElapsed - lastUpdate >= config.logIntervalMs) {
      artwork.advance();
      lastUpdate = animationElapsed;
    }
    paint();
    if (elapsed < config.introDurationMs) frame = requestAnimationFrame(tick);
    else sync();
  }
  function sync() {
    stop();
    const hasMotion = artwork.hasMotion();
    if (hasMotion && measured && visible && !document.hidden && !reducedMotion && !ctx!.isContextLost() && elapsed < config.introDurationMs) frame = requestAnimationFrame(tick);
  }
  function measure() {
    if (disposed || ctx!.isContextLost()) return;
    const bounds = container!.getBoundingClientRect();
    if (!bounds.width || !bounds.height) { stop(); return; }
    const dpr = Math.min(devicePixelRatio || 1, config.maxDpr);
    canvas!.width = Math.round(bounds.width * dpr);
    canvas!.height = Math.round(bounds.height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const padding = bounds.width < config.smallScreenWidth ? config.safePadding / 2 : config.safePadding;
    const safe: Rect[] = [];
    const walker = document.createTreeWalker(heading!, NodeFilter.SHOW_TEXT);
    // Range measures each live line, rather than the full-width h1 block.
    while (walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      for (const rect of range.getClientRects()) safe.push({
        x: Math.floor(rect.x - bounds.x - padding), y: Math.floor(rect.y - bounds.y - padding),
        width: Math.ceil(rect.width + padding * 2), height: Math.ceil(rect.height + padding * 2),
      });
    }
    artwork.measure(bounds.width, bounds.height, safe);
    measured = true;
    paint(true);
    host!.setAttribute('data-ready', '');
    sync();
  }
  function motionChanged(event: MediaQueryListEvent) {
    reducedMotion = event.matches;
    if (reducedMotion) workbenchHovered = false;
    if (reducedMotion) {
      // A deliberate seeded still, with no cursor pulse or pending updates.
      artwork = createWorkbenchRenderer();
      elapsed = 0;
      animationElapsed = 0;
      lastUpdate = 0;
      if (measured) measure();
    }
    sync();
  }
  function hoverCapabilityChanged() {
    if (!hoverMedia.matches) workbenchHovered = false;
  }
  function pointerMoved(event: PointerEvent) {
    if (!hoverMedia.matches || event.pointerType !== 'mouse' || reducedMotion) {
      workbenchHovered = false;
      return;
    }
    const bounds = container!.getBoundingClientRect();
    workbenchHovered = artwork.hitTest(event.clientX - bounds.left, event.clientY - bounds.top);
  }
  function pointerLeft() { workbenchHovered = false; }
  function lost() { host.removeAttribute('data-ready'); sync(); }
  const resize = new ResizeObserver(measure);
  const intersection = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    sync();
  });
  resize.observe(container);
  intersection.observe(container);
  media.addEventListener('change', motionChanged);
  hoverMedia.addEventListener('change', hoverCapabilityChanged);
  container.addEventListener('pointermove', pointerMoved, { passive: true });
  container.addEventListener('pointerleave', pointerLeft);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', measure);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  canvas.addEventListener('contextlost', lost);
  canvas.addEventListener('contextrestored', measure);
  void document.fonts.ready.then(measure);
  measure();
  return () => {
    disposed = true;
    stop();
    resize.disconnect();
    intersection.disconnect();
    media.removeEventListener('change', motionChanged);
    hoverMedia.removeEventListener('change', hoverCapabilityChanged);
    container.removeEventListener('pointermove', pointerMoved);
    container.removeEventListener('pointerleave', pointerLeft);
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('resize', measure);
    window.removeEventListener('pagehide', stop);
    window.removeEventListener('pageshow', sync);
    canvas.removeEventListener('contextlost', lost);
    canvas.removeEventListener('contextrestored', measure);
    host.removeAttribute('data-ready');
  };
}
