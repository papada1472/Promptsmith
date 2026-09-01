const container = document.getElementById("toastContainer");
let activeToast = null;
let activeToastOpts = null;
let autoDismissTimer = null;
let remainingTime = 0;
let dismissStartTime = 0;

function createToast(opts) {
  const type = opts.type || "success";
  const el = document.createElement("div");
  el.className = "toast " + type;

  // Icon wrap
  const iconWrap = document.createElement("div");
  iconWrap.className = "toast-icon-wrap";
  let iconEmoji = "✨";
  if (type === "error") iconEmoji = "❌";
  else if (type === "warning" || type === "processing") iconEmoji = "⚡";
  if (opts.message?.toLowerCase().includes("key")) iconEmoji = "🔑";
  iconWrap.textContent = iconEmoji;
  el.appendChild(iconWrap);

  const content = document.createElement("div");
  content.className = "toast-content";

  const titleRow = document.createElement("div");
  titleRow.className = "toast-title-row";

  const title = document.createElement("div");
  title.className = "toast-title";
  title.textContent = opts.title || (type === "error" ? "Refinement Issue" : type === "warning" ? "Notice" : "Success");
  titleRow.appendChild(title);
  content.appendChild(titleRow);

  const msg = document.createElement("div");
  msg.className = "toast-message";
  msg.textContent = opts.message || "";
  content.appendChild(msg);

  // If error or key issue, add clickable hint
  if (type === "error" || type === "warning" || opts.message?.toLowerCase().includes("key")) {
    const hint = document.createElement("div");
    hint.className = "toast-hint";
    hint.innerHTML = "Click to open Settings &rarr;";
    content.appendChild(hint);
  }

  el.appendChild(content);

  // Allow clicking on toasts to open settings if actionable, or dismiss
  el.addEventListener("click", () => {
    if ((type === "error" || type === "warning" || opts.message?.toLowerCase().includes("key")) && window.refinzi?.app?.openSettings) {
      window.refinzi.app.openSettings().catch(() => {});
    }
    dismissToast(el, () => {
      if (activeToast === el) activeToast = null;
    });
  });

  // Hover pauses auto-dismissal
  el.addEventListener("mouseenter", () => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
      const elapsed = Date.now() - dismissStartTime;
      remainingTime = Math.max(800, remainingTime - elapsed);
    }
  });

  el.addEventListener("mouseleave", () => {
    if (!opts.persistent && remainingTime > 0) {
      dismissStartTime = Date.now();
      autoDismissTimer = setTimeout(() => {
        if (activeToast === el) {
          dismissToast(el, () => {
            activeToast = null;
          });
        }
      }, remainingTime);
    }
  });

  return el;
}

function dismissToast(el, callback) {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer);
    autoDismissTimer = null;
  }
  el.classList.remove("visible");
  el.classList.add("hiding");
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    if (callback) callback();
  }, 250);
}

function show(opts) {
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
    remainingTime = opts.duration || 2500;
    dismissStartTime = Date.now();
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    autoDismissTimer = setTimeout(() => {
      if (activeToast === el) {
        dismissToast(el, () => {
          activeToast = null;
        });
      }
    }, remainingTime);
  }
}

// ── Listen for IPC ──
if (window.refinzi?.toast?.onShow) {
  window.refinzi.toast.onShow((opts) => show(opts));
}
