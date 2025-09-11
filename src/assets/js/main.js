// Main JavaScript file for the JAMStack site
class SiteApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupContactForm();
    this.setupNewsletterForm();
    this.setupLazyLoading();
    this.setupAccessibility();
  }

  // Navigation functionality
  setupNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
        document.body.classList.toggle('nav-open');
      });

      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
          navToggle.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('active');
          document.body.classList.remove('nav-open');
          navToggle.focus();
        }
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navToggle.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('active');
          document.body.classList.remove('nav-open');
        }
      });
    }
  }

  // Contact form handling
  setupContactForm() {
    const contactForm = document.querySelector('[data-contact-form]');
    
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('[type="submit"]');
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        try {
          const response = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'contact',
              data: data
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            this.showNotification('¡Mensaje enviado correctamente! Te responderemos pronto.', 'success');
            contactForm.reset();
          } else {
            throw new Error(result.error);
          }
          
        } catch (error) {
          console.error('Contact form error:', error);
          this.showNotification('Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar mensaje';
        }
      });
    }
  }

  // Newsletter form handling
  setupNewsletterForm() {
    const newsletterForm = document.querySelector('[data-newsletter]');
    
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = newsletterForm.querySelector('[type="email"]');
        const submitBtn = newsletterForm.querySelector('[type="submit"]');
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Suscribiendo...';
        
        try {
          const response = await fetch('/.netlify/functions/newsletter-subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: emailInput.value
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            this.showNotification('¡Te has suscrito correctamente al newsletter!', 'success');
            newsletterForm.reset();
          } else {
            throw new Error(result.error);
          }
          
        } catch (error) {
          console.error('Newsletter subscription error:', error);
          this.showNotification('Hubo un error en la suscripción. Por favor, inténtalo de nuevo.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Suscribirse';
        }
      });
    }
  }

  // Lazy loading for images
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.remove('lazy');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      });

      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        img.classList.add('lazy');
        imageObserver.observe(img);
      });
    } else {
      // Fallback for older browsers
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // Accessibility enhancements
  setupAccessibility() {
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView();
        }
      });
    }

    // Focus management for modals and overlays
    this.setupFocusTrap();
  }

  // Focus trap for modals
  setupFocusTrap() {
    const modals = document.querySelectorAll('[data-modal]');
    
    modals.forEach(modal => {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        });
      }
    });
  }

  // Notification system
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <div class="notification__content">
        <span class="notification__message">${message}</span>
        <button class="notification__close" aria-label="Cerrar notificación">×</button>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('notification--visible'), 100);
    
    // Auto-hide after 5 seconds
    const autoHide = setTimeout(() => {
      this.hideNotification(notification);
    }, 5000);
    
    // Manual close
    const closeBtn = notification.querySelector('.notification__close');
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoHide);
      this.hideNotification(notification);
    });
  }

  hideNotification(notification) {
    notification.classList.remove('notification--visible');
    setTimeout(() => notification.remove(), 300);
  }

  // Utility method for smooth scrolling
  smoothScrollTo(target, duration = 800) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) return;

    const targetPosition = targetElement.offsetTop;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
  }

  // Analytics helper (Google Analytics 4)
  trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
  }

  // Form validation helpers
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\s+/g, ''));
  }

  // Cookie consent (GDPR compliance)
  setupCookieConsent() {
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    if (!cookieConsent) {
      this.showCookieConsent();
    }
  }

  showCookieConsent() {
    const consentBanner = document.createElement('div');
    consentBanner.className = 'cookie-consent';
    consentBanner.innerHTML = `
      <div class="cookie-consent__content">
        <p>Utilizamos cookies para mejorar tu experiencia de navegación. Al continuar navegando, aceptas nuestro uso de cookies.</p>
        <div class="cookie-consent__actions">
          <button class="btn btn-primary" data-accept>Aceptar</button>
          <button class="btn btn-secondary" data-decline>Rechazar</button>
          <a href="/privacy" class="cookie-consent__link">Más información</a>
        </div>
      </div>
    `;

    document.body.appendChild(consentBanner);

    // Handle consent actions
    consentBanner.querySelector('[data-accept]').addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      consentBanner.remove();
      this.loadAnalytics();
    });

    consentBanner.querySelector('[data-decline]').addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'declined');
      consentBanner.remove();
    });
  }

  loadAnalytics() {
    // Load Google Analytics or other analytics scripts
    if (window.GA_TRACKING_ID) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${window.GA_TRACKING_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', window.GA_TRACKING_ID);
    }
  }
}

// Shopping Cart functionality
class ShoppingCart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
    this.init();
  }

  init() {
    this.updateCartUI();
    this.setupCartToggle();
    this.setupCartInteractions();
  }

  addItem(product) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: product.quantity || 1
      });
    }
    
    this.saveCart();
    this.updateCartUI();
    this.showCartNotification(`${product.name} añadido al carrito`);
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartUI();
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
        this.updateCartUI();
      }
    }
  }

  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    this.updateCartUI();
  }

  updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (cartCount) {
      cartCount.textContent = this.getTotalItems();
    }

    if (cartItems) {
      if (this.items.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
      } else {
        cartItems.innerHTML = this.items.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item__image">
            <div class="cart-item__details">
              <h4 class="cart-item__name">${item.name}</h4>
              <div class="cart-item__quantity">
                <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
              </div>
              <div class="cart-item__price">€${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <button class="cart-item__remove" data-id="${item.id}">×</button>
          </div>
        `).join('');
      }
    }

    if (cartTotal) {
      cartTotal.textContent = `€${this.getTotalPrice().toFixed(2)}`;
    }
  }

  setupCartToggle() {
    const cartToggle = document.querySelector('.cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.querySelector('.cart-close');

    if (cartToggle && cartSidebar) {
      cartToggle.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        document.body.classList.add('cart-open');
      });

      cartClose?.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        document.body.classList.remove('cart-open');
      });

      // Close cart when clicking outside
      document.addEventListener('click', (e) => {
        if (cartSidebar.classList.contains('active') && 
            !cartSidebar.contains(e.target) && 
            !cartToggle.contains(e.target)) {
          cartSidebar.classList.remove('active');
          document.body.classList.remove('cart-open');
        }
      });
    }
  }

  setupCartInteractions() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.quantity-btn')) {
        const action = e.target.dataset.action;
        const itemId = e.target.dataset.id;
        const item = this.items.find(item => item.id === itemId);
        
        if (item) {
          if (action === 'increase') {
            this.updateQuantity(itemId, item.quantity + 1);
          } else if (action === 'decrease') {
            this.updateQuantity(itemId, item.quantity - 1);
          }
        }
      }

      if (e.target.matches('.cart-item__remove')) {
        const itemId = e.target.dataset.id;
        this.removeItem(itemId);
      }

      if (e.target.matches('[data-add-to-cart]')) {
        const productData = JSON.parse(e.target.dataset.product);
        this.addItem(productData);
      }
    });

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (this.items.length > 0) {
          window.location.href = '/checkout';
        }
      });
    }
  }

  showCartNotification(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize main app
  window.siteApp = new SiteApp();
  
  // Initialize shopping cart
  window.cart = new ShoppingCart();
  
  // Setup cookie consent
  window.siteApp.setupCookieConsent();
  
  // Add smooth scrolling to anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        window.siteApp.smoothScrollTo(target);
      }
    });
  });
});