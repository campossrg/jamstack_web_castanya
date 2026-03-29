document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const heroImg = document.querySelector(".hero-img");

  const handleScroll = () => {
    const isHome = document.body.classList.contains('home');
    
    if (!isHome) {
      header.classList.add('is-scrolled'); // Ensure solid color is always on
      return;
    }

    const scrollPos = window.scrollY;
    const vh = window.innerHeight;
    const navHeight = 65; // Height of your menu bar
    
    // Calculate 0 to 1 progress based on scroll
    const dockingDistance = vh - navHeight;
    let progress = Math.min(scrollPos / dockingDistance, 1);
    
    // Send progress to CSS
    document.documentElement.style.setProperty('--climb-progress', progress);

    // Toggle solid color when it reaches the very top
    if (progress >= 1) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }

    // Optional: Fade out the background image slightly
    if (heroImg) {
      heroImg.style.opacity = Math.max(1 - (scrollPos / vh), 0);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Run immediately on load
});