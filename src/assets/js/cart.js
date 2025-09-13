class ShoppingCart {
  constructor() {
    this.items = this.loadCart();
    this.init();
  }

  init() {
    this.updateCartUI();
    this.setupEventListeners();
    this.setupCartSidebar();
  }

  loadCart() {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.items));
      this.updateCartUI();
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image,
        quantity: quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    this.saveCart();
    this.showNotification(`${product.name} añadido al carrito`, 'success');
    this.trackEvent('add_to_cart', {
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: quantity
    });
  }

  removeItem(productId) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      this.items = this.items.filter(item => item.id !== productId);
      this.saveCart();
      this.showNotification(`${item.name} eliminado del carrito`, 'info');
      this.trackEvent('remove_from_cart', {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      });
    }
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = parseInt(quantity);
        this.saveCart();
      }
    }
  }

  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getSubtotal() {
    return this.getTotalPrice();
  }

  getShippingCost() {
    const subtotal = this.getSubtotal();
    const freeShippingThreshold = 50; // This should come from site config
    return subtotal >= freeShippingThreshold ? 0 : 5.95;
  }

  getTax() {
    const taxRate = 0.21; // 21% IVA in Spain
    return this.getSubtotal() * taxRate;
  }

  getTotal() {
    return this.getSubtotal() + this.getShippingCost() + this.getTax();
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    this.showNotification('Carrito vaciado', 'info');
  }

  updateCartUI() {
    this.updateCartCount();
    this.updateCartSidebar();
    this.updateCartPage();
  }

  updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count, .cart-count');
    const totalItems = this.getTotalItems();
    
    cartCountElements.forEach(element => {
      element.textContent = totalItems;
      element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
  }

  updateCartSidebar() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cartItems) {
      if (this.items.length === 0) {
        cartItems.innerHTML = `
          <div class="cart-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5.4M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6"/>
            </svg>
            <p>Tu carrito está vacío</p>
            <a href="/shop/" class="btn btn-primary">Ir a la tienda</a>
          </div>
        `;
      } else {
        cartItems.innerHTML = this.items.map(item => `
          <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item__image">
              <img src="${item.image}" alt="${item.name}" width="60" height="60">
            </div>
            <div class="cart-item__details">
              <h4 class="cart-item__name">${item.name}</h4>
              <div class="cart-item__controls">
                <div class="quantity-controls">
                  <button class="quantity-btn" data-action="decrease" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                  <span class="quantity-display">${item.quantity}</span>
                  <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item__price">€${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            </div>
            <button class="cart-item__remove" data-id="${item.id}" aria-label="Eliminar ${item.name}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        `).join('');
      }
    }

    if (cartTotal) {
      cartTotal.textContent = `€${this.getTotalPrice().toFixed(2)}`;
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = this.items.length === 0;
    }
  }

  updateCartPage() {
    const cartPageContainer = document.querySelector('.cart-page-items');
    if (!cartPageContainer) return;

    if (this.items.length === 0) {
      cartPageContainer.innerHTML = `
        <div class="empty-cart">
          <h2>Tu carrito está vacío</h2>
          <p>¡Descubre nuestros productos y añade algunos al carrito!</p>
          <a href="/shop/" class="btn btn-primary">Explorar tienda</a>
        </div>
      `;
      return;
    }

    cartPageContainer.innerHTML = `
      <div class="cart-items-list">
        ${this.items.map(item => `
          <div class="cart-page-item" data-item-id="${item.id}">
            <div class="item-image">
              <img src="${item.image}" alt="${item.name}" width="100" height="100">
            </div>
            <div class="item-details">
              <h3 class="item-name">${item.name}</h3>
              <p class="item-price">€${item.price.toFixed(2)}</p>
            </div>
            <div class="item-quantity">
              <label for="quantity-${item.id}">Cantidad:</label>
              <div class="quantity-controls">
                <button class="quantity-btn" data-action="decrease" data-id="${item.id}">−</button>
                <input type="number" id="quantity-${item.id}" value="${item.quantity}" min="1" max="99" data-id="${item.id}" class="quantity-input">
                <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
              </div>
            </div>
            <div class="item-total">
              €${(item.price * item.quantity).toFixed(2)}
            </div>
            <div class="item-actions">
              <button class="btn-icon cart-item__remove" data-id="${item.id}" aria-label="Eliminar ${item.name}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="cart-summary">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>€${this.getSubtotal().toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Envío:</span>
          <span>${this.getShippingCost() === 0 ? 'Gratis' : '€' + this.getShippingCost().toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>IVA (21%):</span>
          <span>€${this.getTax().toFixed(2)}</span>
        </div>
        <div class="summary-row summary-total">
          <span>Total:</span>
          <span>€${this.getTotal().toFixed(2)}</span>
        </div>
        <div class="summary-actions">
          <a href="/checkout/" class="btn btn-primary btn-large btn-full">Proceder al pago</a>
          <button class="btn btn-secondary" onclick="cart.clearCart()">Vaciar carrito</button>
        </div>
      </div>
    `;
  }

setupEventListeners() {
    // Add to cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-add-to-cart]')) {
            e.preventDefault();
            const productData = JSON.parse(e.target.dataset.product);
            const quantityInput = document.querySelector(`#quantity-${productData.id}`) || 
                                                     document.querySelector('.quantity-input');
            const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
            
            this.addItem(productData, quantity);
        }
    });

    // Cart sidebar quantity and remove buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quantity-btn')) {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;
            const item = this.items.find(item => item.id === id);
            if (!item) return;

            if (action === 'increase') {
                this.updateQuantity(id, item.quantity + 1);
            } else if (action === 'decrease') {
                this.updateQuantity(id, item.quantity - 1);
            }
        }

        if (e.target.classList.contains('cart-item__remove')) {
            const id = e.target.dataset.id;
            this.removeItem(id);
        }
    });

    // Cart page quantity input
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const id = e.target.dataset.id;
            let value = parseInt(e.target.value);
            if (isNaN(value) || value < 1) value = 1;
            this.updateQuantity(id, value);
        }
    });
}

setupCartSidebar() {
    // Open sidebar
    const openBtn = document.querySelector('[data-cart-open]');
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    const closeBtn = document.querySelector('[data-cart-close]');

    if (openBtn && sidebar && overlay) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.classList.add('no-scroll');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        }
    }
}

showNotification(message, type = 'info') {
    // Simple notification system, can be replaced with a library
    let notif = document.createElement('div');
    notif.className = `cart-notification cart-notification--${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.classList.add('visible');
    }, 10);
    setTimeout(() => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

trackEvent(event, data) {
    // Placeholder for analytics integration
    if (window.gtag) {
        window.gtag('event', event, data);
    }
}
}

// Export or instantiate the cart
window.cart = new ShoppingCart();