document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector("#site-menu-toggle");
  const menuButton = document.querySelector(".site-menu-button");

  if (menuToggle && menuButton) {
    const syncMenuState = () => {
      menuButton.setAttribute("aria-expanded", menuToggle.checked ? "true" : "false");
      document.body.classList.toggle("menu-open", menuToggle.checked);
    };

    menuToggle.addEventListener("change", syncMenuState);
    syncMenuState();
  }

  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const previousButton = carousel.querySelector("[data-carousel-previous]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const dotsContainer = carousel.querySelector("[data-carousel-dots]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interval = Number.parseInt(carousel.dataset.interval, 10) || 6500;
    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
    let timer = null;

    if (!slides.length || !dotsContainer) return;

    const dots = slides.map((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "home-carousel__dot";
      dot.setAttribute("aria-label", `Show gallery image ${index + 1} of ${slides.length}`);
      dot.addEventListener("click", () => showSlide(index));
      dotsContainer.appendChild(dot);
      return dot;
    });

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    };

    const stopCarousel = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };

    const startCarousel = () => {
      stopCarousel();
      if (slides.length > 1 && !reduceMotion) {
        timer = window.setInterval(() => showSlide(activeIndex + 1), interval);
      }
    };

    if (previousButton && nextButton) {
      const hasMultipleSlides = slides.length > 1;
      previousButton.hidden = !hasMultipleSlides;
      nextButton.hidden = !hasMultipleSlides;
      previousButton.addEventListener("click", () => showSlide(activeIndex - 1));
      nextButton.addEventListener("click", () => showSlide(activeIndex + 1));
    }

    carousel.addEventListener("mouseenter", stopCarousel);
    carousel.addEventListener("mouseleave", startCarousel);
    carousel.addEventListener("focusin", stopCarousel);
    carousel.addEventListener("focusout", startCarousel);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopCarousel();
      else startCarousel();
    });

    showSlide(activeIndex);
    startCarousel();
  });

  document.querySelectorAll(".article-content img").forEach((image) => {
    if (image.closest("a") || image.closest(".home-hero__mark") || image.closest(".home-carousel")) return;

    const link = document.createElement("a");
    link.href = image.currentSrc || image.src;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "image-link";
    link.setAttribute("aria-label", `Open ${image.alt || "image"} at full size`);
    image.parentNode.insertBefore(link, image);
    link.appendChild(image);
  });
});
