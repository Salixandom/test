import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Slider from '../AnimeSlider';
import { Navigation, Footer } from './imports'
import './../CSS/style.css'

const Browse = () => {

    const [trendingAnimeSlides, setTrendingAnimeSlides] = useState([]);
    const [popularAnimeSlides, setPopularAnimeSlides] = useState([]);
    const [allAnimeList, setAllAnimeList] = useState([]);

    const handleTrendingAnimeSlides = () => {
        axios.get('http://localhost:5000/browse/trendingAnime')
            .then((response) => {
                setTrendingAnimeSlides(response.data);
                console.log(response.data.length)
            })
            .catch((error) => {
                console.error('Error fetching trending anime: ', error);
            })
    }

    const handlePopularAnimeSlides = () => {
        axios.get('http://localhost:5000/browse/popularAnime')
            .then((response) => {
                setPopularAnimeSlides(response.data);
            })
            .catch((error) => {
                console.error('Error fetching popular anime: ', error);
            })
    }

    const handleAllAnimeList = () => {
        axios.get('http://localhost:5000/browse/allAnime')
            .then((response) => {
                setAllAnimeList(response.data);
            })
            .catch((error) => {
                console.error('Error fetching trending anime: ', error);
            })
    }

    useEffect(() => {
        handleTrendingAnimeSlides();
        handlePopularAnimeSlides();
        handleAllAnimeList();
    }, [])

    return (
        <>
            <Navigation />
            <main className='bg-gray-800'>
                <section className="browse-section trending">
                    <div className="browse-section-header">
                        <h2>TRENDING NOW</h2>
                    </div>
                    <div className="browse-anime-list">
                        <Slider slides={trendingAnimeSlides} slideCount={6} />
                    </div>
                </section>

                <section className="browse-section popular">
                    <div className="browse-section-header">
                        <h2>POPULAR THIS SEASON</h2>
                    </div>
                    <div className="browse-anime-list">
                        <Slider slides={popularAnimeSlides} slideCount={6} />
                    </div>
                </section>

                <section className="browse-section all-anime rounded-xl" style={{ backgroundColor: "#10161D"}}>
                    <div className="browse-section-header">
                        <h2>ALL ANIME</h2>
                    </div>
                    <div className="anime-list mt-4">
                        {allAnimeList.map((anime, index) => (
                            <div key={index} className='anime-sub-section'>
                                <Link to={`/anime/${anime.anime_id}`} style={{
                                    textDecoration: 'none',
                                    color: 'gray-scale',
                                    display: 'flex',
                                    width: '100%',
                                    height: '10%',
                                    alignItems: 'center'
                                }}>
                                    <div className='anime-rank' style={{
                                        fontWeight: 'bolder',
                                        color: '#00b3b3',
                                        fontSize: '30px',
                                        fontStyle: 'italic',
                                        marginRight: '15px'

                                    }}>#<span style={{ fontSize: '42px', fontFamily: 'verdana' }}>{index + 1}</span></div>
                                    <img src={anime.cover_image} alt={anime.title} className='anime-thumbnail' />
                                    <div className='anime-details'>
                                        <h3 className='text-gray-300'>{anime.title}</h3>
                                        <div className='anime-info'>
                                            <div className='anime-format'>{anime.showtype}</div>
                                        <div className='anime-airing'>{anime.airing_season}</div>
                                        <div className='anime-status'>{anime.ongoing_status ? 'Ongoing' : 'Finished'}</div>
                                            <div className='anime-rating'>{anime.average_rating}</div>
                                            <div className='anime-favorites'>{anime.favorites}</div>
                                        </div>
                                        <div className='anime-genres'>
                                            {anime.genres.map((genre, genreIndex) => (
                                                <span key={genreIndex} className='genre'>{genre}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

            </main >

            <Footer />
        </>
    );
};

export default Browse;
