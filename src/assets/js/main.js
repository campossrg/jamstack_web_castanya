document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const heroImg = document.querySelector(".hero-img");

  const handleScroll = () => {
    // Only apply the "climb" effect if we are on the home page
    const isHome = document.body.classList.contains("home");

    if (!isHome) {
      // On internal pages, we just ensure the scrolled class is present for styling
      header.classList.add("is-scrolled");
      document.documentElement.style.setProperty("--climb-progress", "1");
      return;
    }

    const scrollPos = window.scrollY;
    const vh = window.innerHeight;
    const navHeight = 65; // Height of your menu bar

    // Calculate 0 to 1 progress based on scroll
    const dockingDistance = vh - navHeight;
    let progress = Math.min(scrollPos / dockingDistance, 1);

    // Send progress to CSS
    document.documentElement.style.setProperty("--climb-progress", progress);

    // Toggle solid color when it reaches the very top
    if (progress >= 1) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }

    // Optional: Fade out the background image slightly
    if (heroImg) {
      heroImg.style.opacity = Math.max(1 - scrollPos / vh, 0);
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // Run immediately on load

  // --- CAROUSEL LOGIC ---
  const scrollContainer = document.getElementById("galleryScroll");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (scrollContainer && prevBtn && nextBtn) {
    // Determine how far to scroll (the width of one item + gap)
    const getScrollStep = () => {
      const firstItem = scrollContainer.querySelector(".gallery-item");
      if (!firstItem) return 300; // Fallback

      const itemWidth = firstItem.offsetWidth;
      const gap = 20; // Matches the gap in your CSS
      return itemWidth + gap;
    };

    nextBtn.addEventListener("click", () => {
      scrollContainer.scrollBy({
        left: getScrollStep(),
        behavior: "smooth",
      });
    });

    prevBtn.addEventListener("click", () => {
      scrollContainer.scrollBy({
        left: -getScrollStep(),
        behavior: "smooth",
      });
    });

    // Optional: Hide/Show arrows based on scroll position
    const toggleArrows = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const maxScroll =
        scrollContainer.scrollWidth - scrollContainer.clientWidth;

      // Subtle fade for the buttons at the ends
      prevBtn.style.opacity = scrollLeft <= 5 ? "0.3" : "1";
      prevBtn.style.pointerEvents = scrollLeft <= 5 ? "none" : "auto";

      nextBtn.style.opacity = scrollLeft >= maxScroll - 5 ? "0.3" : "1";
      nextBtn.style.pointerEvents =
        scrollLeft >= maxScroll - 5 ? "none" : "auto";
    };

    scrollContainer.addEventListener("scroll", toggleArrows);
    // Initialize arrow state
    toggleArrows();
  }

  const setupCarousel = (scrollId, prevId, nextId) => {
    const container = document.getElementById(scrollId);
    const prev = document.getElementById(prevId);
    const next = document.getElementById(nextId);

    if (container && prev && next) {
      const step = 340; // Card width + gap
      next.addEventListener("click", () =>
        container.scrollBy({ left: step, behavior: "smooth" }),
      );
      prev.addEventListener("click", () =>
        container.scrollBy({ left: -step, behavior: "smooth" }),
      );
    }
  };

  // Initialize all three carousels
  setupCarousel("galleryScroll", "prevBtn", "nextBtn");
  setupCarousel("testimonialScroll", "prevTestimonial", "nextTestimonial");
  setupCarousel("partnerScroll", "prevPartner", "nextPartner");
});
