import React, { useRef, useEffect } from "react";

const PremiumTitle = () => {
  const text = "Care Connect";
  const spansRef = useRef([]);
  const timeoutsRef = useRef({}); // To track active timers per letter

  // Configuration
  const defaultFont = { family: "'Inter', sans-serif", weight: '300', style: 'normal' };
  const randomFonts = [
    { family: "'Playfair Display', serif", weight: '500', style: 'italic' },
    { family: "'Space Mono', monospace", weight: '400', style: 'normal' },
    { family: "'Cinzel', serif", weight: '600', style: 'normal' },
    { family: "Arial, sans-serif", weight: '900', style: 'normal' },
    { family: "'Inter', sans-serif", weight: '100', style: 'normal' }
  ];

  // Helper: Measure width using a hidden canvas
  const measureWidth = (char, fontProps) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    // Important: Match the CSS font size (4rem used below)
    context.font = `${fontProps.style} ${fontProps.weight} 4rem ${fontProps.family}`;
    return context.measureText(char).width;
  };

  // Helper: Apply styles to a specific span
  const setStyle = (index, fontProps) => {
    const span = spansRef.current[index];
    if (span) {
      span.style.fontFamily = fontProps.family;
      span.style.fontWeight = fontProps.weight;
      span.style.fontStyle = fontProps.style;
      span.style.width = `${measureWidth(text[index], fontProps)}px`;
    }
  };

  // Initial Setup: Set all letters to default font
  useEffect(() => {
    text.split('').forEach((char, index) => {
      setStyle(index, defaultFont);
    });
  }, []);

  const handleMouseEnter = (index) => {
    // 1. Clear existing timer if user hovers again quickly
    if (timeoutsRef.current[index]) {
      clearTimeout(timeoutsRef.current[index]);
    }

    // 2. Change to random font
    const randomFont = randomFonts[Math.floor(Math.random() * randomFonts.length)];
    setStyle(index, randomFont);

    // 3. Set timer to revert after 2 seconds
    timeoutsRef.current[index] = setTimeout(() => {
      setStyle(index, defaultFont);
      delete timeoutsRef.current[index];
    }, 2000);
  };

  return (
    <div style={{ textAlign: "center", marginBottom: "20px", marginTop: "40px" }}>
        {/* Load Fonts */}
        <style>
        {`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Inter:wght@100;300&family=Playfair+Display:ital,wght@1,500&family=Space+Mono&display=swap');
            
            .hover-char {
                display: inline-block;
                overflow: hidden;
                text-align: center;
                white-space: pre;
                transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1), font-family 0.1s;
                font-size: 4rem; /* Adjustable Size */
                color: #1a1a1a;
                cursor: default;
                user-select: none;
            }
        `}
        </style>

        <h1 style={{ margin: 0, whiteSpace: "nowrap" }}>
            {text.split('').map((char, index) => (
            <span
                key={index}
                ref={(el) => (spansRef.current[index] = el)}
                className="hover-char"
                onMouseEnter={() => handleMouseEnter(index)}
            >
                {char}
            </span>
            ))}
        </h1>
    </div>
  );
};

export default PremiumTitle;