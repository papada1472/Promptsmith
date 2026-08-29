import React, { useEffect, useRef } from "react";

/**
 * OrbCursor — High performance golden "orb" cursor.
 * Optimized with idle-detection rAF to use 0% CPU when mouse is not moving.
 */
function OrbCursor() {
  const orbRef = useRef(null);
  const trailRef = useRef(null);
  const enabledRef = useRef(false);
  const hoverRef = useRef(false);
  const visibleRef = useRef(false);
  const targetRef = useRef({ x: -100, y: -100 });
  const posRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const mediaFine = window.matchMedia("(pointer: fine)");
    const mediaMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const isAllowed = () => mediaFine.matches && !mediaMotion.matches;

    const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, summary, [role='button'], [data-orb-hover]";

    const setHover = (on) => {
      if (hoverRef.current === on) return;
      hoverRef.current = on;
      if (orbRef.current) orbRef.current.classList.toggle("is-hover", on);
      if (trailRef.current) trailRef.current.classList.toggle("is-hover", on);
    };

    const startAnimation = () => {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      const ease = 0.18;
      const px = posRef.current.x;
      const py = posRef.current.y;
      const tx = targetRef.current.x;
      const ty = targetRef.current.y;

      const dx = tx - px;
      const dy = ty - py;

      // Settle and stop running rAF when mouse is stationary (saves CPU & battery)
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        posRef.current = { x: tx, y: ty };
        if (orbRef.current) orbRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        if (trailRef.current) trailRef.current.style.transform = `translate3d(${tx - 12}px, ${ty - 12}px, 0)`;
        isRunningRef.current = false;
        return;
      }

      const nx = px + dx * ease;
      const ny = py + dy * ease;

      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${nx - 12}px, ${ny - 12}px, 0)`;
      }

      posRef.current = { x: nx, y: ny };
      rafRef.current = requestAnimationFrame(tick);
    };

    const onMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      if (!visibleRef.current && enabledRef.current) {
        posRef.current = { x, y };
        visibleRef.current = true;
        if (orbRef.current) orbRef.current.style.opacity = "1";
        if (trailRef.current) trailRef.current.style.opacity = "1";
      }

      targetRef.current = { x, y };
      startAnimation();
    };

    const onMouseOver = (e) => {
      const el = e.target;
      setHover(!!(el && el.closest && el.closest(INTERACTIVE_SELECTOR)));
    };

    const onMouseLeave = () => {
      if (enabledRef.current) {
        visibleRef.current = false;
        if (orbRef.current) orbRef.current.style.opacity = "0";
        if (trailRef.current) trailRef.current.style.opacity = "0";
      }
    };

    const refresh = () => {
      const allowed = isAllowed();
      if (allowed !== enabledRef.current) {
        enabledRef.current = allowed;
        document.body.classList.toggle("orb-cursor-active", allowed);
        if (!allowed) visibleRef.current = false;
      }
    };

    refresh();
    mediaMotion.addEventListener("change", refresh);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave, { passive: true });

    return () => {
      document.body.classList.remove("orb-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      mediaMotion.removeEventListener("change", refresh);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={orbRef}
        className="orb-cursor"
        style={{ opacity: 0, willChange: "transform" }}
        aria-hidden="true"
      >
        <span className="orb-cursor-shine" aria-hidden="true" />
      </div>
      <div
        ref={trailRef}
        className="orb-cursor-trail"
        style={{ opacity: 0, willChange: "transform" }}
        aria-hidden="true"
      />
    </>
  );
}

export default React.memo(OrbCursor);