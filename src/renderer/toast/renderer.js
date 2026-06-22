const container = document.getElementById("toastContainer");
let activeToast = null;
let activeToastOpts = null;

function createToast(opts) {
  const el = document.createElement("div");
  el.className = "toast " + (opts.type || "success");

  const msg = document.createElement("div");
  msg.className = "toast-message";
  msg.textContent = opts.message || "";
  el.appendChild(msg);

  return el;
}

function dismissToast(el, callback) {
  el.classList.remove("visible");
  el.classList.add("hiding");
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    if (callback) callback();
  }, 250);
}

function show(opts) {
  // If there's an active toast, dismiss it first (or update it immediately if we wanted to be fancy)
  // For simplicity and matching the requested transition feel, we'll replace it.
  if (activeToast) {
    const oldToast = activeToast;
    activeToast = null;
    dismissToast(oldToast, () => {
      renderNewToast(opts);
    });
  } else {
    renderNewToast(opts);
  }
}

function renderNewToast(opts) {
  const el = createToast(opts);
  while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(el);

  activeToast = el;
  activeToastOpts = opts;

  requestAnimationFrame(() => {
    el.classList.add("visible");
  });

  // If not persistent, auto-dismiss
  if (!opts.persistent) {
    const duration = opts.duration || 2500;
    setTimeout(() => {
      if (activeToast === el) {
        dismissToast(el, () => {
          activeToast = null;
        });
      }
    }, duration);
  }
}

// ── Listen for IPC ──
window.refinzi.toast.onShow((opts) => show(opts));
