let products = [];
let productsReady = false;

fetch("/data/products.json")
  .then(res => res.json())
  .then(data => {
    products = data.products;
    productsReady = true;
  })
  .catch(err => console.error("Failed to load product data:", err));

function waitForProducts() {
  return new Promise(resolve => {
    if (productsReady) return resolve();
    const interval = setInterval(() => {
      if (productsReady) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

export function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

export function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  renderCartDropdown();
}

function flashState(button, tempHTML, restoreHTML) {
  button.disabled = true;
  button.innerHTML = tempHTML;
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = restoreHTML;
  }, 1200);
}

export async function addToCart(id, quantity = 1) {
  await waitForProducts();

  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  const product = products.find(p => p.id === id);

  if (!product) {
    alert("Product not found.");
    return;
  }

  const maxQty = product.quantity || 1;
  const btn = document.querySelector(`button[onclick="addToCart('${id}', 1)"]`);
  const originalHTML = `<i class="bi bi-cart-plus me-2"></i> Add to Cart`;

  if (existing) {
    if (btn) {
      flashState(
        btn,
        `<i class="bi bi-x-circle-fill me-2 text-danger"></i> Already in Cart`,
        originalHTML
      );
    }
    existing.quantity = maxQty;
    saveCart(cart);
    return;
  }

  cart.push({
    id,
    quantity: maxQty,
    name: product.name || "Unnamed Product",
    image: product.image || "/media/placeholder.png",
    price: product.price || 0
  });

  saveCart(cart);

  if (btn) {
    flashState(
      btn,
      `<i class="bi bi-check-circle-fill me-2 text-success"></i> Added to Cart!`,
      originalHTML
    );
  }
}

export async function overlayAddToCart(id) {
  await waitForProducts();

  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  const icon = document.querySelector(`.overlay-cart-btn[onclick*="${id}"] i`);

  if (existing) {
    if (icon) {
      const original = icon.className;
      icon.className = "bi bi-x-circle-fill text-danger";
      setTimeout(() => (icon.className = original), 900);
    }
    return;
  }

  await addToCart(id, 1);

  if (icon) {
    const original = icon.className;
    icon.className = "bi bi-check-circle-fill text-success";
    setTimeout(() => (icon.className = original), 900);
  }
}

export function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const badge = document.getElementById("cart-count");
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }
}

async function doCheckout(items) {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items })
  });

  const data = await res.json();

  if (res.status === 409 && data.soldOut) {
    alert(`Sorry — ${data.error} It has been removed from your cart.`);
    // Remove the sold-out item(s) from cart
    const cart = getCart().filter(item => !items.find(i => i.id === item.id && data.error.includes(item.name)));
    // Simpler: remove all items that triggered the 409 (re-attempt will catch next one)
    const soldOutName = data.error.replace(/" is no longer available\.$/, '').replace(/^"/, '');
    const newCart = getCart().filter(item => item.name !== soldOutName);
    saveCart(newCart);
    return;
  }

  if (data.url) {
    window.location = data.url;
  } else {
    alert("Checkout failed. Please try again.");
  }
}

export async function instantCheckout(id) {
  await waitForProducts();

  const product = products.find(p => p.id === id);
  if (!product) {
    alert("Product not found.");
    return;
  }

  const btn = document.querySelector(`button[onclick="instantCheckout('${id}')"]`);
  if (btn) {
    flashState(
      btn,
      `<i class="bi bi-lightning-fill me-2"></i> Redirecting…`,
      `<i class="bi bi-lightning-fill me-2"></i> Buy Now`
    );
  }

  await doCheckout([{ id, quantity: 1 }]);
}

export function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
}

export function renderCartDropdown() {
  const cart = getCart();
  const container = document.getElementById("cart-dropdown-content");
  if (!container) return;

  const checkoutBtn = document.getElementById("dropdown-checkout");
  const divider = document.querySelector(".dropdown-divider");

  if (cart.length === 0) {
    container.innerHTML = `<p class="text-center text-muted mb-0">Cart is empty</p>`;
    if (checkoutBtn) checkoutBtn.classList.add("d-none");
    if (divider) divider.classList.add("d-none");
    return;
  }

  if (checkoutBtn) checkoutBtn.classList.remove("d-none");
  if (divider) divider.classList.remove("d-none");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  container.innerHTML =
    cart
      .map(
        item => `
        <div class="d-flex align-items-center mb-2">
          <div class="rounded me-2" style="width:40px;height:40px;object-fit:cover;">
            <img src="${item.image}" alt="${item.name}" class="rounded" style="width:40px;height:40px;object-fit:cover;">
          </div>

          <div class="flex-grow-1">
            <div class="fw-semibold">${item.name}</div>
            <small class="text-muted">Qty: ${item.quantity}</small>
          </div>

          <button 
            type="button"
            class="btn-close ms-2"
            aria-label="Remove"
            onclick="event.stopPropagation(); removeFromCart('${item.id}')"
          ></button>
        </div>
      `
      )
      .join("") +
    `
      <div class="d-flex justify-content-between border-top pt-2 mt-2">
        <strong>Total:</strong>
        <strong>$${(total / 100).toFixed(2)}</strong>
      </div>
    `;
}

async function applySoldOutState() {
  await waitForProducts();

  const path = window.location.pathname;
  const match = path.match(/\/products\/([^\/]+)$/);
  if (!match) return;

  const productId = match[1];
  const product = products.find(p => p.id === productId);
  if (!product || !product.soldOut) return;

  const addBtn = document.querySelector("button[onclick^=\"addToCart\"]");
  const buyBtn = document.querySelector("button[onclick^=\"instantCheckout\"]");

  if (addBtn) {
    addBtn.disabled = true;
    addBtn.classList.add("btn-secondary");
    addBtn.classList.remove("btn-primary");
    addBtn.innerHTML = `<i class="bi bi-x-circle me-2"></i> Sold Out`;
  }

  if (buyBtn) {
    buyBtn.disabled = true;
    buyBtn.classList.add("btn-secondary");
    buyBtn.classList.remove("btn-success");
    buyBtn.innerHTML = `<i class="bi bi-x-circle me-2"></i> Unavailable`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCartDropdown();
  applySoldOutState();

  const checkoutBtn = document.getElementById("dropdown-checkout");
  if (checkoutBtn) {
    checkoutBtn.innerHTML = `Checkout <i class="bi bi-box-arrow-up-right ms-2"></i>`;
    checkoutBtn.addEventListener("click", async () => {
      const cart = getCart();
      if (cart.length === 0) return;

      await doCheckout(cart);
    });
  }
});

window.addToCart = addToCart;
window.instantCheckout = instantCheckout;
window.updateCartBadge = updateCartBadge;
window.removeFromCart = removeFromCart;
window.overlayAddToCart = overlayAddToCart;