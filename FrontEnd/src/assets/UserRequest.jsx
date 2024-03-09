import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CSS/profile.css'
import './CSS/style.css'
import './CSS/insertion.css'

const UserRequest = ({ request, handleFetchingUserRequest }) => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [addAnimeOpen, setAddAnimeOpen] = useState(false)
    const [animeFormData, setAnimeFormData] = useState({
        title: '',
        releaseDate: '',
        description: '',
        coverImage: '',
        ongoingStatus: '',
        runTime: '',
        airingSeason: '',
        source: '',
        showType: [],
        language: '',
        topImage: '',
        episodeNo: '',
        rated: '',
        trailer: '',
        genres: []
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name === 'genres') {
            // Handle checkbox group for genres
            setAnimeFormData(prevState => ({
                ...prevState,
                genres: checked
                    ? [...prevState.genres, value]
                    : prevState.genres.filter(genre => genre !== value),
            }));
        } else if (type === 'checkbox') {
            // Handle checkbox group for showType
            setAnimeFormData(prevState => ({
                ...prevState,
                showType: checked
                    ? [...prevState.showType, value]
                    : prevState.showType.filter(type => type !== value),
            }));
        } else {
            setAnimeFormData(prevState => ({
                ...prevState,
                [name]: value,
            }));
        }
    };

    const handleDelete = () => {
        axios.post('http://localhost:5000/request/delete', {
            requestID: request.request_id,
        })
            .then((response) => {
                handleFetchingUserRequest();
                toast.success("Request deleted successfully")
            })
            .catch((error) => {
                console.error('Error deleting request: ', error);
                toast.error("Error deleting request")
            })
    }

    const handleAdd = (e) => {
        e.preventDefault();
        console.log(animeFormData)
        axios.post('http://localhost:5000/anime/add', {
            animeFormData: animeFormData,
            requestID: request.request_id,
        })
            .then(response => {
                handleFetchingUserRequest();
                toast.success('Anime added successfully');
                setAddAnimeOpen(false);
            })
            .catch(error => {
                console.error('Error adding anime: ', error);
                toast.error('Error adding anime');
            });
    };

    return (
        <>
            <div className='userProf-notification-item m-5'>
                <div className="userProf-notification-header">
                    <div className='flex'>
                        <span className="userProf-notification-type pb-0.5 pr-2">Request by </span>
                        <img src={request.url || './../../public/Gojo.jpeg'} className='userProf-user-profile -translate-y-2' />
                        <Link className='userProf-notification-type' to={`/user-profile/${request.user_id}`} style={{ color: '#dc2626' }}>{request.display_name}</Link>
                    </div>
                    <span className="userProf-notification-time">{request.req_date}</span>
                </div>
                <div className="">
                    <h2 className="text-lg text-white font-bold mb-3">Anime Request Details</h2>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-gray-200">Title:</span> <span className='text-gray-400'>{request.title}</span></p>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-gray-200">Details:</span> <span className='text-gray-400'>{request.details}</span></p>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-gray-200">Type:</span> <span className='text-gray-400'>{request.type}</span></p>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-gray-200">Language:</span> <span className='text-gray-400'>{request.language}</span></p>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-gray-200">Genres:</span> <span className='text-gray-400'>{request.genres}</span></p>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-gray-200">MAL Link:</span> <span className='text-gray-400'><Link to={request.mal_link} target='_blank'>{request.mal_link}</Link></span></p>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-gray-200">Instructions:</span> <span className='text-gray-400'>{request.instructions}</span></p>
                </div>
                <div className='flex justify-end'>
                    <button className='userProf-notification-action mr-2' onClick={() => setAddAnimeOpen(true)}>Add</button>
                    <button className='userProf-notification-action ' onClick={handleDelete}>Delete</button>
                </div>
            </div>
            {addAnimeOpen && (
                <>
                    <div className='modal2 z-10'>
                        <div className='modal-content3'>
                            <div className='heading-modal flex justify-between text-gray-200'>
                                <h1 className='modal-title2 text-2xl font-bold'>Add Anime</h1>
                                <button onClick={() => setAddAnimeOpen(false)}><i className="fas fa-times -translate-y-4 text-xl translate-x-2 hover:text-gray-400"></i></button>
                            </div>
                            <div className='insertion-container3'>
                                <form className='anime-form3'>
                                    <input type="text" id="title" name="title" placeholder="Title" onChange={handleChange}/>
                                    <input type="date" id="releaseDate" name="releaseDate" placeholder="Release Date" onChange={handleChange}/>
                                    <textarea id="description" name="description" placeholder="Description" onChange={handleChange}></textarea>
                                    <input type="url" id="coverImage" name="coverImage" placeholder="Cover Image URL" onChange={handleChange}/>
                                    <input type="text" id="ongoingStatus" name="ongoingStatus" placeholder="Ongoing Status" onChange={handleChange}/>
                                    <input type="text" id="runTime" name="runTime" placeholder="Run Time" onChange={handleChange}/>
                                    <input type="text" id="airingSeason" name="airingSeason" placeholder="Airing Season" onChange={handleChange}/>
                                    <input type="text" id="source" name="source" placeholder="Source" onChange={handleChange}/>
                                    <fieldset id="show-type">
                                        <legend>Show Type</legend>
                                        <label><input type="checkbox" name="show-type" value="TV" onChange={handleChange}/> TV</label>
                                        <label><input type="checkbox" name="show-type" value="OVA" onChange={handleChange}/> OVA</label>
                                        <label><input type="checkbox" name="show-type" value="Movie" onChange={handleChange} /> Movie</label>
                                        <label><input type="checkbox" name="show-type" value="ONA" onChange={handleChange} /> ONA</label>
                                        <label><input type="checkbox" name="show-type" value="TV Special" onChange={handleChange} /> TV Special</label>
                                        <label><input type="checkbox" name="show-type" value="Special" onChange={handleChange} /> Special</label>
                                        <label><input type="checkbox" name="show-type" value="PV" onChange={handleChange} /> PV</label>
                                        <label><input type="checkbox" name="show-type" value="CM" onChange={handleChange} /> CM</label>
                                    </fieldset>
                                    <input type="text" id="language" name="language" placeholder="Language" onChange={handleChange} />
                                    <input type="url" id="topImage" name="topImage" placeholder="Top Image URL" onChange={handleChange} />
                                    <input type="number" id="episodeNo" name="episodeNo" placeholder="Episode No" onChange={handleChange} />
                                    <select id="rated" name="rated" value={animeFormData.rated} onChange={handleChange}>
                                        <option value="" disabled selected>Rated - select tag</option>
                                        <option value="G - All Ages">G - All Ages</option>
                                        <option value="PG-13 - Teens 13 or older">PG-13 - Teens 13 or older</option>
                                        <option value="PG - Children">PG - Children</option>
                                        <option value="R - 17+ (violence & profanity)">R - 17+ (violence & profanity)</option>
                                        <option value="R+ - Mild Nudity">R+ - Mild Nudity</option>
                                    </select>
                                    <input type="url" id="trailer" name="trailer" placeholder="Trailer URL" onChange={handleChange}/>
                                    <fieldset id="genres">
                                        <legend>Genres</legend>
                                        <label><input type="checkbox" name="genres" value="Action" onChange={handleChange} /> Action</label>
                                        <label><input type="checkbox" name="genres" value="Romance" onChange={handleChange} /> Romance</label>
                                        <label><input type="checkbox" name="genres" value="Comedy" onChange={handleChange} /> Comedy</label>
                                        <label><input type="checkbox" name="genres" value="Sci-Fi" onChange={handleChange} /> Sci-Fi</label>
                                        <label><input type="checkbox" name="genres" value="Slice of Life" onChange={handleChange} /> Slice of Life</label>
                                        <label><input type="checkbox" name="genres" value="Sports" onChange={handleChange} /> Sports</label>
                                        <label><input type="checkbox" name="genres" value="Drama" onChange={handleChange} /> Drama</label>
                                        <label><input type="checkbox" name="genres" value="Adventure" onChange={handleChange} /> Adventure</label>
                                        <label><input type="checkbox" name="genres" value="Fantasy" onChange={handleChange} /> Fantasy</label>
                                        <label><input type="checkbox" name="genres" value="Horror" onChange={handleChange} /> Horror</label>
                                        <label><input type="checkbox" name="genres" value="Mystery" onChange={handleChange} /> Mystery</label>
                                        <label><input type="checkbox" name="genres" value="Suspense" onChange={handleChange} /> Suspense</label>
                                    </fieldset>
                                    <button type="button" onClick={handleAdd}>Submit</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default UserRequest;