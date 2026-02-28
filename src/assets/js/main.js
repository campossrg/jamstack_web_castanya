window.onscroll = function() {
  const header = document.querySelector("header");
  if (window.pageYOffset > 50) {
    header.style.padding = "5px 0";
  } else {
    header.style.padding = "20px 0";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".frame a, .frame .group, .frame .group-2, .frame .group-3, .frame .group-4, .frame .group-5");

  navLinks.forEach(link => {
    if (link.getAttribute("href") === currentPath || link.closest('a')?.getAttribute("href") === currentPath) {
      link.classList.add("nav-active");
    }

    link.addEventListener("click", function() {
      navLinks.forEach(l => l.classList.remove("nav-active"));
      this.classList.add("nav-active");
    });
  });
});