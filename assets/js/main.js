(() => {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const projects = [...document.querySelectorAll('.project-scroll')];
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  let ticking = false;

  function setFrame(section, index) {
    const frames = [...section.querySelectorAll('.project-frame')];
    const dots = [...section.querySelectorAll('.frame-dot')];
    if (!frames.length) return;
    const next = clamp(index, 0, frames.length - 1);
    frames.forEach((frame, i) => frame.classList.toggle('is-active', i === next));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === next));
    const active = frames[next];
    section.dataset.activeFrame = String(next);
    const current = section.querySelector('[data-frame-current]');
    const caption = section.querySelector('[data-frame-caption]');
    if (current) current.textContent = String(next + 1).padStart(2, '0');
    if (caption) caption.textContent = active.dataset.caption || '';
  }

  function updateScrollScenes() {
    const viewport = window.innerHeight;
    const documentHeight = Math.max(document.documentElement.scrollHeight - viewport, 1);
    const pageProgress = clamp(window.scrollY / documentHeight, 0, 1);
    document.documentElement.style.setProperty('--page-progress', pageProgress.toFixed(4));

    let nearest = { id: '', distance: Infinity };
    projects.forEach(section => {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - viewport, 1);
      const desktopScene = window.innerWidth > 1100;
      const progress = desktopScene ? clamp(-rect.top / scrollable, 0, 1) : 0;
      const centered = Math.sin(progress * Math.PI);
      const phase = progress - 0.5;

      section.style.setProperty('--section-progress', progress.toFixed(4));
      section.style.setProperty('--stage-scale', (0.965 + centered * 0.035).toFixed(4));
      section.style.setProperty('--stage-opacity', (0.84 + centered * 0.16).toFixed(4));
      section.style.setProperty('--visual-y', `${(-phase * 24).toFixed(1)}px`);
      section.style.setProperty('--copy-y', `${(phase * 18).toFixed(1)}px`);
      section.style.setProperty('--orb-x', `${(phase * 42).toFixed(1)}px`);
      section.style.setProperty('--orb-y', `${(-phase * 24).toFixed(1)}px`);
      section.style.setProperty('--orb-x-2', `${(-phase * 23).toFixed(1)}px`);
      section.style.setProperty('--orb-y-2', `${(phase * 11).toFixed(1)}px`);

      if (desktopScene) {
        const frames = section.querySelectorAll('.project-frame');
        const frameIndex = Math.round(progress * Math.max(frames.length - 1, 0));
        if (Number(section.dataset.activeFrame || -1) !== frameIndex) setFrame(section, frameIndex);
      }

      const centerDistance = Math.abs(rect.top + rect.height / 2 - viewport / 2);
      if (centerDistance < nearest.distance) nearest = { id: section.id, distance: centerDistance };
    });

    navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.nav === nearest.id));
    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollScenes);
    }
  }

  projects.forEach(section => {
    const dots = [...section.querySelectorAll('.frame-dot')];
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = Number(dot.dataset.index);
        if (window.innerWidth <= 1100) {
          setFrame(section, index);
          return;
        }
        const ratio = dots.length <= 1 ? 0 : index / (dots.length - 1);
        const target = section.offsetTop + ratio * (section.offsetHeight - window.innerHeight);
        window.scrollTo({ top: target, behavior: 'smooth' });
      });
    });
  });

  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('figcaption');
  let currentSection = null;
  let currentIndex = 0;

  function showLightboxFrame() {
    const frames = [...currentSection.querySelectorAll('.project-frame')];
    const frame = frames[currentIndex];
    lightboxImage.src = frame.querySelector('img').src;
    lightboxImage.alt = frame.dataset.caption || '';
    lightboxCaption.textContent = frame.dataset.caption || '';
  }
  function openLightbox(section, index) {
    currentSection = section;
    currentIndex = index;
    showLightboxFrame();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.project-frame').forEach(frame => {
    frame.addEventListener('click', () => openLightbox(frame.closest('.project-scroll'), Number(frame.dataset.index)));
  });
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => {
    const count = currentSection.querySelectorAll('.project-frame').length;
    currentIndex = (currentIndex - 1 + count) % count;
    showLightboxFrame();
  });
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => {
    const count = currentSection.querySelectorAll('.project-frame').length;
    currentIndex = (currentIndex + 1) % count;
    showLightboxFrame();
  });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', event => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') lightbox.querySelector('.lightbox-prev').click();
    if (event.key === 'ArrowRight') lightbox.querySelector('.lightbox-next').click();
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  projects.forEach(section => setFrame(section, 0));
  updateScrollScenes();
})();
