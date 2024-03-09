import { Link } from 'react-router-dom';
import { useState } from 'react';
import Slider from 'react-slick';
import { useSelector } from 'react-redux';
import axios from 'axios';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './CSS/style.css'

const AnimeSlider = ({ slides, slideCount }) => {
    const user = useSelector((state) => state.auth.user);
    const [currentSlide, setCurrentSlide] = useState(0);

    const shouldAutoplay = slides.length > 5

    const settings = {
        dots: shouldAutoplay,
        infinite: shouldAutoplay,
        speed: 500,
        slidesToShow: slides.length > slideCount ? slideCount : slides.length,
        slidesToScroll: 1,
        autoplay: shouldAutoplay,
        autoplaySpeed: 2000,
        cssEase: "linear",
        afterChange: (index) => setCurrentSlide(index),
        dotsClass: 'slick-dots-custom', // Add a custom class for dots
    };

    return (
        <div>
            <Slider {...settings}>
                {slides.map((slide, index) => (
                    <div key={index} className="px-2">
                        <Link to={`/anime/${slide.anime_id}`} className="flex text-gray-100 font-semibold text-lg no-underline">
                            <figure className="text-center">
                                <img
                                    src={slide.cover_image}
                                    alt={slide.title}
                                    className="w-full h-80 object-cover rounded-lg transition-transform duration-300 transform hover:scale-105"
                                />
                                <figcaption className="mt-2 text-base">{slide.title}</figcaption>
                            </figure>
                        </Link>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default AnimeSlider;