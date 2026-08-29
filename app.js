/* ==========================================================================
   APP.JS — LÓGICA DEL SITIO. No necesitas tocar este archivo para
   agregar/quitar productos: eso se hace en config.js.
   ========================================================================== */
"use strict";

const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

/* ---- Validación defensiva de config.js (evita errores futuros silenciosos) ---- */
function validateConfig() {
  const ids = new Set();
  PRODUCTS.forEach((p) => {
    if (ids.has(p.id)) console.warn(`[SZAS] ID de producto duplicado: ${p.id}`);
    ids.add(p.id);
    if (!p.bundle && !CATEGORIES.includes(p.category)) {
      console.warn(`[SZAS] Categoría inválida "${p.category}" en producto "${p.id}". Usa una de: ${CATEGORIES.join(", ")}`);
    }
    if (p.bundle) {
      p.components.forEach((c) => {
        if (!PRODUCTS.find((x) => x.id === c.id)) {
          console.warn(`[SZAS] El conjunto "${p.id}" referencia un componente inexistente: ${c.id}`);
        }
      });
    }
  });
}

/* ---- Estado ---- */
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("szasCart") || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch (e) {
  console.warn("[SZAS] Carrito guardado dañado, se reinicia.", e);
  cart = [];
}
let currentProduct = null;
let qty = 1;
let bundleSelection = "full"; // "full" | id de un componente
let category = "TODO";
let selectedColor = null; // nombre del color elegido, si el producto tiene "colors"

function product(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function componentProduct(bundleProduct, componentId) {
  return product(componentId);
}

/* ---- Imagen con respaldo visual si no existe el archivo ---- */
function imageTag(src, alt) {
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" data-fallback-src="${escapeHtml(src)}">`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// Delegación de errores de imagen: evita el uso de onerror inline (frágil con comillas)
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.dataset.fallbackSrc && !img.dataset.fallbackHandled) {
      img.dataset.fallbackHandled = "1";
      const wrap = img.parentElement;
      wrap.innerHTML = `<div class="placeholder">COLOCA TU FOTO<br><br>${escapeHtml(img.dataset.fallbackSrc)}</div>`;
    }
  },
  true
);

/* ---- Filtros / catálogo ---- */
function filteredProducts() {
  return category === "TODO" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
}

function renderFilters() {
  $("filters").innerHTML = CATEGORIES.map(
    (c) => `<button class="filter${c === category ? " active" : ""}" data-cat="${c}" type="button">${c}</button>`
  ).join("");
}

function displayPrice(p) {
  return p.bundle ? p.bundlePrice : p.price;
}

function renderProducts() {
  const list = filteredProducts();
  $("products").innerHTML = list
    .map(
      (p, i) => `
    <article class="product" data-id="${p.id}" style="animation-delay:${i * 50}ms">
      <div class="product-img">${imageTag(p.images[0], p.name)}</div>
      <div class="product-info">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="product-cat">${p.category}</div>
        <div class="price">${money(displayPrice(p))}</div>
        <button class="product-cta" data-open-product="${p.id}" type="button">VER PRODUCTO</button>
      </div>
    </article>`
    )
    .join("");
  $("productCount").textContent = `${list.length} PRODUCTO${list.length === 1 ? "" : "S"}`;
  $("emptyState").hidden = list.length > 0;
}

function setCategory(c) {
  category = c;
  document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b.dataset.cat === c));
  renderProducts();
  $("productos").scrollIntoView({ behavior: "smooth" });
}

/* ---- Modal de producto ---- */
function sizeOptionsHtml() {
  return SIZES.map((s) => `<option value="${s}">${s}</option>`).join("");
}

/* Devuelve las fotos a mostrar: las del color elegido si el producto tiene "colors",
   o las fotos normales del producto si no tiene variantes de color. */
function currentImages() {
  const p = currentProduct;
  if (p.colors && p.colors.length) {
    const c = p.colors.find((x) => x.name === selectedColor);
    return (c && c.images && c.images.length) ? c.images : p.images;
  }
  return p.images;
}

