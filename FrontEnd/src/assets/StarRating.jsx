import React, { useState } from 'react';// You may need to create this CSS file for styling
import './../index.css'


const StarRating = () => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleMouseOver = (ratingValue) => {
        setHoveredRating(ratingValue);
    };

    const handleMouseLeave = () => {
        setHoveredRating(0);
    };

    const handleClick = (ratingValue) => {
        setRating(ratingValue);
    };

    const renderStar = (ratingValue) => {
        let starClass = 'star';

        if (ratingValue <= (hoveredRating || rating)) {
            starClass += ' filled';
        }

        if (ratingValue === Math.ceil(hoveredRating) && hoveredRating % 1 !== 0) {
            starClass += ' half-filled';
        }

        return (
            <span
                key={ratingValue}
                className={starClass}
                onMouseOver={() => handleMouseOver(ratingValue)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(ratingValue)}
            />
        );
    };

    const stars = [];
    for (let i = 1; i <= 10; i++) {
        stars.push(renderStar(i / 2)); // Since we want half-star increments, we divide by 2
    }

    return <div className="star-rating">{stars}</div>;
};

export default StarRating;
