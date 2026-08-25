document.getElementById('yr').textContent = new Date().getFullYear();

var nav = document.getElementById('nav'), mb = document.getElementById('menuBtn');
mb.addEventListener('click', function(){
  var open = nav.getAttribute('data-open') === 'true';
  nav.setAttribute('data-open', String(!open));
  mb.setAttribute('aria-expanded', String(!open));
});

var subs = nav.querySelectorAll('.has-sub');

function closeSubs(except){
  subs.forEach(function(li){
    if(li === except) return;
    li.setAttribute('data-open','false');
    li.querySelector('.sub-btn').setAttribute('aria-expanded','false');
  });
}

function closeMenu(){
  nav.setAttribute('data-open','false');
  mb.setAttribute('aria-expanded','false');
  closeSubs(null);
}

subs.forEach(function(li){
  var btn = li.querySelector('.sub-btn');
  li.setAttribute('data-open','false');
  btn.addEventListener('click', function(){
    var open = li.getAttribute('data-open') === 'true';
    closeSubs(li);
    li.setAttribute('data-open', String(!open));
    btn.setAttribute('aria-expanded', String(!open));
  });
});

nav.querySelectorAll('a').forEach(function(a){
  a.addEventListener('click', closeMenu);
});

document.addEventListener('click', function(e){
  if(!nav.contains(e.target)) closeMenu();
});

document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  closeMenu();
  if(document.activeElement && nav.contains(document.activeElement)) document.activeElement.blur();
});

var aboutBtn = document.getElementById('aboutToggle'),
    aboutMore = document.getElementById('aboutMore');
aboutBtn.addEventListener('click', function(){
  var open = aboutBtn.getAttribute('aria-expanded') === 'true';
  aboutBtn.setAttribute('aria-expanded', String(!open));
  aboutMore.hidden = open;
  aboutBtn.querySelector('span').textContent = open ? 'Read more' : 'Read less';
});

document.getElementById('intakeForm').addEventListener('submit', function(e){
  e.preventDefault();
  var note = document.getElementById('formNote');
  if(!this.checkValidity()){ note.style.color = 'var(--alert)'; note.textContent = 'Please complete the required fields and both confirmations.'; return; }
  note.style.color = 'var(--brand)';
  note.textContent = 'Thank you — a care coordinator will contact you within one business day. (Demo form: connect to your HIPAA-compliant intake endpoint.)';
  this.reset();
});

/* Back-to-top: appears once you're a screen down, honours reduced motion. */
var toTop = document.getElementById('toTop');

function toggleToTop(){
  toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.75);
}

toTop.addEventListener('click', function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
});

window.addEventListener('scroll', toggleToTop, { passive: true });
toggleToTop();

/* Retract the header while scrolling down, bring it back on the way up. */
var head = document.querySelector('header'),
    lastY = window.scrollY,
    revealAt = 90;

function autoHideHeader(){
  var y = window.scrollY,
      delta = y - lastY;

  if(Math.abs(delta) < 6) return;

  var locked = nav.getAttribute('data-open') === 'true' ||
               nav.querySelector('.has-sub[data-open="true"]') ||
               head.contains(document.activeElement);

  if(locked || y < revealAt || delta < 0) head.classList.remove('is-hidden');
  else head.classList.add('is-hidden');

  lastY = y;
}

window.addEventListener('scroll', autoHideHeader, { passive: true });

/* Click a product image to open it full size; click again to zoom in. */
var lightbox = document.getElementById('lightbox'),
    lightboxImg = document.getElementById('lightboxImg'),
    lightboxClose = document.getElementById('lightboxClose'),
    lastZoomTrigger = null;

function openLightbox(btn){
  var img = btn.querySelector('img');
  lightboxImg.src = btn.getAttribute('data-zoom-src');
  lightboxImg.alt = img ? img.alt : '';
  lightbox.classList.remove('is-zoomed');
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lastZoomTrigger = btn;
  lightboxClose.focus();
}

function closeLightbox(){
  lightbox.hidden = true;
  lightbox.classList.remove('is-zoomed');
  lightbox.scrollTop = 0;
  document.body.style.overflow = '';
  if(lastZoomTrigger){ lastZoomTrigger.focus(); lastZoomTrigger = null; }
}

document.querySelectorAll('[data-zoom-src]').forEach(function(btn){
  btn.addEventListener('click', function(){ openLightbox(btn); });
});

lightboxImg.addEventListener('click', function(e){
  e.stopPropagation();
  lightbox.classList.toggle('is-zoomed');
});

lightbox.addEventListener('click', closeLightbox);
lightboxClose.addEventListener('click', closeLightbox);

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