function renderColorOptions() {
  const p = currentProduct;
  if (!p.colors || !p.colors.length) return;
  $("colorGrid").innerHTML = p.colors
    .map((c) => `<button type="button" class="color-option${c.name === selectedColor ? " active" : ""}" data-color="${escapeHtml(c.name)}">${escapeHtml(c.name)}</button>`)
    .join("");
  $("colorGrid").querySelectorAll("[data-color]").forEach((b) => {
    b.onclick = () => {
      selectedColor = b.dataset.color;
      renderColorOptions();
      drawGallery();
    };
  });
}

function openProduct(id) {
  currentProduct = product(id);
  if (!currentProduct) return;
  qty = 1;
  bundleSelection = "full";
  selectedColor = currentProduct.colors && currentProduct.colors.length ? currentProduct.colors[0].name : null;
  $("detailCategory").textContent = currentProduct.category;
  $("detailName").textContent = currentProduct.name;
  $("detailDescription").textContent = currentProduct.description || "";
  $("qty").textContent = "1";

  $("colorOptions").hidden = !currentProduct.colors;
  if (currentProduct.colors) renderColorOptions();

  drawGallery();

  if (currentProduct.bundle) {
    $("singleSizeField").hidden = true;
    $("bundleOptions").hidden = false;
    $("detailPrice").textContent = money(currentProduct.bundlePrice);
    setupBundleUI();
  } else {
    $("singleSizeField").hidden = false;
    $("bundleOptions").hidden = true;
    $("detailPrice").textContent = money(currentProduct.price);
    $("detailSize").innerHTML = sizeOptionsHtml();
    $("openGuide").hidden = !currentProduct.sizeGuide;
  }

  $("productModal").classList.add("open");
  $("modalBackdrop").classList.add("open");
  document.body.classList.add("no-scroll");
}

function drawGallery() {
  const p = currentProduct;
  const images = currentImages();
  $("mainPhoto").innerHTML = imageTag(images[0], p.name);
  $("thumbs").innerHTML = images
    .map((img, i) => `<button type="button" class="${i === 0 ? "active" : ""}" data-thumb="${i}">${imageTag(img, p.name)}</button>`)
    .join("");
  document.querySelectorAll("[data-thumb]").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll("[data-thumb]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      $("mainPhoto").innerHTML = imageTag(images[+b.dataset.thumb], p.name);
    };
  });
}

/* ---- Conjuntos (bundles) con tallas independientes por prenda ---- */
function setupBundleUI() {
  const p = currentProduct;
  const grid = $("bundleGrid");
  const options = [{ id: "full", label: "CONJUNTO COMPLETO", price: p.bundlePrice }].concat(
    p.components.map((c) => ({ id: c.id, label: `SOLO ${c.label}`, price: product(c.id).price }))
  );
  grid.innerHTML = options
    .map(
      (o) =>
        `<button type="button" class="bundle-option${o.id === bundleSelection ? " active" : ""}" data-bundle="${o.id}"><strong>${o.label}</strong><span>${money(o.price)}</span></button>`
    )
    .join("");
  grid.querySelectorAll("[data-bundle]").forEach((b) => {
    b.onclick = () => {
      bundleSelection = b.dataset.bundle;
      $("detailPrice").textContent = money(bundleSelection === "full" ? p.bundlePrice : product(bundleSelection).price);
      setupBundleUI();
    };
  });

  const sizesWrap = $("bundleFullSizes");
  if (bundleSelection === "full") {
    sizesWrap.style.display = "grid";
    sizesWrap.innerHTML = p.components
      .map(
        (c) =>
          `<div class="bundle-size-item"><label>${c.label}</label><select data-component-size="${c.id}">${sizeOptionsHtml()}</select></div>`
      )
      .join("");
  } else {
    // El cliente eligió comprar solo una prenda del conjunto: pedir su talla
    const comp = options.find((o) => o.id === bundleSelection);
    sizesWrap.style.display = "grid";
    sizesWrap.innerHTML = `<div class="bundle-size-item"><label>TALLA — ${comp.label}</label><select data-component-size="${bundleSelection}">${sizeOptionsHtml()}</select></div>`;
  }
}

