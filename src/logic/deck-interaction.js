// One lifecycle per mounted card. Every reaction path shares the same lock.
export function createDeckInteraction({ isCurrent, record, onLock, target, isTyping,
  schedule = setTimeout, cancel = clearTimeout }) {
  let alive = true;
  let locked = false;
  let timer = null;
  const active = () => alive && isCurrent();

  function commit(reaction, animate, delay) {
    if (locked || !active()) return false;
    locked = true;
    onLock();
    animate();
    timer = schedule(() => {
      timer = null;
      if (active()) record(reaction);
    }, delay);
    return true;
  }

  function onKeyDown(event) {
    const reaction = { ArrowLeft: 'not_tonight', ArrowDown: 'maybe', ArrowRight: 'into_it' }[event.key];
    if (!reaction || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey
      || isTyping(event.target) || !active()) return;
    event.preventDefault();
    keyboardReaction(reaction);
  }
  let keyboardReaction = () => {};
  function bindKeyboard(handler) {
    keyboardReaction = handler;
    target.removeEventListener('keydown', onKeyDown);
    target.addEventListener('keydown', onKeyDown);
  }

  function dispose() {
    if (!alive) return;
    alive = false;
    if (timer !== null) cancel(timer);
    timer = null;
    target.removeEventListener('keydown', onKeyDown);
  }
  return { commit, bindKeyboard, dispose, canInteract: () => active() && !locked };
}
