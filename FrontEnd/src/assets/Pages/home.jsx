import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Slider from '../FeatuedSlider';
import CSlider from '../AnimeSlider'
import { useSelector } from 'react-redux';
import { Navigation, Footer } from './imports'
import './../CSS/style.css'

const Home = () => {
    const user = useSelector((state) => state.auth.user);
    const [featuredAnimeSlides, setFeaturedAnimeSlides] = useState([]);
    const [newRelease, setNewRelease] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [newAdded, setNewAdded] = useState([]);
    const [recommendations, setRecommendations] = useState([]);


    useEffect(() => {
        axios
            .get('http://localhost:5000/home/getFeaturedAnime')
            .then((response) => {
                setFeaturedAnimeSlides(response.data);
            })
            .catch((error) => {
                console.error('Error fetching featured animes: ', error);
            });

        axios.get('http://localhost:5000/home/getNewRelease')
            .then((response) => {
                setNewRelease(response.data);
            })
            .catch((error) => {
                console.error('Error fetching new release animes: ', error);
            });

        axios.get('http://localhost:5000/home/getUpcoming')
            .then((response) => {
                setUpcoming(response.data);
            })
            .catch((error) => {
                console.error('Error fetching upcoming animes: ', error);
            });

        axios.get('http://localhost:5000/home/getNewAdded')
            .then((response) => {
                setNewAdded(response.data);
            })
            .catch((error) => {
                console.error('Error fetching new added animes: ', error);
            });

        if (user) {
            axios.get(`http://localhost:5000/home/recommendations/${user.user_id}`)
                .then((response) => {
                    setRecommendations(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching recommendations: ', error);
                })
        }
    }, [user]);

    return (
        <>
            <Navigation />
            <main className="py-5 px-4 bg-gray-800">
                <section className="browse-section">
                    {/* <h1 className="browse-section-header text-2xl font-bold text-white">Featured Anime</h1> */}
                    <div className='browse-anime-list2'>
                        <Slider slides={featuredAnimeSlides} />
                    </div>
                </section>
                {user && <>
                    <section className="browse-section trending">
                        <div className="browse-section-header">
                            <h2 className='text-2xl font-bold'>BORED ?&nbsp;&nbsp;&nbsp; WATCH &nbsp;THIS...</h2>
                        </div>
                        <div className="browse-anime-list">
                            <CSlider slides={recommendations} slideCount={6} />
                        </div>
                    </section>
                </>}
                <section className="">
                    <div className="home-anime-container">
                        <div className="home-anime-column bg-gray-700">
                            <h3>NEW RELEASE</h3>
                            {newRelease && newRelease.map((release) => (
                                <Link to={`/anime/${release.anime_id}`}>
                                    <div className="home-anime-card">
                                        <img src={release.cover_image} alt={release.title} className="home-anime-image" />
                                        <div className="home-anime-info">
                                            <h4>{release.title}</h4>
                                            <div className='flex'>
                                                <p className='text-gray-400'>{release.showtype ? release.showtype : 'N/A'}</p>
                                                <span className=' pl-2 pr-2 font-extrabold text-gray-400'>.</span>
                                                <p className='text-gray-400'>{release.source ? release.source : 'N/A'}</p>
                                                <span className=' pl-2 pr-2 font-extrabold text-gray-400'>.</span>
                                                <p className='text-gray-400'>{release.release_date ? release.release_date : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="home-anime-column">
                            <h3>NEW ADDED</h3>
                            {newAdded && newAdded.map((up) => (
                                <Link to={`/anime/${up.anime_id}`}>
                                    <div className="home-anime-card2">
                                        <img src={up.cover_image} alt={up.title} className="home-anime-image" />
                                        <div className="home-anime-info">
                                            <h4>{up.title}</h4>
                                            <p className="text-gray-400">Release Date: {up.release_date}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="home-anime-column bg-gray-700">
                            <h3>UPCOMING</h3>
                            {upcoming && upcoming.map((up) => (
                                <Link to={`/anime/${up.anime_id}`}>
                                    <div className="home-anime-card3">
                                        <img src={up.cover_image} alt={up.title} className="home-anime-image" />
                                        <div className="home-anime-info">
                                            <h4>{up.title}</h4>
                                            <div className='flex'>
                                                <p className='text-gray-400'>{up.showtype ? up.showtype : 'N/A'}</p>
                                                <span className=' pl-2 pr-2 font-extrabold text-gray-400'>.</span>
                                                <p className='text-gray-400'>{up.source ? up.source : 'N/A'}</p>
                                                <span className=' pl-2 pr-2 font-extrabold text-gray-400'>.</span>
                                                <p className='text-gray-400'>{up.release_date ? up.release_date : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default Home;