function closeProduct() {
  $("productModal").classList.remove("open");
  $("modalBackdrop").classList.remove("open");
  document.body.classList.remove("no-scroll");
}

/* ---- Carrito ---- */
function persistCart() {
  localStorage.setItem("szasCart", JSON.stringify(cart));
  renderCart();
}

function cartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function addToCart(id, size, quantity, meta = {}) {
  const key = [id, size || "", meta.bundleMode || "", JSON.stringify(meta.componentSizes || {}), meta.color || ""].join("|");
  const existing = cart.find((i) => i.key === key);
  if (existing) existing.qty += quantity;
  else cart.push({ key, id, size: size || null, qty: quantity, ...meta });
  persistCart();
}

function addCurrentToCart(openCartAfter = true) {
  const p = currentProduct;
  if (p.bundle) {
    if (bundleSelection === "full") {
      const componentSizes = {};
      let missing = false;
      p.components.forEach((c) => {
        const sel = document.querySelector(`[data-component-size="${c.id}"]`);
        componentSizes[c.id] = sel ? sel.value : SIZES[0];
        if (!sel) missing = true;
      });
      addToCart(p.id, null, qty, { bundleMode: "full", componentSizes });
    } else {
      const comp = product(bundleSelection);
      const sel = document.querySelector(`[data-component-size="${bundleSelection}"]`);
      addToCart(comp.id, sel ? sel.value : SIZES[0], qty, { bundleMode: bundleSelection });
    }
  } else {
    addToCart(p.id, $("detailSize").value, qty, selectedColor ? { color: selectedColor } : {});
  }
  closeProduct();
  if (openCartAfter) openCart();
}

function cartLineLabel(item) {
  const p = product(item.id);
  if (item.bundleMode === "full") {
    const parts = Object.entries(item.componentSizes || {}).map(([cid, size]) => {
      const cp = product(cid);
      const label = (PRODUCTS.find((x) => x.bundle)?.components || []).find((c) => c.id === cid)?.label || cp.name;
      return `<p>${escapeHtml(label)} — ${escapeHtml(size)}</p>`;
    });
    return parts.join("");
  }
  const colorLine = item.color ? `<p>Color: ${escapeHtml(item.color)}</p>` : "";
  return `${colorLine}<p>Talla: ${escapeHtml(item.size || "—")}</p>`;
}

function cartLinePrice(item) {
  if (item.bundleMode === "full") {
    const bundleP = PRODUCTS.find((p) => p.bundle);
    return bundleP.bundlePrice;
  }
  return product(item.id).price;
}

function cartLineName(item) {
  if (item.bundleMode === "full") {
    const bundleP = PRODUCTS.find((p) => p.bundle);
    return bundleP.name;
  }
  return product(item.id).name;
}

function cartLineImage(item) {
  if (item.bundleMode === "full") {
    const bundleP = PRODUCTS.find((p) => p.bundle);
    return bundleP.images[0];
  }
  return product(item.id).images[0];
}

function renderCart() {
  $("cartCount").textContent = cartCount();
  const box = $("cartItems");
  if (!cart.length) {
    box.innerHTML = '<div class="cart-empty">TU CARRITO ESTÁ VACÍO.</div>';
    $("cartTotal").textContent = money(0);
    return;
  }
  let total = 0;
  box.innerHTML = cart
    .map((item, index) => {
      const lineTotal = cartLinePrice(item) * item.qty;
      total += lineTotal;
      return `
      <div class="cart-row">
        <div class="cart-row-img">${imageTag(cartLineImage(item), cartLineName(item))}</div>
        <div>
          <h4>${escapeHtml(cartLineName(item))}</h4>
          ${cartLineLabel(item)}
          <div class="cart-qty">
            <button type="button" data-qty-minus="${index}">−</button>
            <span>${item.qty}</span>
            <button type="button" data-qty-plus="${index}">+</button>
          </div>
          <p>${money(lineTotal)}</p>
        </div>
        <button class="remove" data-remove="${index}" type="button">ELIMINAR</button>
      </div>`;
    })
    .join("");
  $("cartTotal").textContent = money(total);

  document.querySelectorAll("[data-remove]").forEach((b) => (b.onclick = () => { cart.splice(+b.dataset.remove, 1); persistCart(); }));
  document.querySelectorAll("[data-qty-plus]").forEach((b) => (b.onclick = () => { cart[+b.dataset.qtyPlus].qty++; persistCart(); }));
  document.querySelectorAll("[data-qty-minus]").forEach((b) => (b.onclick = () => {
    const i = +b.dataset.qtyMinus;
    cart[i].qty--;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    persistCart();
  }));
}

