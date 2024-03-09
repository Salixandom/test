import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { updateUser, updateFailure, logout, changePassword, changePasswordFailure } from '../Redux/authSlice';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StatusChart from '../SegmentedProgressBar'
import ScoreDistributionGraph from '../ScoreDistributionGraph';
import LineChart from '../LineChart';
import { Navigation, Footer } from './imports'
import Reviews from '../Review';
import './../CSS/profile.css'
import GenreChart from '../GenreChart';
import UserActivity from '../UserActivity';
import LogTable from '../LogTable';
import Notifications from '../Notification';
import Reports from '../Reports';
import UserRequest from '../UserRequest';

const Profile = () => {

    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [formValues, setFormValues] = useState({
        joinDate: 'N/A',
        email: '',
        username: '',
        displayName: '',
        firstName: '',
        lastName: '',
        displayPic: '../../../public/Gojo.jpeg',
        friends: '',
        password: '',
    });

    const [editMode, setEditMode] = useState(false);
    const [changePasswordMode, setChangePasswordMode] = useState(false);
    const [err, setError] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [nav, setNav] = useState('Overview');
    const [images, setImages] = useState([]);
    const [favoriteList, setFavoriteList] = useState([]);
    const [watchList, setWatchList] = useState([]);
    const [selectedList, setSelectedList] = useState('All');
    const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
    const [userForums, setUserForums] = useState([]);
    const [userReviews, setUserReviews] = useState([]);
    const [genrePreference, setGenrePreference] = useState([]);
    const [userActivity, setUserActivity] = useState([]);
    const [userAnimeInteractions, setUserAnimeInteractions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [reports, setReports] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [userRequests, setUserRequests] = useState([]);

    const [statusSegment, setStatusSegment] = useState({
        planning: 0,
        dropped: 0,
        watching: 0,
        paused: 0,
        completed: 0
    });
    const [scoreData, setScoreData] = useState({
        rating_1: 0,
        rating_2: 0,
        rating_3: 0,
        rating_4: 0,
        rating_5: 0,
        rating_6: 0,
        rating_7: 0,
        rating_8: 0,
        rating_9: 0,
        rating_10: 0
    })
    const [interactionPerDate, setInteractionPerDate] = useState([]);

    useEffect(() => {
        if (user) {
            setFormValues({
                joinDate: user.reg_date || 'N/A',
                email: user.email || '',
                username: user.username || '',
                displayName: user.display_name || '',
                firstName: user.first_name || '',
                lastName: user.second_name || '',
                displayPic: user.url || '../../../public/Gojo.jpeg',
                friends: user.friends || '',
                password: '',
            })

            console.log(user)
            axios.get(`http://localhost:5000/user/profile/watchList/${user.user_id}`)
                .then((response) => {
                    setWatchList(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching watchlist: ', error);
                });


            axios.get(`http://localhost:5000/user/profile/favoriteList/${user.user_id}`)
                .then((response) => {
                    setFavoriteList(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching favorites: ', error);
                });

            axios.get(`http://localhost:5000/user/${user.user_id}/interaction-per-day`)
                .then((response) => {
                    setInteractionPerDate(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching anime interaction per date data: ', error);
                })

            axios.get(`http://localhost:5000/user/${user.user_id}/statusSegment`)
                .then((response) => {
                    setStatusSegment({
                        planning: response.data.planning,
                        dropped: response.data.dropped,
                        watching: response.data.watching,
                        paused: response.data.paused,
                        completed: response.data.completed
                    });
                })
                .catch((error) => {
                    console.error('Error fetching segment data: ', error);
                })

            axios.get(`http://localhost:5000/user/${user.user_id}/scoreGraph`)
                .then((response) => {
                    setScoreData({
                        rating_1: response.data.rating_1,
                        rating_2: response.data.rating_2,
                        rating_3: response.data.rating_3,
                        rating_4: response.data.rating_4,
                        rating_5: response.data.rating_5,
                        rating_6: response.data.rating_6,
                        rating_7: response.data.rating_7,
                        rating_8: response.data.rating_8,
                        rating_9: response.data.rating_9,
                        rating_10: response.data.rating_10
                    });
                })
                .catch((error) => {
                    console.error('Error fetching score graph data: ', error);
                })


            axios.get(`http://localhost:5000/user-profile/forums/${user.user_id}`)
                .then((response) => {
                    setUserForums(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching forums: ', error);
                })

            axios.get(`http://localhost:5000/user-profile/reviews/${user.user_id}`)
                .then((response) => {
                    setUserReviews(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching reviews: ', error);
                })
        }

        axios.get('http://localhost:5000/profile/select-avatar')
            .then((response) => {
                setImages(response.data);
            })
            .catch((error) => {
                console.error('Error fetching avatars: ', error);
            });

        axios.get(`http://localhost:5000/user/genrePreference`)
            .then((response) => {
                setGenrePreference(response.data);
            })
            .catch((error) => {
                console.error('Error fetching genre preferences: ', error);
            })

        axios.get(`http://localhost:5000/userActivity`)
            .then((response) => {
                setUserActivity(response.data);
            })
            .catch((error) => {
                console.error('Error fetching user activity: ', error);
            })

        axios.get(`http://localhost:5000/userAnimeInteraction`)
            .then((response) => {
                setUserAnimeInteractions(response.data);
            })
            .catch((error) => {
                console.error('Error fetching user anime interactions: ', error);
            })


        handleFetchingReports()
        handleFetchingNotification()
        handleFetchingWarning()
        handleFetchingRequest()

        console.log(isImageSelectorOpen);
    }, [])

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const handleFetchingReports = () => {
        axios.get(`http://localhost:5000/admin/reports/${user.user_id}`)
            .then((response) => {
                setReports(response.data);
            })
            .catch((error) => {
                console.error('Error fetching reports: ', error);
            })
    }

    const handleFetchingRequest = () => {
        axios.get(`http://localhost:5000/admin/requests`)
          .then((response) => {
                console.log(response.data)
                setUserRequests(response.data);
            })
          .catch((error) => {
                console.error('Error fetching requests: ', error);
            })
    }

    /* const handleAvatarChange = async (e) => {
        const file = e.target.files[0];

        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const response = await axios.post(`http://localhost:5000/profile/upload-avatar/${user.user_id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                })

                if (response.status === 200) {
                    console.log(response.data);
                    const { profile_picture: updatedAvatar } = response.data.user;
                    setFormValues((prevValue) => ({ ...prevValue, displayPic: updatedAvatar }))
                    console.log('Avatar uploaded successfully')
                }
            } catch (error) {
                console.error('Error uploading avatar: ', error.message);
            }
        }
    } */

    const handleEditModeToggle = () => {
        setEditMode(!editMode)
        setError(null);
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setError(null);

        switch (name) {
            case 'first_name':
                setFormValues({ ...formValues, firstName: value });
                break;
            case 'last_name':
                setFormValues({ ...formValues, lastName: value });
                break;
            case 'new_password':
                setFormValues({ ...formValues, password: value });
                break;
            case 'display_name':
                setFormValues({ ...formValues, displayName: value });
                break;
            case 'confirm_password':
                setConfirmPassword(value);
                break;
            default:
                break;
        }
    };

    const handleSave = async () => {
        try {
            const response = await axios.post('http://localhost:5000/profile/update', {
                first_name: formValues.firstName,
                last_name: formValues.lastName,
                display_name: formValues.displayName,
                user_id: user.user_id,
            })

            if (response.status === 200) {
                setEditMode(false);
                const data = response.data;

                const originalDate = new Date(data.user.reg_date)
                const day = originalDate.getDate();
                const month = originalDate.getMonth() + 1;
                const year = originalDate.getFullYear();
                const formattedDate = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
                data.user.reg_date = formattedDate;

                setConfirmPassword('');
                setError(null);
                dispatch(updateUser(data.user));
            }
            else {
                setError(response.data.message);
                dispatch(updateFailure(response.data.message));
            }
        } catch (err) {
            if (err.response && err.response.status === 400) {
                setError(err.response.data.message)
            }
            else {
                setError('An unexpected error occurred')
                dispatch(updateFailure('An unexpected error occurred'));
            }
            console.error('Error during updating user', err.message);
        }
    }

    const handleImageSelect = async (image) => {

        try {
            axios.post('http://localhost:5000/profile/set-avatar', {
                user_id: user.user_id,
                image_id: image.id,
                image_url: image.url,
                image_alt_text: image.alt_text
            })
                .then((response) => {
                    if (response.status === 200) {
                        console.log(200);
                        setSelectedImage(image.url);
                        formValues.displayPic = image.url;
                        const data = response.data;

                        const originalDate = new Date(data.user.reg_date)
                        const day = originalDate.getDate();
                        const month = originalDate.getMonth() + 1;
                        const year = originalDate.getFullYear();
                        const formattedDate = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
                        data.user.reg_date = formattedDate;
                        dispatch(updateUser(data.user));
                        setAvatarSelectorOpen(false);
                    }
                })
        } catch (error) {
            setError(error.message)
            console.error("Error updating avatar: ", error.message);
        }
    }

    const handleLogout = () => {
        axios.post(`http://localhost:5000/user/logOut`, {
            userID: user.user_id
        })
            .then((response) => {
                dispatch(logout())
                navigate('/home');
            })
            .catch((error) => {
                console.error('Error logging out: ', error.message);
            })
    }

    const toggleChangePasswordMode = () => {
        setChangePasswordMode(!changePasswordMode);
        setError(null);
    }

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleChangePassword = async () => {
        try {
            const response = await axios.post('http://localhost:5000/profile/change-pass', {
                user_id: user.user_id,
                new_password: formValues.password,
                confirmPassword,
            })

            if (response.status === 200) {
                setEditMode(false);
                setChangePasswordMode(false);
                const data = response.data;

                const originalDate = new Date(data.user.reg_date)
                const day = originalDate.getDate();
                const month = originalDate.getMonth() + 1;
                const year = originalDate.getFullYear();
                const formattedDate = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
                data.user.reg_date = formattedDate;

                setConfirmPassword('');
                setError(null);
                dispatch(changePassword(data.user));
            }
            else {
                setError(response.data.message);
                dispatch(changePasswordFailure(response.data.message));
            }
        } catch (err) {
            if (err.response && err.response.status === 400) {
                setError(err.response.data.message)
            }
            else {
                setError('An unexpected error occurred')
                dispatch(changePasswordFailure('An unexpected error occurred'));
            }
            console.error('Error during changing password', err.message);
        }
    }

    const handleFetchingNotification = () => {
        axios.get(`http://localhost:5000/user/${user.user_id}/notificationID`)
            .then((response) => {
                setNotifications(response.data);
            })
            .catch((error) => {
                console.error('Error fetching notification ID: ', error);
            })
    }

    const handleFetchingWarning = () => {
        axios.get(`http://localhost:5000/user/${user.user_id}/warnings`)
            .then((response) => {
                console.log(response.data)
                setWarnings(response.data);
            })
            .catch((error) => {
                console.error('Error fetching warning: ', error);
            })
    }

    const handleSelectedList = (event) => {
        setSelectedList(event.target.value);
    }

    const handleDeleteAccount = () => {
        axios.post(`http://localhost:5000/user/delete`, {
            userID: user.user_id
        })
            .then((response) => {
                dispatch(logout())
                navigate('/home');
                toast.success('For being extra savage, you are banned ' + user.display_name);
            })
            .catch((error) => {
                console.error('Error deleting account: ', error.message);
            })
    }

    const handleVacation = () => {
        axios.post(`http://localhost:5000/go-on-a-vacation`, {
            userID: user.user_id
        })
            .then((response) => {
                dispatch(logout())
                navigate('/home');
                toast.success('We will miss you ' + user.display_name);
            })
            .catch((error) => {
                console.error('Error deleting account: ', error.message);
            })
    }

    return (
        <>
            <Navigation />
            <div className='All'>
                <div className="profile-container">
                    <div className='left-right-container'>
                        <div className="profile-sidebar">
                            <div>
                                <button className='12' onClick={() => setAvatarSelectorOpen(true)}>
                                    <div className='image-container'>
                                        <img src={formValues.displayPic} alt="User Avatar" className="profile-avatar" />
                                        <div class="image-text">&#9997;<br />Change Avatar</div>
                                    </div>
                                </button>
                                <h2 className="username justify-center align-middle">{formValues.displayName}</h2>
                                <div className='flex justify-between mt-5'>
                                    <p className='text-gray-500 text-sm ml-2'>Join Date </p>
                                    <p className='text-gray-500 text-sm mr-2'>{formValues.joinDate}</p>
                                </div>
                                <div className='flex justify-between mt-1'>
                                    <p className='text-gray-500 text-sm ml-2'>Favorites </p>
                                    <p className='text-gray-500 text-sm mr-2'>{favoriteList.length}</p>
                                </div>
                                <div className='flex justify-between mt-1'>
                                    <p className='text-gray-500 text-sm ml-2 mt-1'>Account Type: </p>
                                    <p className='text-red-600 text-lg font-bold mr-2'>{user.type}</p>
                                </div>
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>Log out</button>
                        </div>
                    </div>
                    {avatarSelectorOpen && (
                        <>
                            <div className='modal2 z-10'>
                                <div className='modal-content2'>
                                    <div className='heading-modal flex justify-between text-gray-200'>
                                        <h1 className='modal-title text-2xl font-bold'>Select Your Avatar</h1>
                                        <button onClick={() => setAvatarSelectorOpen(false)}><i className="fas fa-times -translate-y-4 text-xl translate-x-2 hover:text-gray-400"></i></button>
                                    </div>
                                    <div className='flex flex-wrap items-center mt-3'>
                                        {images && images.map((image) => (
                                            <button onClick={() => handleImageSelect(image)}><img src={image.url} alt={image.alt_text} className='h-20 w-20 rounded-xl m-3'></img></button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {deleteOpen && (
                        <>
                            <div className='modal2 z-10'>
                                <div className='modal-content2'>
                                    <div className='heading-modal flex justify-between text-gray-200'>
                                        <h1 className='modal-title text-2xl font-bold'>Account Deletion</h1>
                                        <button onClick={() => setDeleteOpen(false)}><i className="fas fa-times -translate-y-4 text-xl translate-x-2 hover:text-gray-400"></i></button>
                                    </div>
                                    <div className='flex flex-wrap text-left items-center mt-3'>
                                        <p className='text-gray-300 text-sm'>Deleting your account will remove all your interactions and information from the site</p>
                                        <p className='text-red-400 mt-2'>Are you sure you want to delete your account?</p>
                                        <div className='flex justify-center w-full mt-2'>
                                            <button className='bg-gray-300 pt-1 pb-1 pl-3 pr-3 mr-3 font-semibold rounded-md' onClick={handleDeleteAccount}>Yes</button>
                                            <button className='bg-gray-300 pt-1 pb-1 pl-3 pr-3 ml font-semibold rounded-md' onClick={() => setDeleteOpen(false)}>No</button>
                                        </div>
                                        <p className='text-gray-300 text-sm mt-4'>You can also go for a break for several days. This won't remove your information from the site fully</p>
                                        <p className='text-red-400 mt-2'>Wanna go on a break?</p>
                                        <div className='flex justify-center w-full mt-2'>
                                            <button className='bg-gray-300 pt-1 pb-1 pl-3 pr-3 mr-3 font-semibold rounded-md' onClick={handleVacation}>Let's do it</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="profile-content">
                        <nav className="profile-nav">
                            <ul>
                                <li><button onClick={() => setNav("Overview")}>Overview</button></li>
                                <li><button onClick={() => setNav("WatchList")}>Watch List</button></li>
                                <li><button onClick={() => setNav("Favorites")}>Favorites</button></li>
                                <li><button onClick={() => setNav("Stats")}>Stats</button></li>
                                <li><button onClick={() => setNav("Social")}>Social</button></li>
                                <li><button onClick={() => setNav("Notifications")}>Notifications</button></li>
                                {(user && (user.type === "Admin" || user.type === "Moderator")) && <li><button onClick={() => setNav("User Logs")}>User Logs</button></li>}
                                {/* {(user && (user.type === "Admin" || user.type === "Moderator")) && <li><button onClick={() => setNav("Anime List")}>Anime List</button></li>} */}
                                {(user && user.type === "Admin") && <li><button onClick={() => setNav('Requests')}>Requests</button></li>}
                            </ul>
                        </nav>
                        {nav == "Overview" ? <><section className="profile-details">
                            <form className="profile-form">
                                <div className="form-group mt-2">
                                    <label htmlFor="join-date">Join date</label>
                                    <input
                                        type="text"
                                        id="join-date"
                                        name="join_date"
                                        value={formValues.joinDate}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formValues.email}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="username">Username</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formValues.username}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="display-name">Display name</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            id="display-name"
                                            name="display_name"
                                            value={formValues.displayName}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            id="display-name"
                                            name="display_name"
                                            value={formValues.displayName}
                                            onChange={handleInputChange}
                                            disabled
                                        />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="first-name">First name</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            id="first-name"
                                            name="first_name"
                                            value={formValues.firstName}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            id="first-name"
                                            name="first_name"
                                            value={formValues.firstName}
                                            onChange={handleInputChange}
                                            disabled
                                        />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="last-name">Last name</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            id="last-name"
                                            name="last_name"
                                            value={formValues.lastName}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            id="last-name"
                                            name="last_name"
                                            value={formValues.lastName}
                                            onChange={handleInputChange}
                                            disabled
                                        />
                                    )}
                                </div>
                                {changePasswordMode ? (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="new_password">New Password</label>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="new_password"
                                                name="new_password"
                                                value={formValues.password}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="confirm_password">Confirm Password</label>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="confirm_password"
                                                name="confirm_password"
                                                value={confirmPassword}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='flex justify-end'>
                                            <span
                                                className={`toggle-password ${showPassword ? 'visible text-gray-400' : 'text-gray-400'}`}
                                                onClick={handleTogglePassword}
                                            >
                                            </span>
                                        </div>
                                    </>
                                ) : <></>}
                                {err && <div className="error-message">{err}</div>}
                                {editMode ? <></> : (
                                    <>
                                        <div className="form-group">
                                            <button
                                                type="button"
                                                className="change-password-btn"
                                                onClick={toggleChangePasswordMode}
                                            >
                                                {changePasswordMode ? 'Cancel' : '🔑 Change password'}
                                            </button>
                                        </div>
                                    </>
                                )}
                                {changePasswordMode ? (
                                    <button
                                        type='button'
                                        className='change-password-btn'
                                        onClick={handleChangePassword}
                                    >Save</button>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            {
                                                editMode ? (
                                                    <button
                                                        type="button"
                                                        className="change-password-btn"
                                                        onClick={handleSave}
                                                    > Save</button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="change-password-btn"
                                                        onClick={handleEditModeToggle}
                                                    >Update</button>
                                                )}
                                        </div>
                                    </>
                                )}
                            </form>
                            {user.type !== 'Admin' && (<>
                                <div className='flex justify-end'>
                                    <button className='text-gray-400 text-sm' onClick={() => setDeleteOpen(true)}><i class="fas fa-trash"></i> Delete Account</button>
                                </div>
                            </>)}
                        </section></> : (nav === 'WatchList' ? <>
                            <div className='watchlist-main'>
                                <div className='flex justify-between'>
                                    <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3'>Watch List</h1>
                                    <div className="status-dropdown">
                                        <select name="status" id="status" value={selectedList} onChange={handleSelectedList}>
                                            <option value="All">All</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Watching">Watching</option>
                                            <option value="Dropped">Dropped</option>
                                            <option value="Planning">Planning</option>
                                            <option value="Paused">Paused</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="watchlist-container">
                                    {watchList && watchList.filter(item => selectedList === 'All' || item.status === selectedList).map((item) => (
                                        <div className="watchlist-card">
                                            <Link to={`/anime/${item.anime_id}`} className='cards min-w-44'>
                                                <div className="card-image">
                                                    <img src={item.cover_image} alt={item.title} />
                                                    <div className="card-title">{item.title}</div>
                                                </div>
                                            </Link>
                                            <div className="card-content">

                                                <p className="airing-time">{item.airing_season}</p>
                                                <p className="episode-info2">{item.showtype} • {item.episode_no ? item.episode_no : 'N/A'} episodes • {item.source}</p>
                                                <p className="description">{item.description.substr(0, 100)}...</p>
                                                <div className="genre-container">
                                                    {item.genres && item.genres.slice(0, 3).map((genre) => (
                                                        <span className="genre">{genre}</span>
                                                    ))}
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </> : (nav === 'Favorites' ? (<>
                            <div className='watchlist-main'>
                                <div className='flex justify-between'>
                                    <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2'>Favorites</h1>
                                </div>
                                <div className="watchlist-container">
                                    {favoriteList && favoriteList.map((favorite) => (

                                        <div className="watchlist-card">
                                            <Link to={`/anime/${favorite.anime_id}`} className='cards min-w-44'>
                                                <div className="card-image">
                                                    <img src={favorite.cover_image} alt={favorite.title} />
                                                    <div className="card-title">{favorite.title}</div>
                                                </div>
                                            </Link>
                                            <div className="card-content">

                                                <p className="airing-time">{favorite.airing_season}</p>
                                                <p className="episode-info2">{favorite.showtype} • {favorite.episode_no ? favorite.episode_no : 'N/A'} episodes • {favorite.source}</p>
                                                <p className="description">{favorite.description.substr(0, 100)}...</p>
                                                <div className="genre-container">
                                                    {favorite.genres && favorite.genres.slice(0, 3).map((genre) => (
                                                        <span className="genre">{genre}</span>
                                                    ))}
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>) : (nav === "Stats" ? (<>
                            <div className='watchlist-main'>
                                <div><h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2'>Stats</h1></div>
                                <div className='pt-3 pb-7 pl-7 pr-7'>
                                    <div className="distribution-container2 mt-6">
                                        <h2 className="distribution-title">Recent Activity Per Day</h2>
                                        <LineChart interactionsData={interactionPerDate} />
                                    </div>
                                    <div className="distribution-container2 status-container mt-6">
                                        <h2 className="distribution-title">Status Distribution</h2>
                                        <div className="status-buttons-container">
                                            <span className="status-item">
                                                <button className="status-button current">Current</button>
                                                <span className="status-count" style={{ color: "#2ab363" }}>{statusSegment.watching} Users</span>
                                            </span>
                                            <span className="status-item">
                                                <button className="status-button planning">Planning</button>
                                                <span className="status-count" style={{ color: "#2c84bf" }}>{statusSegment.planning} Users</span>
                                            </span>
                                            <span className="status-item">
                                                <button className="status-button dropped">Dropped</button>
                                                <span className="status-count" style={{ color: "#d34637" }}>{statusSegment.dropped} Users</span>
                                            </span>
                                            <span className="status-item">
                                                <button className="status-button completed">Completed</button>
                                                <span className="status-count" style={{ color: "#9454ad" }}>{statusSegment.completed} Users</span>
                                            </span>
                                            <span className="status-item">
                                                <button className="status-button paused">Paused</button>
                                                <span className="status-count" style={{ color: "#d6ae0d" }}>{statusSegment.paused} Users</span>
                                            </span>
                                        </div>
                                        <StatusChart statusSegment={statusSegment} />
                                    </div>

                                    <div className="distribution-container2 score-container mt-8">
                                        <h2 className="distribution-title">Score Distribution</h2>
                                        <ScoreDistributionGraph scoreData={scoreData} />
                                    </div>
                                    {(user && (user.type === "Admin" || user.type === "Moderator")) && (<>
                                        <div className="distribution-container2 mt-6">
                                            <h2 className="distribution-title">User Genre Preference</h2>
                                            <GenreChart genreData={genrePreference} />
                                        </div>
                                        <div className="distribution-container2 mt-6">
                                            <h2 className="distribution-title">Daily Active Users</h2>
                                            <UserActivity userActivity={userActivity} />
                                        </div>
                                    </>)}
                                </div>
                            </div>
                        </>) : (nav === "Social" ? (<>
                            <div className='watchlist-main'>
                                <div className="comment-section" style={{ backgroundColor: '#10161D' }}>
                                    <div className="flex justify-between">
                                        <h2 className='text-gray-200 text-3xl font-bold -translate-x-1 -translate-y-2 mb-2'>Top Forums</h2>
                                    </div>
                                    {userForums && userForums.map((forum) => (
                                        <div className="discussion-list-item mb-4">
                                            <div className="discussion-list-info">
                                                <Link to={`/forum/${forum.forum_id}`}><p className="discussion-list-title mb-2 text-gray-300">{forum.title}</p></Link>
                                                <p className='discussion-text mb-2 text-sm text-gray-500'>{forum.description}</p>
                                                <div className='flex '>
                                                    <img src={user.url || '../../../public/Gojo.jpeg'} alt='User Name' className='h-5 w-5 rounded-full' />
                                                    <div className='flex'>
                                                        <Link to="/profile" className=' pl-2 text-red-600 font-bold text-sm'>{user.display_name}</Link>
                                                        <p className='ml-2 text-sm text-gray-400'> created this forum on {formatDate(forum.created_at)}</p>
                                                        <Link className="ml-1 text-sm text-gray-400" to={`/anime/${forum.anime_id}`}>for<span className="ml-1 text-purple-700 font-bold text-sm">{forum.anime_title}</span> anime</Link>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex">
                                                <p className="discussion-list-reply-count"><i class="fas fa-comments"></i> {forum.total_replies}</p>
                                                <p className="discussion-list-reply-count"><i class="fas fa-eye"></i> {forum.total_views}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="comment-section" style={{ backgroundColor: '#10161D' }}>
                                    <div className="flex justify-between">
                                        <h2 className='text-gray-200 text-3xl font-bold -translate-x-1 -translate-y-2 mb-2'>Top Reviews</h2>
                                    </div>
                                    {userReviews && userReviews.map((review, index) => (
                                        <Reviews review={review} comingFromUser={"Yes"} />
                                    ))}
                                </div>
                            </div>
                        </>) : (nav === "User Logs" ? (<>
                            <div className='watchlist-main'>
                                <div><h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2 pb-3'>Logs</h1></div>
                                <div className='m-3 rounded-md z-3'>
                                    <LogTable data={userAnimeInteractions} />
                                </div>
                            </div>
                        </>) : (nav === "Notifications" ? (<>
                            <div className="watchlist-main">
                                <div className="userProf-interaction-section">
                                    <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2 pb-3'>Interactions</h1>
                                    <div className='userProf-notifications-container'>
                                        {notifications && notifications.map((id) => (
                                            <Notifications notification={id} handleFetchingNotification={handleFetchingNotification} />
                                        ))}
                                    </div>
                                </div>
                                {(user.type === "Admin") ? (<>
                                    <div className="userProf-interaction-section pb-0.5">
                                        <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2 pb-5'>Reports</h1>
                                        <div className='userProf-notifications-container'>
                                            {reports && reports.map((id) => (
                                                <Reports report={id} handleFetchingReports={handleFetchingReports} />
                                            ))}
                                        </div>
                                    </div>
                                </>) : (user.type === "Moderator" ? (<>
                                    <div className="userProf-interaction-section pb-0.5">
                                        <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2 pb-5'>Reports</h1>
                                        <div className='userProf-notifications-container'>
                                            {reports && reports.map((id) => (
                                                <Reports report={id} handleFetchingReports={handleFetchingReports} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="userProf-interaction-section pb-0.5">
                                        <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2 pb-5'>Warnings</h1>
                                        <div className='userProf-notifications-container'>
                                            {warnings && warnings.map((id) => (
                                                <Notifications notification={id} handleFetchingNotification={handleFetchingWarning} />
                                            ))}
                                        </div>
                                    </div>
                                </>) : (<>
                                    <div className="userProf-interaction-section pb-0.5">
                                        <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2 pb-5'>Warnings</h1>
                                        <div className='userProf-notifications-container'>
                                            {warnings && warnings.map((id) => (
                                                <Notifications notification={id} handleFetchingNotification={handleFetchingWarning} />
                                            ))}
                                        </div>
                                    </div>
                                </>))}
                            </div>
                        </>) : (nav === 'Requests' ? (<>
                            <div className='watchlist-main'>
                                <h1 className='text-gray-200 text-3xl font-bold translate-x-4 translate-y-3 mb-2 pb-3'>User Requests</h1>
                                <div className='userProf-notifications-container'>
                                    {userRequests && userRequests.map((id) => (
                                        <UserRequest request={id} handleFetchingUserRequest={handleFetchingRequest} />
                                    ))}
                                </div>
                            </div>
                        </>) : (<></>))))))))}
                    </div>
                </div>
            </div >
            <Footer />
        </>
    )
}

export default Profile;