document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Header Scroll & Docking Logic ---
  const header = document.querySelector(".site-header");
  const heroImg = document.querySelector(".hero-img");
  const branding = document.querySelector(".hero-center-branding");

  // This function handles the transformation from bottom-transparent to top-brown
  const handleScroll = () => {
    const scrollPos = window.scrollY;
    const vh = window.innerHeight;

    // 1. THE DOCKING TRIGGER
    // We trigger the "is-scrolled" state when the user has scrolled 
    // past the hero image. This snaps the menu from bottom to top.
    if (scrollPos > (vh * 0.1)) { 
      // We start the fade-in effect early for a smoother transition
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }

    // 2. FADE THE BACKGROUND IMAGE
    // As you scroll down, the forest image fades out to allow the 
    // cream-colored content of the page to take over.
    if (heroImg) {
      let opacityValue = 1 - (scrollPos / vh);
      heroImg.style.opacity = Math.max(opacityValue, 0);
    }

    // 3. FADE THE CENTRAL BRANDING
    // The large central logo and text fade out faster than the image
    // so they don't clash with the scrolling menu.
    if (branding) {
      let textOpacity = 1 - (scrollPos / (vh * 0.4));
      branding.style.opacity = Math.max(textOpacity, 0);
      // Optional: slight parallax effect (moves text up slowly)
      branding.style.transform = `translateY(-${scrollPos * 0.2}px)`;
    }
  };

  window.addEventListener('scroll', handleScroll);
  // Run once on load to catch the position if the user refreshes mid-page
  handleScroll();

  // --- 2. Gallery Scrolling Logic ---
  const scrollContainer = document.getElementById('galleryScroll');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');

  if (scrollContainer && nextBtn && prevBtn) {
    nextBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: 310, behavior: 'smooth' });
    });
    
    prevBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: -310, behavior: 'smooth' });
    });
  }
});