function openCart() {
  $("cart").classList.add("open");
  $("overlay").classList.add("open");
  renderCart();
}
function closeCart() {
  $("cart").classList.remove("open");
  $("overlay").classList.remove("open");
}
function clearCart() {
  if (!cart.length) return;
  if (confirm("¿Vaciar todo el carrito?")) {
    cart = [];
    persistCart();
  }
}

/* ---- Guía de tallas: solo la(s) relevante(s) al producto abierto ---- */
function relevantGuides() {
  const p = currentProduct;
  if (!p) return [];
  if (p.bundle) {
    return p.components
      .map((c) => product(c.id).sizeGuide)
      .filter(Boolean)
      .filter((g, i, arr) => arr.indexOf(g) === i);
  }
  return p.sizeGuide ? [p.sizeGuide] : [];
}

function openGuide(preferred) {
  const guides = relevantGuides();
  if (!guides.length) return;
  const type = preferred && guides.includes(preferred) ? preferred : guides[0];
  const g = SIZE_GUIDES[type];
  if (!g) return;
  $("guideTitle").textContent = g.title;
  $("guideTabs").innerHTML =
    guides.length > 1
      ? guides.map((k) => `<button type="button" class="guide-tab ${k === type ? "active" : ""}" data-guide="${k}">${SIZE_GUIDES[k].title.replace("GUÍA DE TALLAS — ", "")}</button>`).join("")
      : "";
  $("guideContent").innerHTML = `<table class="guide-table"><thead><tr>${g.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${g.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  document.querySelectorAll("[data-guide]").forEach((b) => (b.onclick = () => openGuide(b.dataset.guide)));
  $("guideModal").classList.add("open");
  $("modalBackdrop").classList.add("open");
  document.body.classList.add("no-scroll");
}
function closeGuide() {
  $("guideModal").classList.remove("open");
  $("modalBackdrop").classList.remove("open");
  document.body.classList.remove("no-scroll");
}

/* ---- Checkout / WhatsApp ---- */
function cartTotalValue() {
  return cart.reduce((s, i) => s + cartLinePrice(i) * i.qty, 0);
}

function openCheckout() {
  if (!cart.length) return;
  $("checkoutSummary").innerHTML =
    cart
      .map((i) => {
        const detail = i.bundleMode === "full"
          ? Object.entries(i.componentSizes || {})
              .map(([cid, size]) => `${escapeHtml(product(cid).name)} — ${escapeHtml(size)}`)
              .join(" / ")
          : `${i.color ? `Color: ${escapeHtml(i.color)} · ` : ""}Talla: ${escapeHtml(i.size || "—")}`;
        return `<div class="checkout-line">
          <strong>${escapeHtml(cartLineName(i))}</strong>
          <span>${detail}</span>
          <span>x${i.qty} · ${money(cartLinePrice(i) * i.qty)}</span>
        </div>`;
      })
      .join("") + `<div class="checkout-total"><strong>TOTAL</strong><strong>${money(cartTotalValue())}</strong></div>`;
  $("checkoutModal").classList.add("open");
  $("modalBackdrop").classList.add("open");
  document.body.classList.add("no-scroll");
}
function closeCheckout() {
  $("checkoutModal").classList.remove("open");
  $("modalBackdrop").classList.remove("open");
  document.body.classList.remove("no-scroll");
}

function submitOrder(e) {
  e.preventDefault();
  const name = $("customerName").value.trim();
  const phone = $("customerPhone").value.trim();
  const email = $("customerEmail").value.trim();
  const department = $("customerDepartment").value.trim();
  const city = $("customerCity").value.trim();
  const neighborhood = $("customerNeighborhood").value.trim();
  const postalCode = $("customerPostalCode").value.trim();
  const roadType = $("customerRoadType").value.trim();
  const addressNumber = $("customerAddressNumber").value.trim();
  const unit = $("customerUnit").value.trim();
  const tower = $("customerTower").value.trim();
  const notes = $("customerNotes").value.trim();

  const lines = cart
    .map((i) => {
      const sizeText = i.bundleMode === "full"
        ? Object.entries(i.componentSizes || {}).map(([cid, size]) => `${product(cid).name} ${size}`).join(" / ")
        : `${i.color ? i.color + " — " : ""}Talla ${i.size}`;
      return `• ${cartLineName(i)} — ${sizeText} — x${i.qty} — ${money(cartLinePrice(i) * i.qty)}`;
    })
    .join("\n");

  const addressLine = `${roadType} ${addressNumber}${unit ? `, ${unit}` : ""}${tower ? `, ${tower}` : ""}`;
  const text =
    `Hola SZAS, quiero realizar este pedido:\n\n${lines}\n\nTOTAL: ${money(cartTotalValue())}\n\n` +
    `DATOS DEL CLIENTE\nNombre: ${name}\nWhatsApp: ${phone}` +
    (email ? `\nCorreo: ${email}` : "") +
    `\n\nDIRECCIÓN DE ENTREGA\nDepartamento: ${department}\nCiudad / municipio: ${city}\nBarrio: ${neighborhood}` +
    (postalCode ? `\nCódigo postal: ${postalCode}` : "") +
    `\nDirección: ${addressLine}` +
    (notes ? `\nIndicaciones: ${notes}` : "");

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
}

/* ---- Menú móvil ---- */
function toggleMobileNav() {
  $("navLinks").classList.toggle("open");
}

/* ---- Eventos globales ---- */
function bindEvents() {
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open-product]");
    if (openBtn) openProduct(openBtn.dataset.openProduct);
    const filterBtn = e.target.closest("[data-cat]");
    if (filterBtn) setCategory(filterBtn.dataset.cat);
  });

  $("openCart").onclick = openCart;
  $("closeCart").onclick = closeCart;
  $("overlay").onclick = closeCart;
  $("clearCart").onclick = clearCart;

  $("modalBackdrop").onclick = () => { closeProduct(); closeGuide(); closeCheckout(); };
  $("closeProduct").onclick = closeProduct;
  $("closeGuide").onclick = closeGuide;
  $("closeCheckout").onclick = closeCheckout;

  $("openGuide").onclick = () => openGuide();
  $("addDetail").onclick = () => addCurrentToCart(true);
  $("buyNow").onclick = () => {
    addCurrentToCart(false);
    openCheckout();
  };

  $("minus").onclick = () => { if (qty > 1) { qty--; $("qty").textContent = qty; } };
  $("plus").onclick = () => { qty++; $("qty").textContent = qty; };

  $("checkout").onclick = openCheckout;
  $("checkoutForm").onsubmit = submitOrder;

  $("mobileMenuBtn").onclick = toggleMobileNav;
}

/* ---- Redes sociales ---- */
function setupSocialLinks() {
  if (typeof SOCIAL_LINKS === "undefined") return;
  [
    ["instagramLink", SOCIAL_LINKS.instagram],
    ["tiktokLink", SOCIAL_LINKS.tiktok],
    ["whatsappLink", SOCIAL_LINKS.whatsapp],
    ["footerInstagram", SOCIAL_LINKS.instagram],
    ["footerTikTok", SOCIAL_LINKS.tiktok],
    ["footerWhatsApp", SOCIAL_LINKS.whatsapp]
  ].forEach(([id, url]) => {
    const el = $(id);
    if (el && url) el.href = url;
  });
}

/* ---- Init ---- */
function init() {
  validateConfig();
  renderFilters();
  renderProducts();
  renderCart();
  setupSocialLinks();
  bindEvents();
}
document.addEventListener("DOMContentLoaded", init);
