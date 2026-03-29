document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const heroImg = document.querySelector(".hero-img");

  const handleScroll = () => {
    const scrollPos = window.scrollY;
    const vh = window.innerHeight;

    // The nav height is 65px as per your CSS
    const dockingDistance = vh - 65; 
    
    // Ensure we don't divide by zero if vh isn't ready
    let progress = dockingDistance > 0 ? Math.min(Math.max(scrollPos / dockingDistance, 0), 1) : 0;
    
    document.documentElement.style.setProperty('--climb-progress', progress);

    if (progress === 1) { 
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }

    if (heroImg) {
      heroImg.style.opacity = Math.max(1 - (scrollPos / vh), 0);
    }
  };

  window.addEventListener('scroll', handleScroll);
  
  // Call once immediately to set the header at the bottom
  handleScroll(); 
  
  // Call again after a tiny delay to catch any layout shifts
  setTimeout(handleScroll, 50); 
});