import React, { useState } from 'react'; // Make sure to create a Modal.css file for styles

const Modal = () => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const onMouseEnter = (index) => {
        setHoverRating(index);
    };

    const onMouseLeave = () => {
        setHoverRating(0);
    };

    const onSaveRating = (index) => {
        setRating(index);
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close-modal">&times;</span>
                <h2 className='heading-modal'>Rate This</h2>
                <div className="rating-modal">
                    {[...Array(5)].map((star, index) => {
                        index += 1;
                        return (
                            <button
                                type="button"
                                key={index}
                                className={index <= (hoverRating || rating) ? "on" : "off"}
                                onClick={() => onSaveRating(index)}
                                onMouseEnter={() => onMouseEnter(index)}
                                onMouseLeave={onMouseLeave}
                            >
                                <span className="star">&#9733;</span>
                            </button>
                        );
                    })}
                </div>
                <button className="submit-modal" onClick={() => console.log(`Rated: ${rating}`)}>Rate</button>
            </div>
        </div>
    );
};

export default Modal;
