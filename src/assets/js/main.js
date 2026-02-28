window.onscroll = function() {
  const header = document.querySelector("header");
  const logo = document.querySelector(".logo");
  if (window.pageYOffset > 50) {
    header.style.padding = "5px 35px";
    if(logo) logo.style.height = "50px";
  } else {
    header.style.padding = "20px 35px";
    if(logo) logo.style.height = "70px";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const dots = document.querySelectorAll('.dot');
  const hero = document.querySelector('.rectangle');
  const title = hero.querySelector('.hero-title');
  const subtitle = hero.querySelector('.hero-subtitle');
  const btnText = hero.querySelector('.COMPRAR-ONLINE-hero');

  const slides = [
    {
      title: '<strong>L’única castanya 100% catalana i artesana:</strong> Protegim el llegat del Parc Natural del Montseny',
      subtitle: 'Som productors locals i artesans. Amb cada compra col·labores directament en la gestió forestal.',
      btn: 'COMPRAR ONLINE'
    },
    {
      title: '<strong>Visites Guiades:</strong> Viu la castanya des de dins',
      subtitle: 'Reserva la teva plaça per conèixer els nostres boscos i la nostra manera de treballar.',
      btn: 'RESERVAR ARA'
    },
    {
      title: '<strong>Productes Locals:</strong> Qualitat i Tradició',
      subtitle: 'Descobreix la nostra varietat de productes elaborats artesanalment a Viladrau.',
      btn: 'VEURE BOTIGA'
    },
    {
      title: '<strong>El Nostre Projecte:</strong> Sostenibilitat Real',
      subtitle: 'Treballem per la recuperació dels castanyers i la preservació del medi ambient.',
      btn: 'SABER-NE MÉS'
    }
  ];

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      // 1. Update Active Dot
      document.querySelector('.dot.active').classList.remove('active');
      dot.classList.add('active');

      // 2. Animate out (optional effect)
      hero.style.opacity = '0';

      setTimeout(() => {
        // 3. Swap Content
        const data = slides[i];
        title.innerHTML = data.title;
        subtitle.innerText = data.subtitle;
        btnText.innerText = data.btn;

        // 4. Animate back in
        hero.style.opacity = '1';
      }, 200);
    });

    // Gallery Scrolling Logic
    const scrollContainer = document.getElementById('galleryScroll');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    nextBtn.addEventListener('click', () => {
      scrollContainer.scrollLeft += 310;
    });

    prevBtn.addEventListener('click', () => {
      scrollContainer.scrollLeft -= 310;
    });
  });
});