/* Reveal blocks as they scroll into view. Groups get a small stagger so a
   row of cards arrives in sequence rather than all at once. */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || !('IntersectionObserver' in window)) return;

  var groups = [
    ['.sec-head', 0],
    ['.video-head', 0],
    ['.video-frame', 0],
    ['.hero-card', 0],
    ['.banner-tagline, .hero-grid h1, .hero .lede, .hero .cta-row, .microcopy, .banner-marks', 70],
    ['.trust-item', 70],
    ['.glp1-grid > *', 90],
    ['.about-copy', 0],
    ['.product', 70],
    ['.products-all', 0],
    ['.contact-grid > *', 90],
    ['.legal-grid > div', 60],
    ['.foot-grid > div', 60]
  ];

  var seen = [];
  groups.forEach(function(group){
    var els = document.querySelectorAll(group[0]), step = group[1];
    Array.prototype.forEach.call(els, function(el, i){
      if(seen.indexOf(el) !== -1) return;
      seen.push(el);
      el.setAttribute('data-reveal', '');
      if(step) el.style.setProperty('--reveal-delay', (i % 4) * step + 'ms');
    });
  });

  document.documentElement.classList.add('js-reveal');

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

  seen.forEach(function(el){ io.observe(el); });

  /* anything already in view animates on the first frame, so the hero
     plays its entrance instead of waiting for a scroll */
  requestAnimationFrame(function(){
    seen.forEach(function(el){
      if(el.getBoundingClientRect().top < window.innerHeight * 0.92){
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    });
  });
})();

/* Auto-scrolling gallery. The tile set is repeated until one half of the
   list is taller than the well, then the list is translated by exactly
   -50% — so the bottom edge always has tiles arriving and the seam is
   invisible. Pauses on hover or keyboard focus. */
(function(){
  var well = document.querySelector('.about-gallery-scroll'),
      list = well && well.querySelector('.about-gallery');
  if(!well || !list) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var originals = Array.prototype.slice.call(list.children);

  function addSet(){
    originals.forEach(function(li){
      var clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      var btn = clone.querySelector('.gal');
      if(btn){
        btn.tabIndex = -1;
        btn.addEventListener('click', function(){ openLightbox(btn); });
      }
      list.appendChild(clone);
    });
  }

  function build(){
    /* strip everything but the original set, then rebuild for this size */
    while(list.children.length > originals.length){
      list.removeChild(list.lastChild);
    }
    well.classList.remove('is-marquee');

    var setHeight = list.scrollHeight,
        needed = Math.max(1, Math.ceil(well.clientHeight / setHeight)),
        i;

    /* `needed` sets fill the well; double that so -50% is a whole number
       of sets and the loop never runs out of tiles at the bottom */
    for(i = 1; i < needed * 2; i++) addSet();

    well.style.setProperty('--marquee-duration',
      Math.max(20, Math.round(list.scrollHeight / 2 / 26)) + 's');
    well.classList.add('is-marquee');
  }

  var resizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
  window.addEventListener('load', build);
  build();
})();

/* Testimonial carousel: arrows, drag-to-scroll, and a gentle auto-advance
   that pauses on hover, focus, drag or touch. */
(function(){
  var track = document.getElementById('tTrack');
  if(!track) return;

  var arrows = document.querySelectorAll('.t-arrow'),
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step(){
    var card = track.querySelector('.testimonial');
    if(!card) return 320;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 10;
    return card.getBoundingClientRect().width + gap;
  }

  function maxScroll(){
    return track.scrollWidth - track.clientWidth;
  }

  function syncArrows(){
    var x = track.scrollLeft, max = maxScroll();
    Array.prototype.forEach.call(arrows, function(btn){
      var dir = Number(btn.getAttribute('data-dir'));
      btn.disabled = dir < 0 ? x <= 2 : x >= max - 2;
    });
  }

  Array.prototype.forEach.call(arrows, function(btn){
    btn.addEventListener('click', function(){
      track.scrollBy({ left: Number(btn.getAttribute('data-dir')) * step(), behavior: reduce ? 'auto' : 'smooth' });
      pause(6000);
    });
  });

  track.addEventListener('scroll', syncArrows, { passive: true });
  window.addEventListener('resize', syncArrows);
  syncArrows();

  /* drag to scroll */
  var down = false, startX = 0, startLeft = 0, moved = 0;

  track.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    down = true; moved = 0;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.classList.add('is-grabbing');
    pause(6000);
  });

  track.addEventListener('pointermove', function(e){
    if(!down) return;
    var dx = e.clientX - startX;
    moved = Math.abs(dx);
    if(moved > 3 && track.hasPointerCapture && !track.hasPointerCapture(e.pointerId)){
      track.setPointerCapture(e.pointerId);
    }
    track.scrollLeft = startLeft - dx;
  });

  function endDrag(){
    if(!down) return;
    down = false;
    track.classList.remove('is-grabbing');
  }

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  /* a drag must not fire the click underneath it */
  track.addEventListener('click', function(e){
    if(moved > 5){ e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* auto-advance */
  var timer = null, resume = null;

  function tick(){
    if(track.scrollLeft >= maxScroll() - 2){
      track.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function start(){
    if(reduce || timer) return;
    timer = setInterval(tick, 5000);
  }

  function stop(){
    clearInterval(timer);
    timer = null;
  }

  function pause(ms){
    stop();
    clearTimeout(resume);
    resume = setTimeout(start, ms);
  }

  track.addEventListener('mouseenter', stop);
  track.addEventListener('mouseleave', start);
  track.addEventListener('focusin', stop);
  track.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', function(){
    if(document.hidden) stop(); else start();
  });

  start();
})();
