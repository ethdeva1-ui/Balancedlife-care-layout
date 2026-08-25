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

document.querySelectorAll('.zoom').forEach(function(btn){
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
