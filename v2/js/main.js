document.addEventListener("DOMContentLoaded", function(){

  /* =========================================================
     HEADER NAVIGATION
     ========================================================= */

  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  const dropdowns =
    Array.from(
      document.querySelectorAll(".nav-dropdown")
    );

  function closeDropdowns(){

    dropdowns.forEach(function(dropdown){

      dropdown.classList.remove("is-open");

      const toggle =
        dropdown.querySelector(".nav-dropdown-toggle");

      if(toggle){
        toggle.setAttribute(
          "aria-expanded",
          "false"
        );
      }

    });

  }

  function setMenu(isOpen){

    if(!siteHeader || !menuToggle){
      return;
    }

    siteHeader.classList.toggle("menu-open", isOpen);

    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu"
    );

    /* Collapse the sub-menus so the panel always reopens tidy. */
    if(!isOpen){
      closeDropdowns();
    }

  }

  function menuIsOpen(){
    return !!siteHeader && siteHeader.classList.contains("menu-open");
  }


  /* =========================================================
     MOBILE MENU
     ========================================================= */

  if(menuToggle && siteHeader && navLinks){

    menuToggle.addEventListener("click", function(event){

      event.stopPropagation();

      setMenu(!menuIsOpen());

    });

    navLinks.querySelectorAll("a").forEach(function(link){

      link.addEventListener("click", function(){

        setMenu(false);

      });

    });

    /* The panel is anchored to the header, so a viewport change back to
       the desktop layout must not leave it stuck open. */
    window.addEventListener("resize", function(){

      if(
        menuIsOpen() &&
        window.matchMedia("(min-width:981px)").matches
      ){
        setMenu(false);
      }

    });

  }


  /* =========================================================
     DROPDOWN MENUS
     Hover works on desktop.
     Click works on desktop and mobile.
     ========================================================= */

  dropdowns.forEach(function(dropdown){

    const toggle =
      dropdown.querySelector(".nav-dropdown-toggle");

    if(!toggle){
      return;
    }

    toggle.addEventListener("click", function(event){

      event.preventDefault();
      event.stopPropagation();

      const shouldOpen =
        !dropdown.classList.contains("is-open");

      closeDropdowns();

      dropdown.classList.toggle(
        "is-open",
        shouldOpen
      );

      toggle.setAttribute(
        "aria-expanded",
        String(shouldOpen)
      );

    });

  });

  document.addEventListener("click", function(event){

    if(event.target.closest(".nav-dropdown")){
      return;
    }

    closeDropdowns();

    /* A tap outside the open mobile panel should dismiss it too. */
    if(menuIsOpen() && !event.target.closest(".site-header")){
      setMenu(false);
    }

  });

  document.addEventListener("keydown", function(event){

    if(event.key !== "Escape"){
      return;
    }

    closeDropdowns();

    if(menuIsOpen()){

      setMenu(false);

      if(menuToggle){
        menuToggle.focus();
      }

    }

  });


  /* =========================================================
     TESTIMONIALS SCROLLER
     Arrows drive the same native scroll as touch and trackpad.
     ========================================================= */

  const tScroller =
    document.getElementById("testimonials-scroller");

  const tPrev =
    document.getElementById("testimonials-prev");

  const tNext =
    document.getElementById("testimonials-next");

  if(tScroller && tPrev && tNext){

    const tTrack =
      tScroller.querySelector(".testimonial-track");

    const stepDistance = function(){

      const card =
        tScroller.querySelector(".testimonial");

      if(!card || !tTrack){
        return tScroller.clientWidth;
      }

      const gap =
        parseFloat(
          window.getComputedStyle(tTrack).columnGap
        ) || 0;

      return card.getBoundingClientRect().width + gap;

    };

    const updateArrows = function(){

      /* 1px of slack absorbs sub-pixel scroll positions. */
      const maxScroll =
        tScroller.scrollWidth - tScroller.clientWidth;

      tPrev.disabled = tScroller.scrollLeft <= 1;
      tNext.disabled = tScroller.scrollLeft >= maxScroll - 1;

    };

    tPrev.addEventListener("click", function(){

      tScroller.scrollBy({
        left:-stepDistance(),
        behavior:"smooth"
      });

    });

    tNext.addEventListener("click", function(){

      tScroller.scrollBy({
        left:stepDistance(),
        behavior:"smooth"
      });

    });

    tScroller.addEventListener(
      "scroll",
      updateArrows,
      { passive:true }
    );

    window.addEventListener("resize", updateArrows);

    updateArrows();

  }


  /* =========================================================
     STEP PROGRESS
     Each card fills its meter, and the rail to the next step,
     as it scrolls into view.
     ========================================================= */

  const steps =
    Array.from(
      document.querySelectorAll(".process-step")
    );

  if(steps.length){

    const stepsReduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)");

    const activateAll = function(){

      steps.forEach(function(step){
        step.classList.add("is-active");
      });

    };

    if(
      stepsReduceMotion.matches ||
      !("IntersectionObserver" in window)
    ){

      activateAll();

    }else{

      const stepObserver =
        new IntersectionObserver(
          function(entries, observer){

            entries.forEach(function(entry){

              if(!entry.isIntersecting){
                return;
              }

              const step = entry.target;

              /* Stagger by position so the row fills left to right. */
              window.setTimeout(
                function(){
                  step.classList.add("is-active");
                },
                steps.indexOf(step) * 130
              );

              observer.unobserve(step);

            });

          },
          { threshold:0.35 }
        );

      steps.forEach(function(step){
        stepObserver.observe(step);
      });

    }

  }


  /* =========================================================
     AUTO-HIDE HEADER
     The bar retracts while scrolling down and pops back into view
     as soon as you scroll up.
     ========================================================= */

  if(siteHeader){

    let lastY = window.scrollY;
    const revealAt = 90;
    const threshold = 6;

    const autoHideHeader = function(){

      const y = window.scrollY;
      const delta = y - lastY;

      /* Ignore scroll jitter so the bar does not flicker. */
      if(Math.abs(delta) < threshold){
        return;
      }

      /* The mobile panel and the dropdowns are anchored to the header,
         so keep it in place while either is in use. */
      const locked =
        menuIsOpen() ||
        siteHeader.querySelector(".nav-dropdown.is-open") ||
        siteHeader.contains(document.activeElement);

      if(locked || y < revealAt || delta < 0){
        siteHeader.classList.remove("is-hidden");
      }else{
        siteHeader.classList.add("is-hidden");
      }

      lastY = y;

    };

    window.addEventListener(
      "scroll",
      autoHideHeader,
      { passive:true }
    );

  }


  /* =========================================================
     BACK TO TOP
     ========================================================= */

  const toTop = document.getElementById("toTop");

  if(toTop){

    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateToTop = function(){

      toTop.classList.toggle(
        "is-visible",
        window.scrollY > window.innerHeight * 0.75
      );

    };

    toTop.addEventListener("click", function(){

      window.scrollTo({
        top:0,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });

    });

    window.addEventListener(
      "scroll",
      updateToTop,
      { passive:true }
    );

    updateToTop();

  }

  /* =========================================================
     PRODUCTS CAROUSEL
     ========================================================= */

  const track =
    document.getElementById("products-track");

  const viewport =
    document.getElementById("products-viewport");

  const prevBtn =
    document.getElementById("products-prev");

  const nextBtn =
    document.getElementById("products-next");

  const status =
    document.getElementById("products-status");

  const progressBar =
    document.getElementById("products-progress-bar");

  if(
    !track ||
    !viewport ||
    !prevBtn ||
    !nextBtn ||
    !status ||
    !progressBar
  ){
    return;
  }

  const products =
    Array.from(
      track.querySelectorAll(".product-card")
    );

  const totalProducts =
    products.length;

  let currentIndex = 0;
  let autoPlay = null;

  function getVisibleProducts(){

    if(window.innerWidth <= 700){
      return 1;
    }

    if(window.innerWidth <= 980){
      return 2;
    }

    return 4;

  }

  function getStepSize(){

    if(!products.length){
      return 0;
    }

    const card =
      products[0];

    const cardWidth =
      card.getBoundingClientRect().width;

    const trackStyle =
      window.getComputedStyle(track);

    const gap =
      parseFloat(trackStyle.columnGap) || 0;

    return cardWidth + gap;

  }

  function getMaxIndex(){

    return Math.max(
      0,
      totalProducts - getVisibleProducts()
    );

  }

  function updateCarousel(animate = true){

    const step =
      getStepSize();

    if(!step){
      return;
    }

    const maxIndex =
      getMaxIndex();

    currentIndex =
      Math.max(
        0,
        Math.min(
          currentIndex,
          maxIndex
        )
      );

    track.style.transition =
      animate
        ? "transform .6s cubic-bezier(.22,.61,.36,1)"
        : "none";

    track.style.transform =
      `translate3d(-${currentIndex * step}px, 0, 0)`;

    const displayedProduct =
      Math.min(
        currentIndex + 1,
        totalProducts
      );

    status.textContent =
      `${displayedProduct} / ${totalProducts}`;

    const progress =
      totalProducts > 1
        ? currentIndex / (totalProducts - 1)
        : 0;

    progressBar.style.transform =
      `translateX(${progress * 300}%)`;

  }

  function goNext(){

    const maxIndex =
      getMaxIndex();

    if(currentIndex >= maxIndex){
      currentIndex = 0;
    }else{
      currentIndex++;
    }

    updateCarousel(true);

  }

  function goPrevious(){

    const maxIndex =
      getMaxIndex();

    if(currentIndex <= 0){
      currentIndex = maxIndex;
    }else{
      currentIndex--;
    }

    updateCarousel(true);

  }

  function startAutoPlay(){

    stopAutoPlay();

    autoPlay =
      setInterval(
        function(){
          goNext();
        },
        5000
      );

  }

  function stopAutoPlay(){

    if(autoPlay){
      clearInterval(autoPlay);
      autoPlay = null;
    }

  }

  nextBtn.addEventListener(
    "click",
    function(){
      goNext();
      startAutoPlay();
    }
  );

  prevBtn.addEventListener(
    "click",
    function(){
      goPrevious();
      startAutoPlay();
    }
  );

  viewport.addEventListener(
    "mouseenter",
    stopAutoPlay
  );

  viewport.addEventListener(
    "mouseleave",
    startAutoPlay
  );

  let resizeTimer;

  window.addEventListener(
    "resize",
    function(){

      clearTimeout(resizeTimer);

      resizeTimer =
        setTimeout(
          function(){

            currentIndex =
              Math.min(
                currentIndex,
                getMaxIndex()
              );

            updateCarousel(false);

          },
          150
        );

    }
  );

  requestAnimationFrame(
    function(){

      updateCarousel(false);
      startAutoPlay();

    }
  );

});
