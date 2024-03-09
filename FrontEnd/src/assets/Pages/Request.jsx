import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navigation, Footer } from './imports';
import './../CSS/request.css';

const Request = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        details: '',
        type: '',
        language: '',
        genres: [],
        malLink: '',
        instructions: ''
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            if (e.target.checked) {
                setFormData({
                    ...formData,
                    genres: [...formData.genres, value]
                });
            } else {
                setFormData({
                    ...formData,
                    genres: formData.genres.filter(genre => genre !== value)
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        if(user) {
            e.preventDefault();
            console.log(formData)
            axios.post('http://localhost:5000/user-request', {
                formData: formData,
                userID: user.user_id
            })
                .then((response) => {
                    toast.success('Request was submitted successfully')
                    navigate('/home')
                })
                .catch((error) => {
                    console.error('Error submitting request: ', error);
                    toast.error('Error submitting request')
                })
        } else {
            toast.error('Please login first')
            navigate('/login')
        }
    };

    return (
        <>
            <Navigation />
            <body className='request-body'>
                <div className="request-container">
                    <h1 className='font-bold text-3xl'>Request for Anime</h1>

                    <form id="anime-request-form" onSubmit={handleSubmit}>
                        <div className="request-form-group">
                            <label htmlFor="title-of-request">Title of Anime</label>
                            <input type="text" id="title-of-request" name="title" placeholder="Enter the title of your anime" onChange={handleChange} />
                        </div>

                        <div className="request-form-group">
                            <label htmlFor="request-details">Anime Details</label>
                            <textarea id="request-details" name="details" placeholder="Please specify your anime requirements here. Try to include as many details as you can." onChange={handleChange}></textarea>
                        </div>

                        <div className="request-form-group">
                            <div className="request-type-of-anime">
                                <label htmlFor="type-ofanime">Type of Anime</label>
                                <select id="type-ofanime" name="type" value={formData.type} onChange={handleChange}>
                                    <option value="" disabled>Select the type of anime</option>
                                    <option value="tv">TV series</option>
                                    <option value="movie">Movie</option>
                                    <option value="ova">OVA</option>
                                </select>
                            </div>
                        </div>

                        <div className="request-form-group">
                            <label htmlFor="language">Preferred Language / Subtitles</label>
                            <input type="text" id="language" name="language" placeholder="e.g., Japanese with English subtitles" onChange={handleChange} />
                        </div>

                        <div className="request-form-group">
                            <label>Preferred Genres</label>
                            <div className="request-checkbox-group">
                                <label><input type="checkbox" name="genre" value="Action" onChange={handleChange} /> Action</label>
                                <label><input type="checkbox" name="genre" value="Comedy" onChange={handleChange} /> Comedy</label>
                                <label><input type="checkbox" name="genre" value="Horror" onChange={handleChange} /> Horror</label>
                                <label><input type="checkbox" name="genre" value="Fantasy" onChange={handleChange} /> Fantasy</label>
                                <label><input type="checkbox" name="genre" value="Adventure" onChange={handleChange} /> Adventure</label>
                            </div>
                        </div>

                        <div className='request-form-group'>
                            <label htmlFor="malLink">My Anime List link</label>
                            <input type="url" id="malLink" name="malLink" placeholder="Add the MAL link for reference" onChange={handleChange} />
                        </div>

                        <div className="request-form-group">
                            <label htmlFor="special-instructions">Special Instructions</label>
                            <textarea id="special-instructions" name="instructions" placeholder="Any specific requests or details you want to add" onChange={handleChange}></textarea>
                        </div>

                        <div className="request-submit-btn"><button type="submit" className="request-submit-button">Submit</button></div>

                    </form>
                </div>
            </body>
            <Footer />
        </>
    );
}

export default Request;
