import React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Navigation, Footer } from './imports'
import './../CSS/style.css'

const SearchPage = () => {
    const location = useLocation();
    const sortMenuRef = useRef(null);

    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('Any')
    const [selectedYear, setSelectedYear] = useState('Any')
    const [selectedSeason, setSelectedSeason] = useState('Any')
    const [selectedFormat, setSelectedFormat] = useState('Any')
    const [selectedRating, setSelectedRating] = useState('Any')
    const [selectedSortOption, setSelectedSortOption] = useState('Popularity')
    const [sortMenuContent, setSortMenuContent] = useState(false)
    const [rated, setRated] = useState('Any');
    const [searchText, setSearchText] = useState(location.search.substring(1, location.search.length));

    const yearsArray = Array.from({ length: 2025 - 1917 + 1 }, (_, index) => (1917 + index).toString());
    const formatsArray = ['TV', 'Movie', 'OVA', 'ONA', 'TV Special', 'Special', 'Music', 'PV', 'CM']
    const ratingArray = ['G', 'PG-13', 'PG', 'R-17+', 'R+']


    const [result, setResult] = useState([]);
    const [displayLimit, setDisplayLimit] = useState(35);

    useEffect(() => {

        const handleClickOutside = (event) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
                setSortMenuContent(false); // Close the menu if click is outside
            }
        };

        axios.get('http://localhost:5000/search/getGenreTypes')
            .then((response) => {
                setGenres(response.data);
            })
            .catch((error) => {
                console.error('Error fetching genres: ', error);
                setGenres([]);
            })

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sortMenuRef, searchText, selectedGenre, selectedYear, selectedSeason, selectedFormat, selectedRating, selectedSortOption])


    useEffect(() => {
        handleFetchByCriteria();

        // Add scroll event listener to window
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [searchText, selectedGenre, selectedYear, selectedSeason, selectedFormat, selectedRating, selectedSortOption, displayLimit, rated]);


    const handleScroll = () => {
        const threshold = 20; // Adjust based on your needs
        const currentPosition = window.innerHeight + document.documentElement.scrollTop;
        const nearBottom = currentPosition >= document.documentElement.offsetHeight - threshold;

        if (nearBottom) {
            setDisplayLimit((prevLimit) => prevLimit + 35); // Increase limit by 35 upon reaching near bottom
        }
    };



    const handleSearchText = (event) => {
        setSearchText(event.target.value);
        setDisplayLimit(35);
        /* handleFetchByCriteria(); */
    }


    const handleFetchByCriteria = () => {
        const params = {
            title: searchText,
            genre_name: selectedGenre,
            release_date: selectedYear,
            airing_season: selectedSeason,
            show_type: selectedFormat,
            rated: rated,
            orderBy: selectedSortOption
        }

        axios.get('http://localhost:5000/search/anime/criteria', { params })
            .then((response) => {
                console.log(response.data)
                setResult(response.data)
            })
            .catch((error) => {
                console.error('Error fetching search anime: ', error);
            })
    }

    const handleSelectedGenre = (event) => {
        setSelectedGenre(event.target.value)
        setDisplayLimit(35);
    }

    const handleSelectedYear = (event) => {
        setSelectedYear(event.target.value)
        setDisplayLimit(35);
    }

    const handleSelectedSeason = (event) => {
        setSelectedSeason(event.target.value)
        setDisplayLimit(35);
    }

    const handleSelectedFormat = (event) => {
        setSelectedFormat(event.target.value)
        setDisplayLimit(35);
    }

    const handleSelectedRating = (event) => {
        setSelectedRating(event.target.value)
        if (event.target.value === 'G') {
            setRated('G - All Ages')
        } else if (event.target.value === 'PG-13') {
            setRated('PG-13 - Teens 13 or older')
        } else if (event.target.value === 'PG') {
            setRated('PG - Children')
        } else if (event.target.value === 'R-17+') {
            setRated('R - 17+ (violence & profanity)')
        } else if (event.target.value === 'R+') {
            setRated('R+ - Mild Nudity')
        } else if (event.target.value === 'Rx') {
            setRated('Rx - Hentai')
        } else {
            setRated('Any')
        }
        setDisplayLimit(35);
    }


    const toggleSortMenuContent = () => {
        setSortMenuContent(!sortMenuContent);
    }


    return (<>
        <Navigation />
        <div className='bg-gray-800 p-5'>
            <div className="Searchpage-container">
                <div className="Searchpage-navbar">
                    <div className="Searchpage-filters">
                        <div>
                            <label htmlFor="search">Search</label>
                            <input type="text" id="search" placeholder="Search" value={searchText} onChange={handleSearchText} />
                        </div>
                        <div>
                            <label htmlFor="genres">Genres</label>
                            <select id="genres" className='Searchpage-select' value={selectedGenre} onChange={handleSelectedGenre}>
                                <option value="Any">Any</option>
                                {genres && genres.map((genre) => (
                                    <option key={genre.genre_id} value={genre.genre_name}>{genre.genre_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="years">Year</label>
                            <select id="years" className='Searchpage-select' value={selectedYear} onChange={handleSelectedYear}>
                                <option value="Any">Any</option>
                                {yearsArray.map((year, index) => (
                                    <option key={index} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="season">Season</label>
                            <select id="season" className='Searchpage-select' value={selectedSeason} onChange={handleSelectedSeason}>
                                <option value="Any">Any</option>
                                <option value="Winter">Winter</option>
                                <option value="Summer">Summer</option>
                                <option value="Spring">Spring</option>
                                <option value="Fall">Fall</option>
                            </select>
                        </div>
                        <div>
                            <label for="format">Format</label>
                            <select id="format" className='Searchpage-select' value={selectedFormat} onChange={handleSelectedFormat}>
                                <option value="Any">Any</option>
                                {formatsArray.map((format, index) => (
                                    <option key={index} value={format}>{format}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label for="rating">Censorship</label>
                            <select id="rating" className='Searchpage-select' value={selectedRating} onChange={handleSelectedRating}>
                                <option value="Any">Any</option>
                                {ratingArray.map((rating, index) => (
                                    <option key={index} value={rating}>{rating}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between w-auto">
                        <div className='flex'>
                            <p className='text-xl'>🏷️</p>
                            <div className="Searchpage-tag-icon ml-2 mr-2">
                                {searchText && (
                                    <button className='mr-2 pl-2 pr-2 pt-1 pb-1' onClick={() => setSearchText('')}>
                                        <span className="button-text text-center">
                                            Search: {searchText} <span className="remove-icon text-gray-200 pl-1">x</span>
                                        </span>
                                    </button>
                                )}
                                {selectedGenre !== 'Any' && (
                                    <button className='mr-2 pl-2 pr-2 pt-1 pb-1' onClick={() => setSelectedGenre('Any')}>
                                        <span className="button-text text-center">
                                            {selectedGenre} <span className="remove-icon text-gray-200 pl-1">x</span>
                                        </span>
                                    </button>
                                )}
                                {selectedYear !== 'Any' && (
                                    <button className='mr-2 pl-2 pr-2 pt-1 pb-1' onClick={() => setSelectedYear('Any')}>
                                        <span className="button-text text-center">
                                            {selectedYear} <span className="remove-icon text-gray-200 pl-1">x</span>
                                        </span>
                                    </button>
                                )}
                                {selectedSeason !== 'Any' && (
                                    <button className='mr-2 pl-2 pr-2 pt-1 pb-1' onClick={() => setSelectedSeason('Any')}>
                                        <span className="button-text text-center">
                                            {selectedSeason} <span className="remove-icon text-gray-200 pl-1">x</span>
                                        </span>
                                    </button>
                                )}
                                {selectedFormat !== 'Any' && (
                                    <button className='mr-2 pl-2 pr-2 pt-1 pb-1' onClick={() => setSelectedFormat('Any')}>
                                        <span className="button-text text-center">
                                            {selectedFormat} <span className="remove-icon text-gray-200 pl-1">x</span>
                                        </span>
                                    </button>
                                )}
                                {selectedRating !== 'Any' && (
                                    <button className='mr-2 pl-2 pr-2 pt-1 pb-1' onClick={() => { setSelectedRating('Any'); setRated('Any') }}>
                                        <span className="button-text text-center">
                                            {selectedRating} <span className="remove-icon text-gray-200 pl-1">x</span>
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className='sort-menu-button'>
                            <div ref={sortMenuRef}>
                                <button className='comment-menu-trigger' onClick={toggleSortMenuContent}>{selectedSortOption}</button>
                                {sortMenuContent && (
                                    <>
                                        <div className='sort-menu-content'>
                                            <ul>
                                                <li><button onClick={() => { setSelectedSortOption('Title'); setSortMenuContent(false) }}>Title</button></li>
                                                <li><button onClick={() => { setSelectedSortOption('Popularity'); setSortMenuContent(false) }}>Popularity</button></li>
                                                <li><button onClick={() => { setSelectedSortOption('Average Score'); setSortMenuContent(false) }}>Average Score</button></li>
                                                <li><button onClick={() => { setSelectedSortOption('Release Date'); setSortMenuContent(false) }}>Release Date</button></li>
                                                <li><button onClick={() => { setSelectedSortOption('Trending'); setSortMenuContent(false) }}>Trending</button></li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="Searchpage-gallery">
                    {result && result.slice(0, displayLimit).map((anime, index) => (
                        <Link to={`/anime/${anime.anime_id}`} className="Searchpage-link">
                            <div className="Searchpage-poster">
                                <img src={anime.cover_image} alt={anime.title} />
                                <div className="Searchpage-details">
                                    <label>{anime.title}</label>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </div>
        <Footer />
    </>)
}

export default SearchPage;