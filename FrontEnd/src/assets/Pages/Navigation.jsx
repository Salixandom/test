import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './../CSS/style.css'

const Navigation = () => {
    const user = useSelector((state) => state.auth.user);
    const [searchText, setSearchText] = useState('');
    const [resultAnime, setResultAnime] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const [profileMenuContent, setProfileMenuContent] = useState(false);

    const handleChange = (event) => {
        setSearchText(event.target.value);
        handleFetchAnime();
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setIsFocused(false);
        }, 200);
    };

    const handleFetchAnime = () => {
        axios.post('http://localhost:5000/search-box/anime', {
            searchText: searchText,
        })
            .then((response) => {
                setResultAnime(response.data);
            })
            .catch((error) => {
                console.error('Error fetching anime: ', error);
                setResultAnime([]);
            })
    }

    const formatReleaseDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const toggleProfileMenuContent = () => {
        setProfileMenuContent(!profileMenuContent);
    }

    return (
        <>
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"
                integrity="sha512-xh6O/CkQoPOWDdYTDqeRdPCVd1SpvCA9XXcUnZS2FmJNp1coAFzvtCN9BmamE+4aHK8yyUHUSCcJHgXloTyT2A=="
                crossorigin="anonymous"
                referrerpolicy="no-referrer"
            />
            <nav className="navHeader text-white flex justify-between items-center py-4 px-5">
                <div className="flex items-center space-x-5 ">
                    <div className="flex items-center space-x-5 text-xs">
                        <Link to='/'><img src='./../../../public/logo.png' className='h-14 w-28'/></Link>
                        <ul className="flex space-x-3 text-sm text-gray-300">
                            <li>
                                <Link to="/home">Home</Link>
                            </li>
                            <li>
                                <Link to="/browse">Browse</Link>
                            </li>
                            <li>
                                <Link to="/forums-feed">Forum</Link>
                            </li>
                            <li>
                                <Link to="/request">Request</Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="w-[400px] border border-gray-500 rounded flex items-center space-x-5 relative">
                    <input
                        className="w-full bg-gray-900 outline-0 py-2 px-5 text-sm"
                        type="text"
                        placeholder="Search your favorite anime"
                        onChange={handleChange}
                        value={searchText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 300)}
                    />
                    <Link to={{ pathname: '/search', search: searchText }}><i className="fa-solid fa-magnifying-glass px-2 text-gray-500"></i></Link>
                    {isFocused && resultAnime.length > 0 && (
                        <div className="absolute top-8 -left-5 right-0 bg-white shadow-lg mt-2 z-10 w-auto rounded-b-lg border border-gray-900">
                            <div className="text-center flex p-2 justify-between">
                                <p className='border-b border-b-blue-600  text-gray-600'>Anime</p>
                                <Link to={{ pathname: "/search", search: searchText }} className="text-blue-500 hover:text-blue-900">Filter</Link>
                            </div>
                            {resultAnime.map((anime, index) => (
                                <Link to={`/anime/${anime.anime_id}`} key={index} className={index % 2 === 0 ? 'block bg-gray-100 hover:bg-gray-300' : "block hover:bg-gray-300"}>
                                    <div className="flex items-center p-2">
                                        <img src={anime.cover_image} alt={anime.title} className="w-14 h-16 object-cover mr-2" />
                                        <div>
                                            <div className="font-bold text-black">{anime.title}</div>
                                            <div className='flex'>
                                                <span className="inline-block bg-slate-800 text-white rounded-lg text-xs pt-1 pb-0.5 pl-2 pr-2 mr-1"> R: {anime.average_rating}</span>
                                                <p className='text-gray-700 text-sm mr-1'> <span className='font-extrabold mr-1'>.</span> {anime.showtype} </p>
                                                <p className='text-gray-700 text-sm'> <span className='font-extrabold mr-1'>.</span> {formatReleaseDate(anime.release_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            <div className="text-center p-2">
                                <Link to={{ pathname: "/search", search: searchText }} className="text-blue-500 hover:text-blue-900">View all results</Link>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-5 text-base">
                    {user ? (
                        <>
                            <Link to="/profile" className='flex'>
                                {user.url ? <>
                                    <img
                                        src={user.url}
                                        alt={user.display_name}
                                        className="mr-5 translate-y-0.5 h-9 w-9 rounded-full" // Adjust height and width as needed
                                    />
                                </> : <>
                                    <i className="fa-solid fa-user mr-5 translate-y-2.5 text-xl"></i>
                                </>}
                                <h2 className="border border-gray-500 text-gray-300 rounded py-2 px-5 font-bold" style={{ borderColor: "#E91E63", color: "#FFF" }}>{user.display_name}</h2>
                            </Link>
                        </>
                    ) : (
                        <div className="space-x-5">
                            <Link to="/register"><button className=" text-white px-5 py-2 rounded font-bold" style={{background: '#E91E63'}}>Sign Up</button></Link>
                                <Link to="/login"><button className="border px-5 py-2 rounded font-bold" style={{ borderColor: "#E91E63", color: "#FFF"}}>Login</button></Link>
                        </div>
                    )}
                </div>
            </nav>
        </>
    )
}

export default Navigation;