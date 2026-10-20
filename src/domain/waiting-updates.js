// Waiting-screen updates only. The owner keeps the v2 cadence: 5s at first,
// then 30s, with automatic checks stopping at ten minutes. A manual check or
// returning from another app still performs one check without resetting that budget.
export function watchWaiting({ check, onState = () => {}, now = Date.now, doc = document, startedAt }) {
  const started = startedAt ?? now();
  let timer = null;
  let disposed = false;
  let running = false;
  let paused = false;
  const elapsed = () => now() - started;
  const report = (extra = {}) => onState({ paused, checking: running, ...extra });
  const schedule = () => {
    clearTimeout(timer);
    if (disposed) return;
    const age = elapsed();
    if (age >= 10 * 60 * 1000) { paused = true; report(); return; }
    // Five-second checks for the first minute, then every thirty seconds.
    // The final timer cannot extend past the ten-minute cutoff.
    timer = setTimeout(async () => {
      if (elapsed() >= 10 * 60 * 1000) { paused = true; report(); return; }
      if (doc.visibilityState !== 'hidden') await run();
      schedule();
    }, Math.min(age < 60 * 1000 ? 5000 : 30000, 10 * 60 * 1000 - age));
  };
  const run = async () => {
    if (disposed || running) return;
    running = true; report();
    try { await check(); }
    catch { if (!disposed) report({ error: 'unreachable' }); }
    finally { running = false; if (!disposed) report(); }
  };
  const visible = () => { if (doc.visibilityState !== 'hidden') run(); };
  doc.addEventListener('visibilitychange', visible);
  run(); schedule();
  return {
    checkNow: run,
    dispose() { disposed = true; clearTimeout(timer); doc.removeEventListener('visibilitychange', visible); }
  };
}
