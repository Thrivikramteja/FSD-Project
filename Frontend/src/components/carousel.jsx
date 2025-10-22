import { useState, useEffect } from "react";
import styles from "./Carousel.module.css"; 

const Carousel = () => {
    const slides = [
        {
            title: "Help Ashok Deshmane give orphans of farmer suicides a loving home",
            description: "Support a cause that provides shelter and hope to children affected by farmer suicides.",
            img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
            alt: "Feeding Child",
        },
        {
            title: "Support Education Initiatives for Rural Kids",
            description: "Every donation helps provide books, uniforms, and the opportunity to learn.",
            img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
            alt: "Rural Education",
        },
        {
            title: "Feed Hungry Children with Nutritious Meals",
            description: "Your generosity brings daily nutrition to kids in need.",
            img: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99",
            alt: "Nutritious Meals",
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [slides.length]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    return (
        <div className={styles["carousel-container"]}>
            <div
                className={styles["carousel-slides"]}
                style={{ transform: `translateX(-${100 * currentIndex}vw)` }}
            >
                {slides.map((slide, idx) => (
                    <div key={idx} className={styles["carousel-slide"]}>
                        <div className={styles["carousel-content"]}>
                            <h2>{slide.title}</h2>
                            <p>{slide.description}</p>
                            <a href="/donate" className={styles["carousel-btn"]}>
                                Donate now
                            </a>
                        </div>
                        <img className={styles["carousel-img"]} src={slide.img} alt={slide.alt} />
                    </div>
                ))}
            </div>

            <div className={styles["carousel-indicators"]}>
                {slides.map((_, idx) => (
                    <span
                        key={idx}
                        className={currentIndex === idx ? styles.active : ""}
                        onClick={() => goToSlide(idx)}
                    ></span>
                ))}
            </div>
        </div>
    );
};

export default Carousel;
