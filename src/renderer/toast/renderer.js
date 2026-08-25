const container = document.getElementById("toastContainer");
let activeToast = null;
let activeToastOpts = null;
let autoDismissTimer = null;
let remainingTime = 0;
let dismissStartTime = 0;

function createToast(opts) {
  const el = document.createElement("div");
  el.className = "toast " + (opts.type || "success");

  const msgContainer = document.createElement("div");
  msgContainer.className = "toast-message-container";
  msgContainer.style.display = "flex";
  msgContainer.style.flexDirection = "column";
  msgContainer.style.alignItems = "center";
  msgContainer.style.justifyContent = "center";

  if (opts.title) {
    const title = document.createElement("div");
    title.className = "toast-title";
    title.style.fontSize = "11.5px";
    title.style.fontWeight = "700";
    title.style.color = "#ffffff";
    title.textContent = opts.title;
    msgContainer.appendChild(title);
  }

  const msg = document.createElement("div");
  msg.className = "toast-message";
  msg.textContent = opts.message || "";
  if (opts.title) {
    msg.style.fontSize = "9.5px";
    msg.style.opacity = "0.75";
    msg.style.fontWeight = "500";
    msg.style.marginTop = "2px";
  }
  msgContainer.appendChild(msg);
  el.appendChild(msgContainer);

  // Allow clicking on toasts to dismiss or open settings
  el.addEventListener("click", () => {
    if (opts.type === "processing" && window.refinzi?.app?.openSettings) {
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
