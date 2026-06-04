const container = document.getElementById("toastContainer");
const QUEUE_DELAY = 600;
let queue = [];
let showing = false;

function createToast(opts) {
  const el = document.createElement("div");
  el.className = "toast";

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = opts.icon || (opts.type === "error" ? "😕" : opts.type === "processing" ? "✨" : "✓");
  el.appendChild(icon);

  const body = document.createElement("div");
  body.className = "toast-body";

  const title = document.createElement("div");
  title.className = "toast-title";
  title.textContent = opts.title || "";
  body.appendChild(title);

  const msg = document.createElement("div");
  msg.className = "toast-message";
  msg.textContent = opts.message || "";
  body.appendChild(msg);

  el.appendChild(body);
  return el;
}

function showNext() {
  if (showing || queue.length === 0) return;
  showing = true;

  const entry = queue.shift();
  const el = createToast(entry);

  // Remove previous toasts
  while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(el);

  // Trigger animation: small delay for DOM to settle
  requestAnimationFrame(() => {
    el.classList.add("visible");
  });

  const duration = entry.duration || 2500;
  setTimeout(() => {
    el.classList.remove("visible");
    el.classList.add("hiding");
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      showing = false;
      setTimeout(showNext, 100);
    }, 250);
  }, duration);
}

function show(opts) {
  queue.push(opts);
  if (!showing) showNext();
}

// ── Listen for IPC ──
window.refinezy.toast.onShow((opts) => show(opts));