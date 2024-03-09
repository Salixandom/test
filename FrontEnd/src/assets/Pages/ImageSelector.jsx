import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import './../CSS/style.css'

const ImageSelector = ({ onSelectImage, isOpen, onRequestClose }) => {
    const [images, setImages] = useState([]);

    useEffect(() => {
        
    }, []);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Image Selector Modal"
            className="fixed inset-0 z-50 overflow-auto flex" // Tailwind classes for full screen with flexible box
            overlayClassName="fixed inset-0 bg-black bg-opacity-50" // Darker background with some opacity
        >
            <div className="relative p-8 bg-gray-800 w-full max-w-md m-auto flex-col flex rounded-lg shadow-xl"> {/* Darker background with shadow */}
                <h2 className="text-lg font-bold text-white mb-4">Select Your Profile Picture</h2>
                <div className="grid grid-cols-3 gap-4"> {/* Grid container for images */}
                    {images.map((image) => (
                        <img
                            key={image.id}
                            className="cursor-pointer transform hover:scale-105 transition duration-300 ease-in-out" // Tailwind classes for interactivity
                            src={image.url}
                            alt={image.alt_text}
                            onClick={() => onSelectImage(image)}
                        />
                    ))}
                </div>
                <button
                    className="absolute top-0 right-0 mt-2 mr-2" // Position the close button at the top-right
                    onClick={onRequestClose}
                >
                    <svg className="h-6 w-6 text-gray-500" // SVG for the close button
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </Modal>
    );
};

export default ImageSelector;
