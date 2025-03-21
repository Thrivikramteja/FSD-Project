document.addEventListener("DOMContentLoaded", function () {
    let loginPopupBtn = document.getElementById("loginPopupBtn");
    let popup = document.getElementById("popup");
    let loginForm = document.getElementById("login");

    if (loginPopupBtn && popup && loginForm) {
        loginPopupBtn.addEventListener("click", function (event) {
            event.preventDefault();
            popup.style.display = "block";
            document.body.style.overflow = "hidden";
        }); 

        popup.addEventListener("click", function (event) {
            popup.style.display = "none";
            document.body.style.overflow = "";
        });

        loginForm.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }
});

let carousel = document.getElementById("carousel");
        let dots = document.querySelectorAll(".dot");

        function scrollCarousel(direction) {
            let scrollAmount = carousel.clientWidth * 0.8;
            carousel.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
            updateDots();
        }

        function updateDots() {
            let scrollLeft = carousel.scrollLeft;
            let scrollWidth = carousel.scrollWidth - carousel.clientWidth;
            let index = Math.round((scrollLeft / scrollWidth) * (dots.length - 1));
            
            dots.forEach(dot => dot.classList.remove("active"));
            dots[index].classList.add("active");
        }

        function scrollToSlide(index) {
            let scrollAmount = index * (carousel.scrollWidth / dots.length);
            carousel.scrollTo({ left: scrollAmount, behavior: "smooth" });
            updateDots();
        }

        carousel.addEventListener("scroll", updateDots);
