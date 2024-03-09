import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux"
import { Navigation, Footer } from './imports'
import { useParams } from "react-router-dom"
import StatusChart from "../SegmentedProgressBar"
import { Link, useNavigate } from 'react-router-dom';
import './../CSS/userProf.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserActivity from '../UserActivity';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const UserProfile = () => {
    let { userID } = useParams();
    const navigate = useNavigate();
    console.log(userID);
    const user = useSelector((state) => state.auth.user)
    const [userProfile, setUserProfile] = useState({});
    const [statusSegment, setStatusSegment] = useState({
        planning: 0,
        dropped: 0,
        watching: 0,
        paused: 0,
        completed: 0
    });
    const [favoriteList, setFavoriteList] = useState([]);
    const [latestInteractions, setLatestInteractions] = useState([]);
    const [avgScore, setAvgScore] = useState(0);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportContent, setReportContent] = useState("");
    const [hasChanged, setHasChanged] = useState(false);
    const [totalReplies, setTotalReplies] = useState(0);
    const [lastActive, setLastActive] = useState("");
    const [userActivity, setUserActivity] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [isBanOpen, setIsBanOpen] = useState(false);

    useEffect(() => {
        axios.get(`http://localhost:5000/user-profile/${userID}`)
            .then((response) => {
                setUserProfile(response.data);
            })
            .catch((error) => {
                console.error('Error fetching user profile: ', error);
            })

        axios.get(`http://localhost:5000/user/${userID}/statusSegment`)
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

        axios.get(`http://localhost:5000/user/profile/favoriteList/${userID}`)
            .then((response) => {
                setFavoriteList(response.data);
            })
            .catch((error) => {
                console.error('Error fetching favorites: ', error);
            });

        axios.get(`http://localhost:5000/user-profile/${userID}/latestInteractions`)
            .then((response) => {
                setLatestInteractions(response.data);
            })
            .catch((error) => {
                console.error('Error fetching latest interactions: ', error);
            });

        axios.get(`http://localhost:5000/user-profile/${userID}/avgScore`)
            .then((response) => {
                setAvgScore(response.data.avgscore);
            })
            .catch((error) => {
                console.error('Error fetching average score: ', error);
            });

        axios.get(`http://localhost:5000/user-profile/${userID}/totalReplies`)
            .then((response) => {
                setTotalReplies(response.data);
            })
            .catch((error) => {
                console.error('Error fetching total replies: ', error);
            });

        axios.get(`http://localhost:5000/user-profile/${userID}/lastActive`)
            .then((response) => {
                setLastActive(response.data);
            })
            .catch((error) => {
                console.error('Error fetching last active: ', error);
            })

        axios.get(`http://localhost:5000/user-profile/${userID}/userActivity`)
            .then((response) => {
                setUserActivity(response.data);
            })
            .catch((error) => {
                setUserActivity([])
                console.error('Error fetching user activity: ', error);
            })

    }, [hasChanged])

    const fetchUserProfile = () => {
        axios.get(`http://localhost:5000/user-profile/${userID}`)
            .then((response) => {
                setUserProfile(response.data);
            })
            .catch((error) => {
                console.error('Error fetching user profile: ', error);
            })
    }

    const handleReportContent = (event) => {
        setReportContent(event.target.value);
    }

    const handleReportSubmit = () => {
        if (reportContent === "") {
            alert("Report content cannot be empty")
        } else {
            axios.post(`http://localhost:5000/user/report`, {
                reported_user_id: userProfile.user_id,
                reporting_user_id: user.user_id,
                reason: reportContent
            })
                .then((response) => {
                    setIsReportOpen(false);
                    setReportContent("");
                })
                .catch((error) => {
                    console.error('Error submitting report: ', error);
                })
        }
    }

    const handlePromotion = () => {
        axios.post(`http://localhost:5000/userProfile/promotion-demotion`, {
            adminID: user.user_id,
            userID: userProfile.user_id,
            type: "Moderator"
        })
            .then((response) => {
                setUserProfile(response.data);
                setHasChanged(true);
                toast.success(userProfile.display_name + " was successfully promoted to Moderator")
            })
            .catch((error) => {
                console.error('Error promoting user: ', error);
                toast.error(userProfile.display_name + " could not be promoted to Moderator")
            })
    }

    const handleDemotion = () => {
        axios.post(`http://localhost:5000/userProfile/promotion-demotion`, {
            adminID: user.user_id,
            userID: userProfile.user_id,
            type: "Member"
        })
            .then((response) => {
                setUserProfile(response.data);
                setHasChanged(true);
                toast.success(userProfile.display_name + " was successfully demoted to Member")
            })
            .catch((error) => {
                console.error('Error demoting user: ', error);
                toast.error(userProfile.display_name + " could not be demoted to Member")
            })
    }

    const handleDeleteAccount = () => {
        axios.post(`http://localhost:5000/user/delete`, {
            userID: userProfile.user_id,
        })
            .then((response) => {
                navigate("/home")
                toast.success(userProfile.display_name + " was successfully demoted to Member")
            })
            .catch((error) => {
                console.error('Error demoting user: ', error);
                toast.error(userProfile.display_name + " could not be demoted to Member")
            })
    }

    const handleBan = () => {
        console.log(new Date());
        console.log(startDate)
        axios.post('http://localhost:5000/userProfile/ban', {
            banUntil: startDate,
            userID: userProfile.user_id,
        })
            .then((response) => {
                setIsBanOpen(false);
                toast.success(userProfile.display_name + " was successfully banned")
            })
            .catch((error) => {
                console.error('Error banning user: ', error);
                toast.error(userProfile.display_name + " could not be banned")
            })
    }

    const handleWarn = () => {
        axios.post('http://localhost:5000/userProfile/warn', {
            adminID: user.user_id,
            userID: userProfile.user_id,
        })
            .then((response) => {
                setUserProfile(response.data);
                setHasChanged(true);
                toast.success(userProfile.display_name + " was successfully warned")
            })
            .catch((error) => {
                console.error('Error warning user: ', error);
                toast.error(userProfile.display_name + " could not be warned")
            })
    }

    return (<>
        <Navigation />
        <div className="userProfile2">
            <div className="profile-container2">
                <div className="profile-header2">
                    <h1 className="user-name2">{userProfile.display_name}'s Profile</h1>
                    {(!(user && (user.type === "Admin")) && !(userProfile.type === "Admin")) && (<>
                        <button className="report-btn2" onClick={() => setIsReportOpen(!isReportOpen)}>{isReportOpen ? "Cancel" : "Report"}</button>
                    </>)}
                </div>
                <div className="profile-content2">
                    <div className="left-side2">
                        <img src={userProfile.url || '../../../public/Gojo.jpeg'} alt={userProfile.display_name} className="profile-picture2" />
                        {((user && user.type === "Admin" || user.type === "Moderator") && userProfile.type !== "Admin") && (<>
                            {user.type === "Admin" && (<>
                                {userProfile.type === "Member" ? (<>
                                    <button className="report-btn2 mb-3 w-full" onClick={handlePromotion}>Promote to Moderator</button>
                                </>) : (<>
                                    <button className="report-btn2 mb-3 w-full" onClick={handleDemotion}>Demote to Member</button>
                                </>)}
                                <button className="report-btn2 mb-3 w-full" onClick={handleDeleteAccount}>Delete Account</button>
                            </>)}
                            <button className="report-btn2 mb-3 w-full" onClick={handleWarn}>Warn User</button>
                            <button className="report-btn2 mb-6 w-full" onClick={() => setIsBanOpen(!isBanOpen)}>{!isBanOpen ? "Ban" : "Cancel"}</button>
                            {isBanOpen && (<>
                                <div className="flex">
                                    <div className="customDatePickerWrapper">
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date) => setStartDate(date)}
                                            showTimeSelect
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            className="customDatePickerInput"
                                            wrapperClassName="customDatePicker"
                                            calendarClassName="customDatePickerCalendar"
                                            timeClassName={(time) => {
                                                const hour = new Date(time).getHours();
                                                return hour < 12 ? 'customTimePickerMorning' : 'customTimePickerEvening';
                                            }}
                                        />
                                    </div>
                                    <button className="report-btn2 h-11 ml-2" onClick={handleBan}>Confirm</button>
                                </div>
                            </>)}
                        </>)}
                        <div className="user-info2">
                            <p>Last Online: <span className="info-value2">{lastActive}</span></p>
                            <p>Full Name: <span className="info-value2">{userProfile.first_name + " " + userProfile.second_name}</span></p>
                            <p>Joined: <span className="info-value2">{userProfile.join_date}</span></p>
                            <p>Days Since Joined: <span className="info-value2">{Math.floor((new Date() - new Date(userProfile.join_date)) / ((1000 * 60 * 60 * 24)))} days</span></p>
                            <p>Account Type: <span className="info-value2"><span className="text-red-600 font-bold text-lg">{userProfile.type}</span></span></p>
                        </div>

                    </div>
                    <div className="right-panel2">
                        {isReportOpen && (<>
                            <div className='reportPanel'>
                                <h2>Report Panel</h2>
                                <label htmlFor='discussion content' className='text-gray-300'>Report Content</label> <br />
                                <textarea
                                    type='text'
                                    name='discussion content'
                                    id='discussion content'
                                    value={reportContent}
                                    onChange={handleReportContent}
                                    placeholder='Add your reason to report'
                                    className='w-full rounded-md mt-2 p-3 min-h-20 text-gray-800'>
                                </textarea>
                                <button className='post-comment-btn' onClick={handleReportSubmit}>Submit</button>
                            </div>
                        </>)}
                        <div className="anime-stats2">
                            <h2>Anime Stats</h2>
                            <StatusChart statusSegment={statusSegment} />
                            <div className="stats2 mt-3">
                                <div className="left-stats2">
                                    <p>Watching: {statusSegment.watching}</p>
                                    <p>Completed: {statusSegment.completed}</p>
                                    <p>Paused: {statusSegment.paused}</p>
                                    <p>Dropped: {statusSegment.dropped}</p>
                                    <p>Plan to Watch: {statusSegment.planning}</p>
                                </div>
                                <div className="right-stats2">
                                    <p>Mean Score: {avgScore}</p>
                                    <p>Total Interactions: {userProfile.total_interactions}</p>
                                    <p>Favorites: {favoriteList.length}</p>
                                    <p>Total Entries: {totalReplies}</p>
                                    {(user && (user.type === "Admin" || user.type === "Moderator") && <p>Total Warnings: {userProfile.warning_count}</p>)}
                                </div>
                            </div>
                        </div>
                        <div className="last-updates2">
                            <h2>Last Anime Updates</h2>
                            {latestInteractions && latestInteractions.map((interaction) => (
                                <Link to={`/anime/${interaction.anime_id}`}>
                                    <div className="anime-update2">
                                        <img src={interaction.cover_image} alt={interaction.title} />
                                        <p>{interaction.title}</p>
                                        <p>{interaction.interaction_time}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="favorites2">
                            <h2>Favorites</h2>
                            <div className="favorites-grid2">
                                {favoriteList && favoriteList.slice(0, 8).map((favorite) => (
                                    <div className="anime-item2">
                                        <Link to={`/anime/${favorite.anime_id}`}>
                                            <img src={favorite.cover_image} alt={favorite.title} />
                                            <p className="anime-title2">{favorite.title}</p>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {(user.type === "Admin" || user.type === "Moderator") && (<>
                            <div className="reportPanel">
                                <h2>Recent Activity</h2>
                                <UserActivity userActivity={userActivity} />
                            </div>
                        </>)}
                    </div>
                </div>
            </div>
        </div>
        <Footer />
    </>)
}

export default UserProfile;