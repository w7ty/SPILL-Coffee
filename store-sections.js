document.addEventListener("DOMContentLoaded", () => {
  const productsByCategory = window.productsByCategory || {};
  const sampleOffers = window.sampleOffers || [];

  const offersTrack = document.getElementById("offers-track");
  const productsGrid = document.getElementById("products-grid");
  const featuredGrid = document.getElementById("featured-products-grid");
  const homeStoreExtras = document.getElementById("home-store-extras");

  function getCompactMeta(item) {
    const rawType = String(item.type || "");
    const weightMatch = rawType.match(/الوزن:\s*([^—\n]+)/);
    if (weightMatch) return weightMatch[1].trim();
    if (rawType.includes("التصنيف الفرعي:")) {
      return rawType.split("التصنيف الفرعي:")[1].trim();
    }
    return "";
  }

  function buildProductCardHtml(item, resolvedKey) {
    const isSoldOut = item.inStock === false;
    const hasDiscount = typeof item.oldPrice === "number" && item.oldPrice > item.price;
    const discountPct = hasDiscount
      ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
      : 0;
    const detailUrl = `products.html?id=${encodeURIComponent(item.id)}&cat=${encodeURIComponent(resolvedKey)}`;
    const compactMeta = getCompactMeta(item);

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
          ${compactMeta ? `<span class="product-meta-line">${compactMeta}</span>` : ""}
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
  }

  // حتى 7 منتجات كحد أقصى لشريط وقسم العروض
  function getOfferProductsList(limit = 7) {
    const allEntries = Object.entries(productsByCategory).flatMap(([catKey, items]) =>
      Array.isArray(items) ? items.map((item) => ({ item, catKey })) : []
    );

    const byId = new Map(allEntries.map(({ item, catKey }) => [String(item.id), { item, catKey }]));
    const result = [];
    const seenIds = new Set();

    (Array.isArray(sampleOffers) ? sampleOffers : []).forEach((offer) => {
      const pid = String(offer?.productId || "").trim();
      if (result.length < limit && pid && byId.has(pid) && !seenIds.has(pid)) {
        seenIds.add(pid);
        result.push(byId.get(pid));
      }
    });

    allEntries.forEach(({ item, catKey }) => {
      const pid = String(item.id || "").trim();
      const hasDiscount = typeof item.oldPrice === "number" && item.oldPrice > item.price;
      if (result.length < limit && pid && hasDiscount && !seenIds.has(pid)) {
        seenIds.add(pid);
        result.push({ item, catKey });
      }
    });

    allEntries.forEach(({ item, catKey }) => {
      const pid = String(item.id || "").trim();
      if (result.length < limit && pid && item.inStock !== false && !seenIds.has(pid)) {
        seenIds.add(pid);
        result.push({ item, catKey });
      }
    });

    return result.slice(0, limit);
  }

  // حتى 7 منتجات كحد أقصى للمختارات (غير مكررة مع العروض)
  function getFeaturedProductsList(limit = 7) {
    const offerIds = new Set(getOfferProductsList(limit).map(({ item }) => String(item.id)));
    const categoryBuckets = Object.entries(productsByCategory)
      .map(([catKey, items]) =>
        Array.isArray(items)
          ? items
              .filter((item) => item.inStock !== false && !offerIds.has(String(item.id)))
              .map((item) => ({ item, catKey }))
          : []
      )
      .filter((bucket) => bucket.length > 0);

    const mixed = [];
    const seen = new Set();
    let round = 0;

    while (mixed.length < limit && categoryBuckets.some((b) => round < b.length)) {
      for (const bucket of categoryBuckets) {
        if (round < bucket.length && mixed.length < limit) {
          const entry = bucket[round];
          const pid = String(entry.item.id);
          if (!seen.has(pid)) {
            seen.add(pid);
            mixed.push(entry);
          }
        }
      }
      round += 1;
    }

    if (mixed.length < limit) {
      Object.entries(productsByCategory).forEach(([catKey, items]) => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          const pid = String(item.id);
          if (mixed.length < limit && item.inStock !== false && !seen.has(pid)) {
            seen.add(pid);
            mixed.push({ item, catKey });
          }
        });
      });
    }

    return mixed.slice(0, limit);
  }

  let featuredAutoTimer = null;
  let featuredResumeTimer = null;
  let isDraggingFeatured = false;
  let featuredDraggedMoved = false;
  let featuredDragStartX = 0;
  let featuredDragStartScrollLeft = 0;
  let featuredLoopWidth = 0;
  let featuredDir = -1;

  function recalcFeaturedLoopWidth() {
    if (!featuredGrid) return;
    featuredLoopWidth = Math.floor(featuredGrid.scrollWidth / 2);
  }

  function wrapFeaturedScroll() {
    if (!featuredGrid || featuredLoopWidth <= 0) return;
    const pos = featuredGrid.scrollLeft;
    if (pos < 0) {
      const absPos = Math.abs(pos);
      if (absPos >= featuredLoopWidth) {
        featuredGrid.scrollLeft = -(absPos % featuredLoopWidth);
      }
    } else if (pos >= featuredLoopWidth) {
      featuredGrid.scrollLeft = pos % featuredLoopWidth;
    }
  }

  function stopFeaturedAutoScroll() {
    if (featuredAutoTimer) {
      clearInterval(featuredAutoTimer);
      featuredAutoTimer = null;
    }
  }

  function startFeaturedAutoScroll() {
    stopFeaturedAutoScroll();
    if (!featuredGrid || homeStoreExtras?.hidden) return;
    recalcFeaturedLoopWidth();

    featuredAutoTimer = setInterval(() => {
      if (!featuredGrid || homeStoreExtras?.hidden || isDraggingFeatured) return;
      if (featuredLoopWidth <= 0) recalcFeaturedLoopWidth();
      if (featuredLoopWidth <= 0) return;
      featuredGrid.scrollLeft += featuredDir * 1;
      wrapFeaturedScroll();
    }, 20);
  }

  featuredGrid?.addEventListener("pointerdown", (e) => {
    if (!featuredGrid) return;
    isDraggingFeatured = true;
    featuredDraggedMoved = false;
    clearTimeout(featuredResumeTimer);
    featuredDragStartX = e.clientX;
    featuredDragStartScrollLeft = featuredGrid.scrollLeft;
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDraggingFeatured || !featuredGrid) return;
    const dx = e.clientX - featuredDragStartX;
    if (Math.abs(dx) > 5) featuredDraggedMoved = true;
    if (dx < -2) featuredDir = -1;
    else if (dx > 2) featuredDir = 1;
    featuredGrid.scrollLeft = featuredDragStartScrollLeft - dx;
    wrapFeaturedScroll();
  });

  function finishFeaturedDrag() {
    if (!isDraggingFeatured) return;
    isDraggingFeatured = false;
    clearTimeout(featuredResumeTimer);
    featuredResumeTimer = setTimeout(() => {
      featuredDraggedMoved = false;
    }, 60);
  }

  window.addEventListener("pointerup", finishFeaturedDrag);
  window.addEventListener("pointercancel", finishFeaturedDrag);
  window.addEventListener("resize", recalcFeaturedLoopWidth, { passive: true });

  function renderFeaturedProducts() {
    if (!featuredGrid) return;
    featuredGrid.className = "featured-marquee-track";

    const mixed = getFeaturedProductsList(7);
    if (mixed.length === 0) {
      featuredGrid.innerHTML = "";
      stopFeaturedAutoScroll();
      return;
    }

    const loopCards = [...mixed, ...mixed];
    featuredGrid.innerHTML = loopCards
      .map(({ item, catKey }) => buildProductCardHtml(item, catKey))
      .join("");

    featuredGrid.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", recalcFeaturedLoopWidth, { once: true });
      img.addEventListener("error", recalcFeaturedLoopWidth, { once: true });
    });

    recalcFeaturedLoopWidth();
    requestAnimationFrame(() => {
      recalcFeaturedLoopWidth();
      startFeaturedAutoScroll();
    });
  }

  function buildOfferCardMarkup(offer) {
    return `
      <article class="offer-card" data-offer-product="${offer.productId}" style="cursor: pointer; flex-shrink: 0;">
        <div style="width: 100%; height: 135px; border-radius: 10px; overflow: hidden; margin-bottom: 0.65rem;">
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

    const offerEntries = getOfferProductsList(7);
    const baseOffers = offerEntries.map(({ item, catKey }) => {
      const matchedOffer = (Array.isArray(sampleOffers) ? sampleOffers : []).find(
        (o) => String(o.productId) === String(item.id)
      );
      return (
        matchedOffer || {
          productId: item.id,
          category: catKey,
          title: item.name,
          desc: item.type || `${item.price.toFixed(2)} ر.س`,
          imgBase: item.imgBase
        }
      );
    });

    if (baseOffers.length === 0) {
      offersTrack.innerHTML = "";
      window.OffersCarousel?.recalcLoopWidth();
      return;
    }

    offersTrack.style.gap = "1rem";
    const loopItems = [...baseOffers, ...baseOffers];
    offersTrack.innerHTML = loopItems.map(buildOfferCardMarkup).join("");

    offersTrack.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", () => window.OffersCarousel?.recalcLoopWidth(), { once: true });
      img.addEventListener("error", () => window.OffersCarousel?.recalcLoopWidth(), { once: true });
    });

    window.OffersCarousel?.recalcLoopWidth();
    requestAnimationFrame(() => {
      window.OffersCarousel?.recalcLoopWidth();
      window.OffersCarousel?.startOffersAutoScroll();
    });
  }

  function renderCategoryProducts(resolvedKey, labelText, sortMode = "default") {
    if (!productsGrid) return;

    let entries = [];
    if (resolvedKey === "offers") {
      entries = getOfferProductsList(7);
    } else if (resolvedKey === "featured") {
      entries = getFeaturedProductsList(7);
    } else {
      entries = (productsByCategory[resolvedKey] || []).map((item) => ({
        item,
        catKey: resolvedKey
      }));
    }

    if (entries.length === 0) {
      productsGrid.innerHTML = `<p style="color: var(--muted-text);">سيتم عرض منتجات قسم (${labelText}) هنا عند إضافة المنتجات.</p>`;
      return;
    }

    let list = [...entries];
    if (sortMode === "in-stock") {
      list = list.filter(({ item }) => item.inStock !== false);
    } else if (sortMode === "price-asc") {
      list.sort((a, b) => Number(a.item.price || 0) - Number(b.item.price || 0));
    }

    if (list.length === 0) {
      productsGrid.innerHTML = `<p style="color: var(--muted-text);">لا توجد منتجات متوفرة حالياً بهذا الترتيب.</p>`;
      return;
    }

    productsGrid.innerHTML = list
      .map(({ item, catKey }) => buildProductCardHtml(item, catKey))
      .join("");
  }

  window.StoreSections = {
    buildProductCardHtml,
    renderFeaturedProducts,
    startFeaturedAutoScroll,
    stopFeaturedAutoScroll,
    renderOffers,
    renderCategoryProducts,
    wasFeaturedDragged: () => featuredDraggedMoved
  };
});