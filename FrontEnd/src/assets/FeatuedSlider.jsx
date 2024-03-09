import { Link } from 'react-router-dom';
import { useState } from 'react';
import Slider from 'react-slick';
import { useSelector } from 'react-redux';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './CSS/style.css'

const FeaturedSlider = ({ slides }) => {
    const user = useSelector((state) => state.auth.user);
    const [currentSlide, setCurrentSlide] = useState(0);

    const shouldAutoplay = slides.length > 1

    const settings = {
        dots: true,
        arrows: false,
        infinite: shouldAutoplay,
        speed: 200,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: shouldAutoplay,
        autoplaySpeed: 5000,
        cssEase: "linear",
        afterChange: (index) => setCurrentSlide(index),
        dotsClass: 'slick-dots-custom2'
    };

    const formatReleaseDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div>
            <Slider {...settings}>
                {slides.map((slide, index) => (
                    <div key={index} className="featured-container px-2">
                        <div className="flex items-center"> {/* Add flex container */}
                            <div className='left'>
                                <h1 className='text-6xl text-white font-bold pb-4'>
                                    {slide.title}
                                </h1>
                                <div className='flex pb-3'>
                                    <span className="badge2">{slide.rated}</span>
                                    <span className="badge2">Ratings: {slide.average_rating}</span>
                                    <p className='pl-3 text-2xl text-gray-300'>{formatReleaseDate(slide.release_date)}</p>
                                </div>
                                <p className='pb-6 text-gray-400'>{slide.description.substring(0, 200) + '...'}</p>
                                <Link 
                                    to={`/anime/${slide.anime_id}`} 
                                    className="text-gray-200 font-bold text-lg no-underline pt-3 pb-3 rounded-md pr-6 pl-6 mt-1" 
                                    style={{ background: "#e91e63", transition: "letter-spacing 0.3s ease-in-out" }}
                                    onMouseOver={(e) => e.target.style.letterSpacing = "2px"}
                                    onMouseOut={(e) => e.target.style.letterSpacing = "normal"}
                                    >
                                        See Description
                                </Link>
                            </div>
                            <div className='right'>
                                <img
                                    src={slide.top_image}
                                    alt={slide.title}
                                    className="featured-slider-img object-cover rounded-xl transition-transform duration-300 transform translate-y-5"
                                />
                            </div>
                            {/* <Link to={`/anime/${slide.anime_id}`} className="text-black font-bold text-lg no-underline">
                                <figure className="text-center">
                                    
                                    <figcaption className="mt-2 text-base">{slide.title}</figcaption>
                                </figure>
                            </Link> */}
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default FeaturedSlider;
