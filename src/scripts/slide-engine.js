/**
 * Slide navigation engine.
 *
 * All slides are rendered on one page (one per <section data-slide>).
 * Only the current slide is visible. Keyboard/touch/click navigation
 * moves between slides. Reveal items are shown progressively.
 */

class SlideEngine {
  constructor() {
    this.slides = Array.from(document.querySelectorAll('[data-slide]'));
    this.currentSlide = 0;
    this.reveals = new Map();
    this.totalSlides = this.slides.length;

    if (this.totalSlides === 0) return;

    this.parseReveals();
    this.loadFromHash();
    this.bindKeys();
    this.bindTouch();
    this.bindNavButtons();
    this.render();
  }

  parseReveals() {
    this.slides.forEach((slide, i) => {
      const items = [];
      const containers = slide.querySelectorAll('[data-reveal]');

      containers.forEach((container) => {
        if (container.dataset.reveal === 'items') {
          Array.from(container.children).forEach((child) => {
            items.push(child);
          });
        } else {
          items.push(container);
        }
      });

      this.reveals.set(i, { items, cursor: 0 });
    });
  }

  next() {
    const reveal = this.reveals.get(this.currentSlide);
    if (reveal && reveal.cursor < reveal.items.length) {
      reveal.items[reveal.cursor].classList.remove('reveal-hidden');
      reveal.items[reveal.cursor].classList.add('reveal-visible');
      reveal.cursor++;
    } else if (this.currentSlide < this.totalSlides - 1) {
      this.currentSlide++;
      this.render();
    }
  }

  prev() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      // On back-navigation, show all reveals for that slide
      const reveal = this.reveals.get(this.currentSlide);
      if (reveal) {
        reveal.cursor = reveal.items.length;
      }
      this.render();
    }
  }

  goTo(index) {
    if (index >= 0 && index < this.totalSlides) {
      this.currentSlide = index;
      // Show all reveals when jumping directly
      const reveal = this.reveals.get(this.currentSlide);
      if (reveal) {
        reveal.cursor = reveal.items.length;
      }
      this.render();
    }
  }

  render() {
    this.slides.forEach((slide, i) => {
      slide.style.display = i === this.currentSlide ? '' : 'none';
    });

    // Apply reveal state for current slide
    const reveal = this.reveals.get(this.currentSlide);
    if (reveal) {
      reveal.items.forEach((item, j) => {
        if (j < reveal.cursor) {
          item.classList.remove('reveal-hidden');
          item.classList.add('reveal-visible');
        } else {
          item.classList.remove('reveal-visible');
          item.classList.add('reveal-hidden');
        }
      });
    }

    this.updateHash();
    this.updateCounter();
  }

  loadFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/^#slide-(\d+)$/);
    if (match) {
      const slideNum = parseInt(match[1], 10) - 1; // 1-indexed in URL
      if (slideNum >= 0 && slideNum < this.totalSlides) {
        this.currentSlide = slideNum;
        // Show all reveals when loading from hash
        const reveal = this.reveals.get(this.currentSlide);
        if (reveal) {
          reveal.cursor = reveal.items.length;
        }
      }
    }
  }

  updateHash() {
    const newHash = `#slide-${this.currentSlide + 1}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  updateCounter() {
    const counter = document.querySelector('[data-nav="counter"]');
    if (counter) {
      counter.textContent = `${this.currentSlide + 1} / ${this.totalSlides}`;
    }
  }

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prev();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.totalSlides - 1);
          break;
        case 'Escape':
          // Go back to index
          window.location.href = '/';
          break;
      }
    });
  }

  bindTouch() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;

      // Only handle horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    }, { passive: true });
  }

  bindNavButtons() {
    const prevBtn = document.querySelector('[data-nav="prev"]');
    const nextBtn = document.querySelector('[data-nav="next"]');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SlideEngine());
} else {
  new SlideEngine();
}
