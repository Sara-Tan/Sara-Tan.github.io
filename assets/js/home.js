(function () {
  "use strict";

  const root = document.documentElement;

  // Theme toggle (shares the "theme" localStorage key with the rest of al-folio)
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // Navbar: shadow on scroll, active link, back-to-top
  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("backToTop");
  const navLinks = Array.from(document.querySelectorAll('.navbar-link[href^="#"]'));
  const sections = navLinks.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);

  function onScroll() {
    const y = window.scrollY;
    navbar && navbar.classList.toggle("scrolled", y > 20);
    backToTop && backToTop.classList.toggle("show", y > 300);

    let current = null;
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top <= 120) current = s.id;
    });
    navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + current));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const menu = document.getElementById("navbarMenu");
  const toggle = document.getElementById("navbarToggle");
  const closeBtn = document.getElementById("navbarClose");
  const overlay = document.getElementById("navbarOverlay");

  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("show", open);
    overlay && overlay.classList.toggle("show", open);
    toggle && toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  toggle && toggle.addEventListener("click", () => setMenu(true));
  closeBtn && closeBtn.addEventListener("click", () => setMenu(false));
  overlay && overlay.addEventListener("click", () => setMenu(false));
  menu && menu.querySelectorAll(".navbar-link").forEach((l) => l.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) setMenu(false);
  });

  // News show more / less
  const newsToggle = document.getElementById("newsToggle");
  const newsList = document.getElementById("newsList");
  if (newsToggle && newsList) {
    newsToggle.addEventListener("click", () => {
      const expanded = newsList.classList.toggle("expanded");
      newsToggle.setAttribute("aria-expanded", String(expanded));
      newsToggle.querySelector("i").className = expanded ? "fas fa-chevron-up" : "fas fa-chevron-down";
      newsToggle.querySelector("span").textContent = expanded ? "Show Less" : "Show More";
    });
  }

  // Publications slider
  const slider = document.getElementById("pubSlider");
  if (slider) {
    const cards = Array.from(slider.querySelectorAll(".pub-card"));
    const prev = document.getElementById("pubPrev");
    const next = document.getElementById("pubNext");
    const progress = document.getElementById("pubProgress");
    const dotsWrap = document.getElementById("pubDots");

    const dots = cards.map((card) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider-dot";
      dot.setAttribute("aria-label", "Go to " + card.querySelector(".pub-title").textContent.trim());
      dot.addEventListener("click", () => slider.scrollTo({ left: card.offsetLeft - slider.offsetLeft }));
      dotsWrap && dotsWrap.appendChild(dot);
      return dot;
    });

    const step = () => (cards[0] ? cards[0].offsetWidth + 22 : slider.clientWidth);

    function update() {
      const max = slider.scrollWidth - slider.clientWidth;
      const x = slider.scrollLeft;
      if (progress) progress.style.width = (max > 0 ? (x / max) * 100 : 100) + "%";
      if (prev) prev.disabled = x <= 5;
      if (next) next.disabled = x >= max - 5;
      const active = Math.min(cards.length - 1, Math.round(x / step()));
      dots.forEach((d, i) => d.classList.toggle("active", i === active));
    }

    prev && prev.addEventListener("click", () => slider.scrollBy({ left: -step() }));
    next && next.addEventListener("click", () => slider.scrollBy({ left: step() }));
    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") slider.scrollBy({ left: -step() });
      if (e.key === "ArrowRight") slider.scrollBy({ left: step() });
    });
    slider.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // Idea tooltips (tap / keyboard support)
  const tooltips = document.querySelectorAll(".idea-tooltip");
  tooltips.forEach((t) => {
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !t.classList.contains("open");
      tooltips.forEach((o) => o.classList.remove("open"));
      t.classList.toggle("open", open);
    });
    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        t.click();
      }
    });
  });
  document.addEventListener("click", () => tooltips.forEach((o) => o.classList.remove("open")));

  // BibTeX dialog
  const dialog = document.getElementById("citeDialog");
  const citeText = document.getElementById("citeText");
  const citeCopy = document.getElementById("citeCopy");
  if (dialog && citeText) {
    document.querySelectorAll(".cite-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.parentElement.querySelector(".bibtex-source");
        citeText.textContent = src ? src.textContent : "";
        citeCopy.querySelector("span").textContent = "Copy";
        dialog.showModal();
      });
    });
    document.getElementById("citeClose").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    citeCopy.addEventListener("click", () => {
      navigator.clipboard.writeText(citeText.textContent).then(() => {
        citeCopy.querySelector("span").textContent = "Copied!";
      });
    });
  }

  // Blog pagination
  const blogList = document.getElementById("blogList");
  if (blogList) {
    const items = Array.from(blogList.querySelectorAll(".blog-item"));
    const perPage = parseInt(blogList.dataset.perPage, 10) || 4;
    const pages = Math.ceil(items.length / perPage);
    const bPrev = document.getElementById("blogPrev");
    const bNext = document.getElementById("blogNext");
    const info = document.getElementById("blogPageInfo");
    let page = 0;

    function render() {
      items.forEach((item, i) => {
        item.hidden = Math.floor(i / perPage) !== page;
      });
      bPrev.disabled = page === 0;
      bNext.disabled = page >= pages - 1;
      info.textContent = "Page " + (page + 1) + " of " + pages;
    }

    if (pages <= 1) {
      document.getElementById("blogPagination").hidden = true;
    } else {
      bPrev.addEventListener("click", () => {
        page = Math.max(0, page - 1);
        render();
      });
      bNext.addEventListener("click", () => {
        page = Math.min(pages - 1, page + 1);
        render();
      });
      render();
    }
  }
})();
