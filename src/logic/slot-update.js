// The update may replace the viewport. Restore position on the new view,
// never on the detached container that opened the alternatives dialog.
export function updateSlotAndRestore(container, sessionId, slot, update, root = document) {
  const scrollTop = container.querySelector('.milo-s7-container')?.scrollTop || 0;
  update();
  const replacement = root.getElementById(`viewport-${sessionId}`);
  const itinerary = replacement?.querySelector('.milo-s7-container');
  if (!itinerary) return;
  itinerary.scrollTop = scrollTop;
  replacement.querySelector(`[data-customise-slot="${slot}"]`)?.focus({ preventScroll: true });
}
