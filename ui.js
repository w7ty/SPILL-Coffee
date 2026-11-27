
document.addEventListener("DOMContentLoaded", () => {
  const centerLogoImg = document.querySelector(".center-logo-img");
  if (centerLogoImg) {
    const applyLogoSize = () => {
      const isMobile = window.innerWidth <= 768;
      const size = isMobile ? "78px" : "96px";
      centerLogoImg.style.width = size;
      centerLogoImg.style.height = size;
    };
    applyLogoSize();
    window.addEventListener("resize", applyLogoSize, { passive: true });
  }

  const preloader = document.getElementById("preloader");
  const preloaderVideo = document.getElementById("preloader-video");
  let preloaderClosed = false;
  let preloaderSafetyTimer = null;

  const INTRO_DURATION_MS = 5500;

  const ua = navigator.userAgent || "";
  const isMobileDevice = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
  const isSafariBrowser =
    /Safari/i.test(ua) && !/Chrome|CriOS|Android|EdgiOS|OPiOS/i.test(ua);
  const isMobileChrome =
    isMobileDevice && (/CriOS/i.test(ua) || (/Chrome/i.test(ua) && /Android/i.test(ua)));

  const urlParams = new URLSearchParams(window.location.search);
  const cameFromCheckout =
    urlParams.get("from") === "checkout" ||
    urlParams.get("from") === "product" ||
    Boolean(urlParams.get("returnCategory")) ||
    sessionStorage.getItem("skip_intro_once") === "1";

  if (cameFromCheckout) {
    sessionStorage.removeItem("skip_intro_once");
    preloaderClosed = true;
    if (preloaderVideo) {
      preloaderVideo.pause();
      preloaderVideo.removeAttribute("src");
    }
    if (preloader) {
      preloader.remove();
    }
  } else {
    function finishPreloader() {
      if (preloaderClosed || !preloader) return;
      preloaderClosed = true;
      clearTimeout(preloaderSafetyTimer);

      if (preloaderVideo) {
        preloaderVideo.loop = false;
        preloaderVideo.onended = null;
        preloaderVideo.ontimeupdate = null;
        preloaderVideo.pause();
      }

      preloader.classList.add("zoom-out");
      const removeDelay = isSafariBrowser ? 350 : isMobileChrome ? 700 : 550;
      setTimeout(() => {
        preloader.remove();
      }, removeDelay);
    }

    function enableSoundOnUserGesture() {
      if (!preloaderVideo || preloaderClosed) return;
      preloaderVideo.muted = false;
      preloaderVideo.volume = 1;
      if (preloaderVideo.paused) {
        preloaderVideo.play().catch(() => {});
      }
    }

    if (preloaderVideo) {
      preloaderVideo.loop = false;
      preloaderVideo.playsInline = true;

      preloaderVideo.onended = () => {
        finishPreloader();
      };

      preloaderVideo.ontimeupdate = () => {
        if (preloaderClosed) return;
        if (preloaderVideo.currentTime >= 5.5) {
          finishPreloader();
        }
      };

      preloaderVideo.addEventListener("error", () => {
        clearTimeout(preloaderSafetyTimer);
        preloaderSafetyTimer = setTimeout(finishPreloader, 400);
      }, { once: true });

      preloaderVideo.muted = false;
      preloaderVideo.volume = 1;
      preloaderVideo.play().catch(() => {
        if (preloaderClosed) return;
        preloaderVideo.muted = true;
        preloaderVideo.play().catch(() => {});
      });
    }

    ["pointerdown", "touchstart", "click", "keydown"].forEach((evt) => {
      window.addEventListener(evt, enableSoundOnUserGesture, { once: true, passive: true });
    });

    preloaderSafetyTimer = setTimeout(finishPreloader, INTRO_DURATION_MS);
  }

  const sectionLoader = document.getElementById("section-loader");
  const sectionLoaderText = document.getElementById("section-loader-text");
  let paymentLoaderTimer = null;

  function showPaymentWaitingLoader(customText = "بانتظار إتمام الدفع...", duration = 2500) {
    if (!sectionLoader) return;
    if (sectionLoaderText) sectionLoaderText.textContent = customText;

    clearTimeout(paymentLoaderTimer);
    sectionLoader.classList.add("is-active");

    paymentLoaderTimer = setTimeout(() => {
      hidePaymentWaitingLoader();
    }, duration);
  }

  function hidePaymentWaitingLoader() {
    if (!sectionLoader) return;
    clearTimeout(paymentLoaderTimer);
    sectionLoader.classList.remove("is-active");
  }

  window.showPaymentWaitingLoader = (customText = "بانتظار إتمام الدفع...") => {
    showPaymentWaitingLoader(customText, 2500);
  };
  window.hidePaymentWaitingLoader = hidePaymentWaitingLoader;

  const revealFrames = document.querySelectorAll("[data-reveal]");
  if (revealFrames.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.45,
        rootMargin: "0px 0px -60px 0px"
      }
    );

    revealFrames.forEach((frame) => observer.observe(frame));
  }

  const menuToggle = document.getElementById("menu-toggle");
  const menuClose = document.getElementById("menu-close");
  const drawer = document.getElementById("category-drawer");
  const overlay = document.getElementById("drawer-overlay");

  const cartToggle = document.getElementById("cart-toggle");
  const cartClose = document.getElementById("cart-close");
  const cartDrawer = document.getElementById("cart-drawer");
  const cartOverlay = document.getElementById("cart-overlay");

  function openDrawer() {
    closeCart();
    drawer?.classList.add("open");
    if (overlay) overlay.hidden = false;
  }

  function closeDrawer() {
    drawer?.classList.remove("open");
    if (overlay) overlay.hidden = true;
  }

  function openCart() {
    closeDrawer();
    cartDrawer?.classList.add("open");
    cartDrawer?.setAttribute("aria-hidden", "false");
    if (cartOverlay) cartOverlay.hidden = false;
  }

  function closeCart() {
    cartDrawer?.classList.remove("open");
    cartDrawer?.setAttribute("aria-hidden", "true");
    if (cartOverlay) cartOverlay.hidden = true;
  }

  closeCart();

  window.UIControls = {
    openDrawer,
    closeDrawer,
    openCart,
    closeCart
  };

  menuToggle?.addEventListener("click", openDrawer);
  menuClose?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  cartToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    openCart();
  });
  cartClose?.addEventListener("click", closeCart);
  cartOverlay?.addEventListener("click", closeCart);

  function injectSmoothAccordionStyles() {
    if (document.getElementById("smooth-accordion-style")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "smooth-accordion-style";
    styleEl.textContent = `
      .nav-group > .sub-menu,
      .category-group > ul,
      .category-group > .group-items,
      .category-group > .category-sublist,
      .category-group > .sub-categories,
      .category-group > .drawer-sublist {
        display: flex !important;
        flex-direction: column;
        overflow: hidden !important;
        max-height: 0px;
        opacity: 0;
        transform: translateY(-6px);
        transition:
          max-height 0.38s cubic-bezier(0.22, 1, 0.36, 1),
          opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.38s cubic-bezier(0.22, 1, 0.36, 1) !important;
        pointer-events: none;
      }

      .nav-group.is-accordion-open > .sub-menu,
      .category-group.is-accordion-open > ul,
      .category-group.is-accordion-open > .group-items,
      .category-group.is-accordion-open > .category-sublist,
      .category-group.is-accordion-open > .sub-categories,
      .category-group.is-accordion-open > .drawer-sublist {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .nav-group .group-toggle i,
      .nav-group .group-toggle svg,
      .category-group .group-toggle i,
      .category-group .group-toggle svg {
        transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .nav-group.is-accordion-open .group-toggle i,
      .nav-group.is-accordion-open .group-toggle svg,
      .category-group.is-accordion-open .group-toggle i,
      .category-group.is-accordion-open .group-toggle svg {
        transform: rotate(180deg);
      }
    `;
    document.head.appendChild(styleEl);
  }

  injectSmoothAccordionStyles();

  const GROUP_SELECTOR = ".nav-group, .category-group";

  function getGroupSubmenu(groupEl) {
    if (!groupEl) return null;
    return groupEl.querySelector(
      ":scope > .sub-menu, :scope > ul, :scope > .group-items, :scope > .category-sublist, :scope > .sub-categories, :scope > .drawer-sublist"
    );
  }

  function setGroupOpenSmooth(groupEl, shouldOpen) {
    if (!groupEl) return;
    const submenu = getGroupSubmenu(groupEl);

    if (!submenu) {
      groupEl.classList.toggle("open", shouldOpen);
      groupEl.classList.toggle("is-accordion-open", shouldOpen);
      return;
    }

    submenu.hidden = false;

    if (shouldOpen) {
      groupEl.classList.add("open");
      groupEl.classList.add("is-accordion-open");
      submenu.style.maxHeight = "0px";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const targetH = submenu.scrollHeight + 24;
          submenu.style.maxHeight = `${targetH}px`;
          submenu.style.opacity = "1";
          submenu.style.transform = "translateY(0)";
        });
      });
    } else {
      const currentH = submenu.scrollHeight || submenu.offsetHeight || 0;
      submenu.style.maxHeight = `${currentH}px`;
      submenu.style.opacity = "1";
      submenu.style.transform = "translateY(0)";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          submenu.style.maxHeight = "0px";
          submenu.style.opacity = "0";
          submenu.style.transform = "translateY(-6px)";
        });
      });

      groupEl.classList.remove("open");
      groupEl.classList.remove("is-accordion-open");
    }
  }

  document.querySelectorAll(GROUP_SELECTOR).forEach((grp) => {
    const submenu = getGroupSubmenu(grp);
    grp.classList.remove("open");
    grp.classList.remove("is-accordion-open");
    if (submenu) {
      submenu.hidden = false;
      submenu.style.maxHeight = "0px";
      submenu.style.opacity = "0";
      submenu.style.transform = "translateY(-6px)";
    }
  });

  document.querySelectorAll(".group-toggle").forEach((oldBtn) => {
    const btn = oldBtn.cloneNode(true);
    oldBtn.replaceWith(btn);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      const parentGroup = btn.closest(GROUP_SELECTOR) || btn.parentElement;
      if (!parentGroup) return;

      const willOpen = !parentGroup.classList.contains("is-accordion-open");

      document.querySelectorAll(GROUP_SELECTOR).forEach((grp) => {
        if (grp !== parentGroup) {
          setGroupOpenSmooth(grp, false);
        }
      });

      setGroupOpenSmooth(parentGroup, willOpen);
    });
  });

  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    themeToggle.innerHTML =
      theme === "dark"
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
  }

  const scrollTopBtn = document.getElementById("scroll-top-btn");
  window.addEventListener("scroll", () => {
    if (!scrollTopBtn) return;
    if (window.scrollY > 250) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

  scrollTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const offersTrack = document.getElementById("offers-track");
  let autoScrollTimer = null;
  let resumeTimer = null;
  let isDraggingOffer = false;
  let draggedMoved = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;
  let singleLoopWidth = 0;
  let scrollDir = -1;

  function recalcLoopWidth() {
    if (!offersTrack) return;
    singleLoopWidth = Math.floor(offersTrack.scrollWidth / 2);
  }

  function wrapContinuousScroll() {
    if (!offersTrack || singleLoopWidth <= 0) return;
    const pos = offersTrack.scrollLeft;
    if (pos < 0) {
      const absPos = Math.abs(pos);
      if (absPos >= singleLoopWidth) {
        offersTrack.scrollLeft = -(absPos % singleLoopWidth);
      }
    } else if (pos >= singleLoopWidth) {
      offersTrack.scrollLeft = pos % singleLoopWidth;
    }
  }

  function startOffersAutoScroll() {
    stopOffersAutoScroll();
    if (!offersTrack || offersTrack.hidden) return;

    recalcLoopWidth();

    autoScrollTimer = setInterval(() => {
      if (!offersTrack || offersTrack.hidden || isDraggingOffer) return;
      if (singleLoopWidth <= 0) recalcLoopWidth();
      if (singleLoopWidth <= 0) return;

      offersTrack.scrollLeft += scrollDir * 1;
      wrapContinuousScroll();
    }, 18);
  }

  function stopOffersAutoScroll() {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  offersTrack?.addEventListener("pointerdown", (e) => {
    if (!offersTrack) return;
    isDraggingOffer = true;
    draggedMoved = false;
    clearTimeout(resumeTimer);
    dragStartX = e.clientX;
    dragStartScrollLeft = offersTrack.scrollLeft;
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDraggingOffer || !offersTrack) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 5) {
      draggedMoved = true;
    }
    if (dx < -2) scrollDir = -1;
    else if (dx > 2) scrollDir = 1;
    offersTrack.scrollLeft = dragStartScrollLeft - dx;
    wrapContinuousScroll();
  });

  function finishOfferDrag() {
    if (!isDraggingOffer) return;
    isDraggingOffer = false;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      draggedMoved = false;
    }, 60);
  }

  window.addEventListener("pointerup", finishOfferDrag);
  window.addEventListener("pointercancel", finishOfferDrag);
  window.addEventListener("resize", recalcLoopWidth, { passive: true });

  window.OffersCarousel = {
    recalcLoopWidth,
    startOffersAutoScroll,
    stopOffersAutoScroll,
    wasDragged: () => draggedMoved
  };
});