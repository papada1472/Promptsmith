/**
 * Refinzi Website — Minimal Motion & Interactive Preview Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Intersection Observer for subtle scroll animations (300ms ease-out)
  const fadeElements = document.querySelectorAll('.fade-in-up');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(el => observer.observe(el));

  // 2. Interactive Sparkle Orb Playground
  const orbWidget = document.getElementById('sparkleOrb');
  const orbStatus = document.getElementById('orbStatus');
  const orbPromptPreview = document.getElementById('orbPromptPreview');

  if (orbWidget && orbStatus) {
    let pressTimer;
    let isHold = false;

    // Single Tap / Click vs Hold interaction
    const handlePressStart = () => {
      isHold = false;
      pressTimer = setTimeout(() => {
        isHold = true;
        // Power User Flow: Hold for Expert Prompt
        orbStatus.textContent = '✨ Expert Prompt';
        orbWidget.style.borderColor = '#3B82F6';
        if (orbPromptPreview) {
          orbPromptPreview.textContent = 'Expert prompt generated directly into clipboard.';
          orbPromptPreview.style.color = '#3B82F6';
        }
      }, 450);
    };

    const handlePressEnd = () => {
      clearTimeout(pressTimer);
      if (!isHold) {
        // Core User Flow: Click for Context
        orbStatus.textContent = '✨ Adding context';
        orbWidget.style.borderColor = '#3B82F6';
        if (orbPromptPreview) {
          orbPromptPreview.textContent = 'Context injected without switching tabs.';
          orbPromptPreview.style.color = '#EDEDED';
        }

        setTimeout(() => {
          orbStatus.textContent = '✨ Refinzi Floating Sparkle';
        }, 2500);
      }
    };

    orbWidget.addEventListener('mousedown', handlePressStart);
    orbWidget.addEventListener('mouseup', handlePressEnd);
    orbWidget.addEventListener('touchstart', handlePressStart, { passive: true });
    orbWidget.addEventListener('touchend', handlePressEnd);
  }

  // 3. Mobile Navigation Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const isExpanded = navMenu.classList.contains('active');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
    });
  }
});
