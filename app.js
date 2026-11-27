document.addEventListener("DOMContentLoaded", () => {
  const productsByCategory = window.productsByCategory || {};
  const urlParams = new URLSearchParams(window.location.search);

  let activeCategoryKey = "all";
  let activeCategoryLabel = "العروض الحالية";
  let activeSortMode = "default";

  const currentSurface =
    getComputedStyle(document.documentElement).getPropertyValue("--surface-color").trim() ||
    "#fffdf2";
  document.documentElement.style.backgroundColor = currentSurface;
  document.body.style.backgroundColor = currentSurface;

  const isReturningFromProduct =
    urlParams.get("from") === "product" || Boolean(urlParams.get("returnCategory"));

  const transitionTarget =
    document.getElementById("product-detail-box") || document.querySelector("main.container");
  if (transitionTarget) {
    transitionTarget.style.backgroundColor = currentSurface;
    transitionTarget.classList.add("view-transition-shell", "view-transition-enter");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        transitionTarget.classList.remove("view-transition-enter");
        transitionTarget.classList.add("view-transition-active");
      });
    });
  }

  const cartDrawerEl = document.getElementById("cart-drawer");
  const cartOverlayEl = document.getElementById("cart-overlay");

  function openCartDrawer() {
    if (typeof window.UIControls?.openCart === "function") {
      window.UIControls.openCart();
    }
    if (cartOverlayEl) {
      cartOverlayEl.hidden = false;
      cartOverlayEl.classList.add("open", "active", "is-open", "show");
    }
    if (cartDrawerEl) {
      cartDrawerEl.classList.add("open", "active", "is-open", "show");
      cartDrawerEl.setAttribute("aria-hidden", "false");
    }
  }

  function closeCartDrawer() {
    if (typeof window.UIControls?.closeCart === "function") {
      window.UIControls.closeCart();
    }
    if (cartDrawerEl) {
      cartDrawerEl.classList.remove("open", "active", "is-open", "show");
      cartDrawerEl.setAttribute("aria-hidden", "true");
    }
    if (cartOverlayEl) {
      cartOverlayEl.classList.remove("open", "active", "is-open", "show");
      cartOverlayEl.hidden = true;
    }
  }

  function forceCloseDrawer() {
    window.UIControls?.closeDrawer?.();
    const drawerEl = document.getElementById("category-drawer");
    const overlayEl = document.getElementById("drawer-overlay");
    if (drawerEl) {
      drawerEl.classList.remove("open", "active", "is-open", "show");
      drawerEl.setAttribute("aria-hidden", "true");
    }
    if (overlayEl) {
      overlayEl.classList.remove("open", "active", "is-open", "show");
      overlayEl.hidden = true;
    }
  }

  document.getElementById("cart-toggle")?.addEventListener("click", (e) => {
    e.preventDefault();
    forceCloseDrawer();
    openCartDrawer();
  });

  document.getElementById("cart-close")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeCartDrawer();
  });

  cartOverlayEl?.addEventListener("click", (e) => {
    e.preventDefault();
    closeCartDrawer();
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
    closeCartDrawer();
    forceCloseDrawer();
    isNavigatingSmoothly = true;

    const surfaceNow =
      getComputedStyle(document.documentElement).getPropertyValue("--surface-color").trim() ||
      "#fffdf2";
    document.documentElement.style.backgroundColor = surfaceNow;
    document.body.style.backgroundColor = surfaceNow;

    const exitTarget =
      document.getElementById("product-detail-box") || document.querySelector("main.container");
    if (exitTarget) {
      exitTarget.style.backgroundColor = surfaceNow;
      exitTarget.classList.remove("view-transition-enter", "view-transition-active");
      exitTarget.classList.add("view-transition-shell", "view-transition-exit");
    }

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 180);
  }

  function smoothSectionSwitch(containerEl, updateFn) {
    if (!containerEl) {
      updateFn();
      return;
    }

    const surfaceNow =
      getComputedStyle(document.documentElement).getPropertyValue("--surface-color").trim() ||
      "#fffdf2";
    containerEl.style.backgroundColor = surfaceNow;
    containerEl.style.transition =
      "opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1), transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)";
    containerEl.style.opacity = "0";
    containerEl.style.transform = "translateY(8px)";

    setTimeout(() => {
      updateFn();
      requestAnimationFrame(() => {
        containerEl.style.opacity = "1";
        containerEl.style.transform = "translateY(0)";
        setTimeout(() => {
          containerEl.style.transform = "";
        }, 280);
      });
    }, 150);
  }

  function goToProductDetail(productId) {
    if (!productId || isNavigatingSmoothly) return;
    closeCartDrawer();
    forceCloseDrawer();

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
  const headerBackBtn = document.getElementById("cat-header-back-btn");

  function smoothReturnToCategory(e) {
    if (e) e.preventDefault();
    closeCartDrawer();
    forceCloseDrawer();

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
    if (!category || category === "all") return "all";
    if (category === "offers") return "offers";
    if (category === "featured") return "featured";
    if (Array.isArray(productsByCategory[category]) && productsByCategory[category].length > 0) {
      return category;
    }

    const aliases = {
      beans: ["beans", "coffee-crops"],
      "coffee-crops": ["coffee-crops", "beans"],
      "grinder-cleaning": ["grinder-cleaning", "cleaning-tools"],
      "cleaning-tools": ["cleaning-tools", "grinder-cleaning"],
      machines: ["machines", "machines-grinders"],
      "machines-grinders": ["machines-grinders", "machines"],
      servers: ["servers"]
    };

    if (aliases[category]) {
      for (const candidate of aliases[category]) {
        if (Array.isArray(productsByCategory[candidate]) && productsByCategory[candidate].length > 0) {
          return candidate;
        }
      }
    }

    const t = String(labelText || "").trim();
    if (t === "العروض") return "offers";
    if (t === "مختارات من المتجر" || t === "المختارات") return "featured";
    if (t === "محاصيل") return resolveCategoryKey("beans");
    if (t === "أظرف قهوة") return "drip-bags";
    if (t === "أقماع") return "drippers";
    if (t === "سيرفرات قهوة" || t === "سيرفرات") return "servers";
    if (t === "فلاتر") return "filters";
    if (t === "طواحين يدوية" || t === "مطاحن يدوية") return "manual-grinders";
    if (t === "طواحين كهربائية") return "electric-grinders";
    if (t === "أدوات تنظيف المطحنة") return resolveCategoryKey("grinder-cleaning");
    if (t === "أباريق يدوية") return "manual-kettles";
    if (t === "أباريق كهربائية") return "electric-kettles";
    if (t === "موازين") return "scales";
    if (t === "آلات قهوة") return resolveCategoryKey("machines");
    if (t === "أكواب") return "cups";
    if (t === "ملصقات") return "stickers";

    return category.trim();
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
      transition: opacity 0.26s ease, transform 0.28s ease, visibility 0.26s ease;
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
      toast.style.opacity = "1";
      toast.style.transform = "translate3d(-50%, 0, 0) scale(1)";
    });

    cartToastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate3d(-50%, -10px, 0) scale(0.98)";
      cartToastHideTimer = setTimeout(() => {
        toast.style.visibility = "hidden";
      }, 280);
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
    closeCartDrawer();
    forceCloseDrawer();

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
  }

  const homeEditorial = document.getElementById("home-editorial-content");
  const offersTrack = document.getElementById("offers-track");
  const productsGrid = document.getElementById("products-grid");
  const featuredGrid = document.getElementById("featured-products-grid");
  const homeStoreExtras = document.getElementById("home-store-extras");
  const categorySortBar = document.getElementById("category-sort-bar");
  const categoryTitle = document.getElementById("current-category-title");
  const mainContainer = document.querySelector("main.container");

  headerBackBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    activateCategoryView("all", "العروض الحالية", { smooth: true });
    mainContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  featuredGrid?.addEventListener("click", (e) => {
    if (window.StoreSections?.wasFeaturedDragged?.()) return;
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

  document.getElementById("featured-see-all-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    activateCategoryView("featured", "مختارات من المتجر", { smooth: true });
    mainContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  offersTrack?.addEventListener("click", (e) => {
    if (window.OffersCarousel?.wasDragged()) return;
    const card = e.target.closest("[data-offer-product]");
    if (!card) return;
    const pid = card.getAttribute("data-offer-product");
    if (!pid) return;

    sessionStorage.setItem("skip_intro_once", "1");
    sessionStorage.setItem("last_category_key", "all");
    sessionStorage.removeItem("last_category_label");
    navigateSmoothly(`products.html?id=${encodeURIComponent(pid)}&cat=all`);
  });

  document.querySelectorAll(".cat-sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSortMode = btn.getAttribute("data-sort") || "default";
      document.querySelectorAll(".cat-sort-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      window.StoreSections?.renderCategoryProducts(
        activeCategoryKey,
        activeCategoryLabel,
        activeSortMode
      );
    });
  });

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

  function applyCategoryContent(category, finalLabel, resolvedKey) {
    document.getElementById("instant-return-hide")?.remove();
    closeCartDrawer();
    forceCloseDrawer();

    if (category === "all" || resolvedKey === "all") {
      activeCategoryKey = "all";
      activeCategoryLabel = "العروض الحالية";
      activeSortMode = "default";

      if (headerBackBtn) {
        headerBackBtn.hidden = true;
      }
      if (homeEditorial) {
        homeEditorial.hidden = false;
        homeEditorial.style.display = "block";
      }
      if (homeStoreExtras) {
        homeStoreExtras.hidden = false;
        homeStoreExtras.style.display = "block";
      }
      if (categorySortBar) {
        categorySortBar.hidden = true;
        categorySortBar.style.display = "none";
      }
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
      window.StoreSections?.renderOffers();
      window.StoreSections?.renderFeaturedProducts();
      window.OffersCarousel?.startOffersAutoScroll();
    } else {
      activeCategoryKey = resolvedKey;
      activeCategoryLabel = finalLabel;
      activeSortMode = "default";
      window.StoreSections?.stopFeaturedAutoScroll();

      document.querySelectorAll(".cat-sort-btn").forEach((b) => {
        b.classList.toggle("is-active", b.getAttribute("data-sort") === "default");
      });

      if (headerBackBtn) {
        headerBackBtn.hidden = false;
      }
      if (homeEditorial) {
        homeEditorial.hidden = true;
        homeEditorial.style.display = "none";
      }
      if (homeStoreExtras) {
        homeStoreExtras.hidden = true;
        homeStoreExtras.style.display = "none";
      }
      if (categorySortBar) {
        categorySortBar.hidden = false;
        categorySortBar.style.display = "flex";
      }
      if (categoryTitle) categoryTitle.textContent = finalLabel;
      window.OffersCarousel?.stopOffersAutoScroll();
      if (offersTrack) {
        offersTrack.hidden = true;
        offersTrack.style.display = "none";
      }
      if (productsGrid) {
        productsGrid.hidden = false;
        productsGrid.style.display = "grid";
        window.StoreSections?.renderCategoryProducts(resolvedKey, finalLabel, activeSortMode);
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

    closeCartDrawer();
    forceCloseDrawer();

    if (smooth && mainContainer) {
      smoothSectionSwitch(mainContainer, () => {
        applyCategoryContent(category, finalLabel, resolvedKey);
      });
    } else {
      applyCategoryContent(category, finalLabel, resolvedKey);
    }
  }

  closeCartDrawer();
  saveAndRenderCart();
  window.StoreSections?.renderOffers();
  window.StoreSections?.renderFeaturedProducts();

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
    applyCategoryContent("all", "العروض الحالية", "all");
  }

  document.querySelectorAll(".category-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
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
      closeCartDrawer();
      forceCloseDrawer();
      navigateSmoothly(hrefAttr);
      return;
    }

    if (checkoutTrigger.tagName === "BUTTON") {
      e.preventDefault();
      closeCartDrawer();
      forceCloseDrawer();
      navigateSmoothly("checkout.html");
    }
  });
});
