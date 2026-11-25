document.addEventListener("DOMContentLoaded", () => {
  const productsByCategory = window.productsByCategory || {};
  const sampleOffers = window.sampleOffers || [];

  let activeCategoryKey = "all";
  let activeCategoryLabel = "العروض الحالية";

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
  let preloaderStarted = false;
  let preloaderSafetyTimer = null;

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
        preloaderVideo.removeEventListener("ended", finishPreloader);
        preloaderVideo.loop = false;
        preloaderVideo.pause();
      }

      preloader.classList.add("zoom-out");
      setTimeout(() => {
        preloader.remove();
      }, 650);
    }

    if (preloaderVideo) {
      preloaderVideo.loop = false;
      preloaderVideo.muted = true;
      preloaderVideo.playsInline = true;

      preloaderVideo.addEventListener("ended", finishPreloader, { once: true });
      preloaderVideo.addEventListener("error", () => {
        clearTimeout(preloaderSafetyTimer);
        preloaderSafetyTimer = setTimeout(finishPreloader, 500);
      }, { once: true });

      if (!preloaderStarted && preloaderVideo.paused) {
        preloaderStarted = true;
        preloaderVideo.play().catch(() => {});
      }
    }

    preloaderSafetyTimer = setTimeout(finishPreloader, 7500);
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
    if (cartOverlay) cartOverlay.hidden = false;
  }

  function closeCart() {
    cartDrawer?.classList.remove("open");
    if (cartOverlay) cartOverlay.hidden = true;
  }

  menuToggle?.addEventListener("click", openDrawer);
  menuClose?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  cartToggle?.addEventListener("click", openCart);
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

  window.handleProductImgError = (imgEl, baseName) => {
    if (!imgEl || !baseName) return;
    const step = Number(imgEl.dataset.fallbackStep || "0");
    const lower = baseName.toLowerCase();
    const candidates = [
      `image-coffee/${baseName}.jpeg`,
      `image-coffee/${baseName}.jpg`,
      `image-coffee/${baseName}.png`,
      `image-coffee/${baseName.replace(/\s+/g, "-")}.jpeg`,
      `image-coffee/${baseName.replace(/\s+/g, "-")}.jpg`,
      `image-coffee/${baseName.replace(/\s+/g, "-")}.png`,
      `image-coffee/${baseName.replace(/\s+/g, "_")}.jpeg`,
      `image-coffee/${baseName.replace(/\s+/g, "_")}.jpg`,
      `image-coffee/${lower}.jpeg`,
      `image-coffee/${lower}.jpg`,
      `image-coffee/${lower.replace(/\s+/g, "-")}.jpeg`,
      `image-coffee/${lower.replace(/\s+/g, "-")}.jpg`,
      "image-coffee/image-logo.jpeg"
    ];
    if (step < candidates.length) {
      imgEl.dataset.fallbackStep = String(step + 1);
      imgEl.src = candidates[step];
    }
  };

  function findProductById(productId) {
    return Object.values(productsByCategory)
      .flat()
      .find((p) => p.id === productId);
  }

  function findCategoryOfProduct(productId) {
    for (const [catKey, items] of Object.entries(productsByCategory)) {
      if (Array.isArray(items) && items.some((item) => item.id === productId)) {
        return catKey;
      }
    }
    return "all";
  }

  const COLORED_PRODUCTS_CONFIG = [
    {
      match: (p) => {
        const id = String(p.id || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();
        return id === "dripper-1dr" || name.includes("chromacraft") || name.includes("كروما كرافت");
      },
      colors: [
        { name: "أبيض", swatch: "#f5f3ef" },
        { name: "رمادي فاتح", swatch: "#b8bec6" },
        { name: "أحمر", swatch: "#c62828" },
        { name: "وردي", swatch: "#e8a0b0" },
        { name: "أصفر", swatch: "#eab308" },
        { name: "بني غامق", swatch: "#5c3428" },
        { name: "أزرق", swatch: "#7fb3d5" },
        { name: "أخضر", swatch: "#65b868" }
      ]
    },
    {
      match: (p) => {
        const id = String(p.id || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();
        return id === "distiller-4th" || name.includes("تشكيلة أباريق ترشيع يدوية بألوان متعددة");
      },
      colors: [
        { name: "وردي", swatch: "#e14b64" },
        { name: "أسود", swatch: "#1e1b18" },
        { name: "أبيض", swatch: "#f5f3ef" }
      ]
    },
    {
      match: (p) => {
        const id = String(p.id || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();
        return (
          id === "kettle-3bh" ||
          name.includes("غلاية ترشيع كهربائية قمعية بلمسات خشبية") ||
          name.includes("غلاية ترشيع كهربائية رقمية بلمسات خشبية")
        );
      },
      colors: [
        { name: "أسود", swatch: "#1e1b18" },
        { name: "أبيض", swatch: "#f5f3ef" }
      ]
    }
  ];

  function normalizeProductColors(product) {
    if (!product) return [];

    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors
        .map((c) => (typeof c === "string" ? { name: c.trim(), swatch: "" } : c))
        .filter((c) => c && c.name);
    }

    const matchedRule = COLORED_PRODUCTS_CONFIG.find((rule) => rule.match(product));
    if (matchedRule) {
      return matchedRule.colors;
    }

    return [];
  }

  let isNavigatingSmoothly = false;

  function navigateSmoothly(targetUrl) {
    if (!targetUrl || isNavigatingSmoothly) return;
    isNavigatingSmoothly = true;
    document.body.style.transition =
      "opacity 0.34s cubic-bezier(0.22, 1, 0.36, 1), transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)";
    document.body.style.opacity = "0";
    document.body.style.transform = "translateY(8px)";

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 280);
  }

  function smoothSectionSwitch(containerEl, updateFn) {
    if (!containerEl) {
      updateFn();
      return;
    }

    containerEl.style.transition =
      "opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1), transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)";
    containerEl.style.opacity = "0";
    containerEl.style.transform = "translateY(8px)";

    setTimeout(() => {
      updateFn();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          containerEl.style.opacity = "1";
          containerEl.style.transform = "translateY(0)";
          setTimeout(() => {
            containerEl.style.transform = "";
          }, 260);
        });
      });
    }, 150);
  }

  function goToProductDetail(productId) {
    if (!productId || isNavigatingSmoothly) return;
    const resolvedCat =
      activeCategoryKey && activeCategoryKey !== "all"
        ? activeCategoryKey
        : findCategoryOfProduct(productId);
    const resolvedLabel =
      activeCategoryKey && activeCategoryKey !== "all"
        ? activeCategoryLabel
        : "";

    sessionStorage.setItem("skip_intro_once", "1");
    sessionStorage.setItem("last_category_key", resolvedCat);
    if (resolvedLabel) {
      sessionStorage.setItem("last_category_label", resolvedLabel);
    } else {
      sessionStorage.removeItem("last_category_label");
    }

    const detailUrl = `products.html?id=${encodeURIComponent(productId)}&cat=${encodeURIComponent(resolvedCat)}`;
    navigateSmoothly(detailUrl);
  }

  const backToStoreLink = document.getElementById("back-to-store-link");

  function smoothReturnToCategory(e) {
    if (e) e.preventDefault();
    const targetCat =
      urlParams.get("cat") ||
      sessionStorage.getItem("last_category_key") ||
      "all";

    sessionStorage.setItem("skip_intro_once", "1");

    const nextUrl =
      targetCat && targetCat !== "all"
        ? `index.html?from=product&returnCategory=${encodeURIComponent(targetCat)}`
        : "index.html?from=product";

    navigateSmoothly(nextUrl);
  }

  backToStoreLink?.addEventListener("click", smoothReturnToCategory);

  function resolveCategoryKey(category, labelText = "") {
    if (category && productsByCategory[category]) return category;

    const combined = `${category || ""} ${labelText || ""}`.toLowerCase();

    if (
      combined.includes("crop") ||
      combined.includes("bean") ||
      combined.includes("محصول") ||
      combined.includes("محاصيل") ||
      combined.includes("بن") ||
      combined.includes("قهوة")
    ) {
      return "coffee-crops";
    }

    if (
      combined.includes("cleaning") ||
      combined.includes("organizer") ||
      combined.includes("تنظيف") ||
      combined.includes("صيانة") ||
      combined.includes("فرش")
    ) {
      return "cleaning-tools";
    }

    if (combined.includes("grinder") || combined.includes("مطحن")) {
      if (
        combined.includes("manual") ||
        combined.includes("hand") ||
        combined.includes("يدوي")
      ) {
        return "manual-grinders";
      }
      if (
        combined.includes("auto") ||
        combined.includes("electric") ||
        combined.includes("كهرب") ||
        combined.includes("رقم") ||
        combined.includes("محمول")
      ) {
        return "electric-grinders";
      }
      return "machines-grinders";
    }

    if (
      combined.includes("manual") ||
      combined.includes("distiller") ||
      combined.includes("يدوي") ||
      combined.includes("إبريق") ||
      combined.includes("ابريق")
    ) {
      return "manual-kettles";
    }

    if (
      combined.includes("electric") ||
      combined.includes("kettle") ||
      combined.includes("غلا") ||
      combined.includes("كهرب")
    ) {
      return "electric-kettles";
    }

    if (
      combined.includes("machine") ||
      combined.includes("espresso") ||
      combined.includes("آل") ||
      combined.includes("اله") ||
      combined.includes("مكائن")
    ) {
      return "machines-grinders";
    }

    if (
      combined.includes("filter") ||
      combined.includes("فلتر") ||
      combined.includes("فلاتر")
    ) {
      return "filters";
    }

    if (
      combined.includes("drip-bag") ||
      combined.includes("envelope") ||
      combined.includes("أظرف") ||
      combined.includes("اظرف")
    ) {
      return "drip-bags";
    }

    if (
      combined.includes("sticker") ||
      combined.includes("attachment") ||
      combined.includes("ملصق")
    ) {
      return "stickers";
    }

    if (
      combined.includes("cup") ||
      combined.includes("كوب") ||
      combined.includes("أكواب") ||
      combined.includes("اكواب")
    ) {
      return "cups";
    }

    if (combined.includes("server") || combined.includes("سيرفر")) {
      return "servers";
    }

    if (
      combined.includes("dripper") ||
      combined.includes("funnel") ||
      combined.includes("قمع") ||
      combined.includes("أقماع")
    ) {
      return "drippers";
    }

    if (
      combined.includes("scale") ||
      combined.includes("balance") ||
      combined.includes("ميزان") ||
      combined.includes("موازين")
    ) {
      return "scales";
    }

    return (category || "").trim();
  }

  function findLinkLabelForCategory(targetKey) {
    const links = Array.from(document.querySelectorAll(".category-link"));
    for (const link of links) {
      const rawCat = link.getAttribute("data-category");
      const text = link.textContent.trim();
      if (rawCat === targetKey || resolveCategoryKey(rawCat, text) === targetKey) {
        return { link, text };
      }
    }
    return { link: null, text: "" };
  }

  let cartToastTimer = null;
  let cartToastHideTimer = null;

  function ensureCartToastElement() {
    let toast = document.getElementById("cart-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cart-toast";
      toast.className = "cart-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.style.cssText = `
      position: fixed !important;
      top: 84px !important;
      left: 50% !important;
      right: auto !important;
      bottom: auto !important;
      margin: 0 !important;
      background-color: var(--surface-color, #ffffff);
      color: var(--text-color, #1a1a1a);
      border: 1.5px solid var(--accent-color, #9e6f0e);
      border-radius: 12px;
      padding: 0.78rem 1.3rem;
      font-size: 0.92rem;
      font-weight: 800;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
      z-index: 2147483647 !important;
      display: inline-flex !important;
      align-items: center;
      gap: 0.55rem;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      transform: translate3d(-50%, -14px, 0) scale(0.97);
      transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1), transform 0.36s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.32s ease;
    `;

    return toast;
  }

  function showCartToast(message = "تم إضافة منتجك بنجاح", isWarning = false) {
    const toast = ensureCartToastElement();
    const borderCol = isWarning ? "#c62828" : "var(--accent-color, #9e6f0e)";
    const iconHtml = isWarning
      ? `<i class="fa-solid fa-circle-exclamation" style="color: #c62828;"></i>`
      : `<i class="fa-solid fa-circle-check"></i>`;

    toast.style.borderColor = borderCol;
    toast.innerHTML = `${iconHtml}<span>${message}</span>`;

    clearTimeout(cartToastTimer);
    clearTimeout(cartToastHideTimer);

    toast.style.visibility = "visible";
    toast.style.opacity = "0";
    toast.style.transform = "translate3d(-50%, -14px, 0) scale(0.97)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translate3d(-50%, 0, 0) scale(1)";
      });
    });

    cartToastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate3d(-50%, -10px, 0) scale(0.98)";
      cartToastHideTimer = setTimeout(() => {
        toast.style.visibility = "hidden";
      }, 340);
    }, 2200);
  }

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("spill_cart") || "[]");
    if (!Array.isArray(cart)) cart = [];
  } catch {
    cart = [];
  }

  const cartCountEl = document.getElementById("cart-count");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");

  function saveAndRenderCart() {
    localStorage.setItem("spill_cart", JSON.stringify(cart));

    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (cartCountEl) cartCountEl.textContent = String(totalCount);
    if (cartTotalEl) {
      cartTotalEl.innerHTML = `<span style="white-space: nowrap; direction: ltr; unicode-bidi: isolate;">${totalPrice.toFixed(2)} ر.س</span>`;
    }

    if (cartDrawer) {
      cartDrawer.style.display = "flex";
      cartDrawer.style.flexDirection = "column";
      cartDrawer.style.maxHeight = "100vh";
      cartDrawer.style.overflow = "hidden";
    }

    if (cartItemsEl) {
      cartItemsEl.style.flex = "1 1 auto";
      cartItemsEl.style.overflowY = "auto";
      cartItemsEl.style.minHeight = "0";
      cartItemsEl.style.paddingBottom = "1rem";
    }

    if (!cartItemsEl) return;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = "<p>السلة فارغة حالياً.</p>";
      return;
    }

    cartItemsEl.innerHTML = cart
      .map(
        (item) => `
          <div class="cart-item" style="flex-shrink: 0;">
            <div class="cart-item-top" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem;">
              <span style="flex: 1; line-height: 1.5;">${item.name}</span>
              <span style="white-space: nowrap; font-weight: 800; direction: ltr; unicode-bidi: isolate;">${(item.price * item.qty).toFixed(2)} ر.س</span>
            </div>
            <div class="cart-item-controls" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
              <span style="white-space: nowrap; direction: ltr; unicode-bidi: isolate;">سعر الوحدة: ${item.price.toFixed(2)} ر.س</span>
              <div class="qty-actions" style="display: inline-flex; align-items: center; gap: 0.45rem; white-space: nowrap;">
                <button class="qty-btn" type="button" data-action="dec" data-id="${item.id}">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" type="button" data-action="inc" data-id="${item.id}">+</button>
              </div>
            </div>
          </div>
        `
      )
      .join("");
  }

  function addProductToCart(productId, selectedColor = "") {
    const product = findProductById(productId);
    if (!product || product.inStock === false) return;

    const cleanColor = String(selectedColor || "").trim();
    const cartEntryId = cleanColor ? `${product.id}__${cleanColor}` : product.id;
    const cartEntryName = cleanColor ? `${product.name} — ${cleanColor}` : product.name;

    const existing = cart.find((item) => item.id === cartEntryId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: cartEntryId,
        productId: product.id,
        color: cleanColor,
        name: cartEntryName,
        price: product.price,
        qty: 1
      });
    }

    saveAndRenderCart();
    showCartToast(cleanColor ? `تم إضافة (${cleanColor}) إلى السلة` : "تم إضافة منتجك بنجاح");
  }

  cartItemsEl?.addEventListener("click", (e) => {
    const btn = e.target.closest(".qty-btn");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    const target = cart.find((item) => item.id === id);
    if (!target) return;

    if (action === "inc") {
      target.qty += 1;
    } else if (action === "dec") {
      target.qty -= 1;
      if (target.qty <= 0) {
        cart = cart.filter((item) => item.id !== id);
      }
    }

    saveAndRenderCart();
  });

  const productDetailBox = document.getElementById("product-detail-box");
  if (productDetailBox) {
    document.body.style.opacity = "0";
    document.body.style.transform = "translateY(8px)";
    document.body.style.transition =
      "opacity 0.36s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)";

    productDetailBox.style.opacity = "0";
    productDetailBox.style.transform = "translateY(14px)";
    productDetailBox.style.transition =
      "opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";

    const productId = urlParams.get("id");
    const product = productId ? findProductById(productId) : null;
    const passedCat =
      urlParams.get("cat") ||
      sessionStorage.getItem("last_category_key") ||
      "all";
    const returnHref =
      passedCat && passedCat !== "all"
        ? `index.html?from=product&returnCategory=${encodeURIComponent(passedCat)}`
        : "index.html?from=product";

    if (backToStoreLink) {
      backToStoreLink.setAttribute("href", returnHref);
    }

    if (!product) {
      productDetailBox.innerHTML = `
        <p style="color: var(--muted-text); margin-bottom: 1rem;">لم يتم العثور على المنتج المطلوب.</p>
        <a href="${returnHref}" class="checkout-btn" style="display: inline-block; width: auto; padding: 0.65rem 1.25rem;">عودة</a>
      `;
      productDetailBox.querySelector("a")?.addEventListener("click", smoothReturnToCategory);
    } else {
      const isSoldOut = product.inStock === false;
      const hasDiscount = typeof product.oldPrice === "number" && product.oldPrice > product.price;
      const discountPct = hasDiscount
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;
      const productColors = normalizeProductColors(product);
      const hasColorChoices = productColors.length > 0;
      let chosenColor = "";

      document.title = `${product.name} — SPILL`;

      const colorsMarkup = hasColorChoices
        ? `
          <div style="margin: 0.45rem 0 0.2rem; padding: 0.85rem; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; font-size: 0.9rem;">
              <span style="font-weight: 800; color: var(--text-color);">اختر اللون:</span>
              <span id="selected-color-label" style="font-weight: 700; color: var(--muted-text);">لم يتم الاختيار بعد</span>
            </div>
            <div id="product-color-options" style="display: flex; flex-wrap: wrap; gap: 0.55rem;">
              ${productColors
                .map(
                  (c, idx) => `
                    <button
                      type="button"
                      class="color-choice-btn"
                      data-color-index="${idx}"
                      style="
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 0.9rem;
                        border-radius: 10px;
                        border: 1.5px solid var(--border-color);
                        background: var(--surface-color);
                        color: var(--text-color);
                        font-family: inherit;
                        font-size: 0.88rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s ease;
                      "
                    >
                      ${
                        c.swatch
                          ? `<span style="width: 14px; height: 14px; border-radius: 50%; background: ${c.swatch}; border: 1px solid rgba(0,0,0,0.22); flex-shrink: 0;"></span>`
                          : ""
                      }
                      <span>${c.name}</span>
                    </button>
                  `
                )
                .join("")}
            </div>
            <div id="color-choice-error" style="color: #c62828; font-size: 0.8rem; font-weight: 700; margin-top: 0.45rem; min-height: 1rem;"></div>
          </div>
        `
        : "";

      productDetailBox.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="width: 100%; max-width: 420px; margin: 0 auto; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-color);">
            <img
              id="detail-product-img"
              src="image-coffee/${product.imgBase}.jpeg"
              alt="${product.name}"
              style="width: 100%; height: 100%; object-fit: cover; display: block;"
              onerror="window.handleProductImgError(this, '${product.imgBase.replace(/'/g, "\\'")}')"
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${hasDiscount && !isSoldOut ? `<span class="badge-tag badge-discount" style="position: static;">خصم ${discountPct}%</span>` : ""}
              ${isSoldOut ? `<span class="badge-tag badge-soldout" style="position: static;">انتهت الكمية</span>` : ""}
            </div>

            <h2 style="font-size: 1.25rem; color: var(--text-color);">${product.name}</h2>
            <p class="product-type">${product.type}</p>

            <div class="price-box" style="margin: 0.25rem 0;">
              <span class="product-price" style="font-size: 1.15rem;">${product.price.toFixed(2)} ر.س</span>
              ${hasDiscount ? `<span class="product-old-price">${product.oldPrice.toFixed(2)} ر.س</span>` : ""}
            </div>

            <p class="product-desc" style="font-size: 0.92rem;">${product.description}</p>

            <ul class="product-specs" style="font-size: 0.86rem;">
              ${product.specs.map((spec) => `<li>• ${spec}</li>`).join("")}
            </ul>

            ${colorsMarkup}

            <button
              class="add-cart-btn"
              type="button"
              data-product-id="${product.id}"
              ${isSoldOut ? "disabled" : ""}
              style="margin-top: 0.35rem;"
            >
              ${isSoldOut ? "غير متوفر حالياً" : "أضف إلى السلة"}
            </button>
          </div>
        </div>
      `;

      const colorButtons = Array.from(productDetailBox.querySelectorAll(".color-choice-btn"));
      const selectedColorLabelEl = document.getElementById("selected-color-label");
      const colorChoiceErrorEl = document.getElementById("color-choice-error");
      const detailImgEl = document.getElementById("detail-product-img");

      colorButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-color-index"));
          const colorObj = productColors[idx];
          if (!colorObj) return;

          chosenColor = colorObj.name;
          if (selectedColorLabelEl) {
            selectedColorLabelEl.textContent = chosenColor;
            selectedColorLabelEl.style.color = "var(--accent-color, #9e6f0e)";
          }
          if (colorChoiceErrorEl) {
            colorChoiceErrorEl.textContent = "";
          }

          colorButtons.forEach((otherBtn) => {
            const isSelected = otherBtn === btn;
            otherBtn.style.borderColor = isSelected
              ? "var(--accent-color, #9e6f0e)"
              : "var(--border-color)";
            otherBtn.style.boxShadow = isSelected
              ? "0 0 0 2px rgba(158, 111, 14, 0.22)"
              : "none";
          });

          if (colorObj.imgBase && detailImgEl) {
            detailImgEl.dataset.fallbackStep = "0";
            detailImgEl.src = `image-coffee/${colorObj.imgBase}.jpeg`;
          }
        });
      });

      productDetailBox.querySelector(".add-cart-btn")?.addEventListener("click", () => {
        if (hasColorChoices && !chosenColor) {
          if (colorChoiceErrorEl) {
            colorChoiceErrorEl.textContent = "اختر اللون أولاً قبل الإضافة للسلة.";
          }
          showCartToast("اختر اللون أولاً قبل الإضافة للسلة", true);
          return;
        }
        addProductToCart(product.id, chosenColor);
      });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.style.opacity = "1";
        document.body.style.transform = "translateY(0)";
        productDetailBox.style.opacity = "1";
        productDetailBox.style.transform = "translateY(0)";
        setTimeout(() => {
          document.body.style.transform = "";
          productDetailBox.style.transform = "";
        }, 520);
      });
    });
  }

  const homeEditorial = document.getElementById("home-editorial-content");
  const offersTrack = document.getElementById("offers-track");
  const productsGrid = document.getElementById("products-grid");
  const categoryTitle = document.getElementById("current-category-title");
  const mainContainer = document.querySelector("main.container");

  document.getElementById("category-store-back-btn")?.remove();

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

  function buildOfferCardMarkup(offer) {
    return `
      <article class="offer-card" data-offer-product="${offer.productId}" style="cursor: pointer; flex-shrink: 0;">
        <div style="width: 100%; height: 150px; border-radius: 10px; overflow: hidden; margin-bottom: 0.75rem;">
          <img
            src="image-coffee/${offer.imgBase}.jpeg"
            alt="${offer.title}"
            style="width: 100%; height: 100%; object-fit: cover; display: block;"
            onerror="window.handleProductImgError(this, '${offer.imgBase.replace(/'/g, "\\'")}')"
          />
        </div>
        <h3>${offer.title}</h3>
        <p>${offer.desc}</p>
      </article>
    `;
  }

  function renderOffers() {
    if (!offersTrack) return;
    if (!Array.isArray(sampleOffers) || sampleOffers.length === 0) {
      offersTrack.innerHTML = "";
      singleLoopWidth = 0;
      return;
    }

    offersTrack.style.gap = "1rem";
    const loopItems = [...sampleOffers, ...sampleOffers];
    offersTrack.innerHTML = loopItems.map(buildOfferCardMarkup).join("");

    offersTrack.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", recalcLoopWidth, { once: true });
      img.addEventListener("error", recalcLoopWidth, { once: true });
    });

    recalcLoopWidth();
    requestAnimationFrame(() => {
      recalcLoopWidth();
      startOffersAutoScroll();
    });
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

  offersTrack?.addEventListener("click", (e) => {
    if (draggedMoved) return;
    const card = e.target.closest("[data-offer-product]");
    if (!card) return;
    const pid = card.getAttribute("data-offer-product");
    if (!pid) return;

    sessionStorage.setItem("skip_intro_once", "1");
    sessionStorage.setItem("last_category_key", "all");
    sessionStorage.removeItem("last_category_label");
    navigateSmoothly(`products.html?id=${encodeURIComponent(pid)}&cat=all`);
  });

  function renderCategoryProducts(category, labelText) {
    if (!productsGrid) return;
    const resolvedKey = resolveCategoryKey(category, labelText);
    const list = productsByCategory[resolvedKey] || [];

    if (list.length === 0) {
      productsGrid.innerHTML = `<p style="color: var(--muted-text);">سيتم عرض منتجات قسم (${labelText}) هنا عند إضافة المنتجات.</p>`;
      return;
    }

    productsGrid.innerHTML = list
      .map((item) => {
        const isSoldOut = item.inStock === false;
        const hasDiscount = typeof item.oldPrice === "number" && item.oldPrice > item.price;
        const discountPct = hasDiscount
          ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
          : 0;
        const detailUrl = `products.html?id=${encodeURIComponent(item.id)}&cat=${encodeURIComponent(resolvedKey)}`;

        return `
          <article class="product-card ${isSoldOut ? "is-sold-out" : ""}">
            <div class="badge-row">
              ${hasDiscount && !isSoldOut ? `<span class="badge-tag badge-discount">خصم ${discountPct}%</span>` : ""}
              ${isSoldOut ? `<span class="badge-tag badge-soldout">انتهت الكمية</span>` : ""}
            </div>
            <a href="${detailUrl}" data-product-link="${item.id}" data-product-cat="${resolvedKey}" class="product-img-wrap" style="display: block;">
              <img
                src="image-coffee/${item.imgBase}.jpeg"
                alt="${item.name}"
                onerror="window.handleProductImgError(this, '${item.imgBase.replace(/'/g, "\\'")}')"
              />
            </a>
            <div class="product-body">
              <a href="${detailUrl}" data-product-link="${item.id}" data-product-cat="${resolvedKey}" style="text-decoration: none;">
                <h3 class="product-title">${item.name}</h3>
              </a>
            </div>
            <div class="product-footer">
              <div class="price-box">
                <span class="product-price">${item.price.toFixed(2)} ر.س</span>
                ${hasDiscount ? `<span class="product-old-price">${item.oldPrice.toFixed(2)} ر.س</span>` : ""}
              </div>
              <button
                class="add-cart-btn"
                type="button"
                data-product-id="${item.id}"
                ${isSoldOut ? "disabled" : ""}
              >
                ${isSoldOut ? "غير متوفر حالياً" : "أضف إلى السلة"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  productsGrid?.addEventListener("click", (e) => {
    const productLink = e.target.closest("[data-product-link]");
    if (productLink) {
      e.preventDefault();
      const productId = productLink.getAttribute("data-product-link");
      const productCat = productLink.getAttribute("data-product-cat");
      if (productCat && productCat !== "all") {
        activeCategoryKey = productCat;
      }
      goToProductDetail(productId);
      return;
    }

    const btn = e.target.closest(".add-cart-btn");
    if (!btn || btn.disabled) return;
    const productId = btn.getAttribute("data-product-id");
    if (productId) addProductToCart(productId);
  });

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

  window.addEventListener("resize", recalcLoopWidth, { passive: true });

  function applyCategoryContent(category, finalLabel, resolvedKey) {
    if (category === "all" || resolvedKey === "all") {
      activeCategoryKey = "all";
      activeCategoryLabel = "العروض الحالية";
      if (homeEditorial) homeEditorial.hidden = false;
      if (categoryTitle) categoryTitle.textContent = "العروض الحالية";
      if (offersTrack) {
        offersTrack.hidden = false;
        offersTrack.style.display = "flex";
      }
      if (productsGrid) {
        productsGrid.hidden = true;
        productsGrid.style.display = "none";
        productsGrid.innerHTML = "";
      }
      renderOffers();
      startOffersAutoScroll();
    } else {
      activeCategoryKey = resolvedKey;
      activeCategoryLabel = finalLabel;
      if (homeEditorial) homeEditorial.hidden = true;
      if (categoryTitle) categoryTitle.textContent = finalLabel;
      stopOffersAutoScroll();
      if (offersTrack) {
        offersTrack.hidden = true;
        offersTrack.style.display = "none";
      }
      if (productsGrid) {
        productsGrid.hidden = false;
        productsGrid.style.display = "grid";
        renderCategoryProducts(resolvedKey, finalLabel);
      }
    }
  }

  function activateCategoryView(category, labelText, { smooth = false } = {}) {
    const resolvedKey = resolveCategoryKey(category, labelText);

    document.querySelectorAll(".category-link").forEach((el) => el.classList.remove("active"));
    const matched = findLinkLabelForCategory(resolvedKey);
    const finalLabel = (labelText || matched.text || resolvedKey).trim();

    if (matched.link) {
      matched.link.classList.add("active");
    }

    closeDrawer();

    if (smooth && mainContainer) {
      smoothSectionSwitch(mainContainer, () => {
        applyCategoryContent(category, finalLabel, resolvedKey);
      });
    } else {
      applyCategoryContent(category, finalLabel, resolvedKey);
    }
  }

  saveAndRenderCart();
  renderOffers();

  const returnCategoryParam =
    urlParams.get("returnCategory") ||
    (urlParams.get("from") === "product" ? sessionStorage.getItem("last_category_key") : null);

  if (returnCategoryParam && returnCategoryParam !== "all") {
    const savedLabel = sessionStorage.getItem("last_category_label") || "";
    sessionStorage.removeItem("last_category_key");
    sessionStorage.removeItem("last_category_label");
    activateCategoryView(returnCategoryParam, savedLabel, { smooth: false });
  } else {
    sessionStorage.removeItem("last_category_key");
    sessionStorage.removeItem("last_category_label");
    startOffersAutoScroll();
  }

  document.querySelectorAll(".category-link").forEach((link) => {
    link.addEventListener("click", () => {
      const category = link.getAttribute("data-category");
      const labelText = link.textContent.trim();
      activateCategoryView(category, labelText, { smooth: true });
    });
  });

  document.addEventListener("click", (e) => {
    const checkoutTrigger = e.target.closest("#checkout-btn, .checkout-btn, [data-checkout]");
    if (!checkoutTrigger) return;

    const hrefAttr = checkoutTrigger.getAttribute("href");
    if (hrefAttr && hrefAttr !== "#") {
      e.preventDefault();
      closeCart();
      closeDrawer();
      navigateSmoothly(hrefAttr);
      return;
    }

    if (checkoutTrigger.tagName === "BUTTON") {
      e.preventDefault();
      closeCart();
      closeDrawer();
      navigateSmoothly("checkout.html");
    }
  });
});
