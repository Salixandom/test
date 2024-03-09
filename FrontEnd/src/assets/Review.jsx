import React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Reply from './Reply';
import './CSS/style.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Reviews = ({ review, comingFromUser = "No" }) => {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const reviewMenuRef = useRef(null);
    const [reviewMenuContent, setReviewMenuContent] = useState(false);
    const [upvoted, setUpvoted] = useState(false);
    const [downvoted, setDownvoted] = useState(false);

    const formatTimeDifference = (timeString) => {
        const currentTime = new Date();
        const time = new Date(timeString);
        const timeDiffInSeconds = (currentTime - time) / 1000;

        if (timeDiffInSeconds < 60) {
            return Math.floor(timeDiffInSeconds) + ' seconds ago';
        } else if (timeDiffInSeconds < 3600) {
            const minutes = Math.floor(timeDiffInSeconds / 60);
            return minutes + ' minutes ago';
        } else if (timeDiffInSeconds < 86400) {
            const hours = Math.floor(timeDiffInSeconds / 3600);
            return hours + ' hours ago';
        } else if (timeDiffInSeconds < 172800) {
            return 'Yesterday';
        } else {
            const formattedDate =
                time.getDate() +
                '-' +
                (time.getMonth() + 1) +
                '-' +
                time.getFullYear();
            return formattedDate;
        }
    }

    const toggleMenuContent = () => {
        setReviewMenuContent(!reviewMenuContent);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reviewMenuRef.current && !reviewMenuRef.current.contains(event.target)) {
                setReviewMenuContent(false); // Close the menu if click is outside
            }
        };

        if (user) {
            axios.get(`http://localhost:5000/user/review/vote-check/${user.user_id}/${review.anime_id}/${review.review_id}`)
                .then((response) => {
                    if (response.data.vote_type === 'upvote') {
                        setUpvoted(true)
                        setDownvoted(false)
                    } else if (response.data.vote_type === 'downvote') {
                        setDownvoted(true);
                        setUpvoted(false);
                    }
                })
                .catch((error) => {
                    console.error('Error checking vote: ', error);
                })
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user, upvoted, downvoted, review, reviewMenuRef])

    const handleUpvote = () => {
        if (user && user.user_id !== review.user_id) {
            axios.post('http://localhost:5000/user/review/vote', {
                userId: user.user_id,
                animeId: review.anime_id,
                reviewId: review.review_id,
                voteType: 'upvote'
            })
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.message === 'Added vote') {
                            setUpvoted(true);
                            setDownvoted(false);
                        }
                        else if (response.data.message === 'Removed vote') {
                            setUpvoted(false);
                            setDownvoted(false);
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error up voting: ', error);
                })
        } else {
            toast.error("Please login first")
            navigate('/login')
        }
    }

    const handleDownvote = () => {
        if (user) {
            axios.post('http://localhost:5000/user/review/vote', {
                userId: user.user_id,
                animeId: review.anime_id,
                reviewId: review.review_id,
                voteType: 'downvote'
            })
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.message === 'Added vote') {
                            setDownvoted(true);
                            setUpvoted(false);
                        } else if (response.data.message === 'Removed vote') {
                            setDownvoted(false);
                            setUpvoted(false);
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error up voting: ', error);
                })
        } else {
            toast.error("Please login first")
            navigate('/login')
        }
    }

    const handleEdit = () => {

    }

    const handleDelete = () => {
        axios.post(`http://localhost:5000/user/anime/review/delete/${user.user_id}/${review.anime_id}/${review.review_id}`)
            .then((response) => {
                setReviewMenuContent(false);
                toast.success("Review deleted successfully")
            })
            .catch((error) => {
                console.error('Error deleting review: ', error);
                toast.error("Error deleting review")
            })
    }

    const handleReport = () => {
        axios.post(`http://localhost:5000/user/report`, {
            reported_user_id: review.user_id,
            reporting_user_id: user.user_id,
            entity_id: review.review_id,
            entity_type: "review",
            reason: "This review was flagged by another user"
        })
            .then((response) => {
                setReviewMenuContent(false);
                toast.success("Review was reported successfully");
            })
            .catch((error) => {
                console.error('Error reporting review: ', error);
                toast.error("Error occured while reporting review");
            })
    }

    return (<>
        <div className='bg-gray-800 mb-3 p-3 rounded-lg'>
            <div className='comment-menu-button text-gray-50'>
                <div ref={reviewMenuRef}>
                    <button className='review-menu-trigger -translate-x-1' onClick={toggleMenuContent}>&#8942;</button>
                    {reviewMenuContent && (
                        <>
                            <div className='comment-menu-content'>
                                <ul>
                                    {user && ((user.user_id === review.user_id || user.type === "Admin" || (user.type === "Moderator" && review.user_type !== "Admin")) && <>
                                        <li><button onClick={handleDelete}>🚮 Delete</button></li>
                                    </>)}
                                    {!(user && (user.user_id === review.user_id || user.type === "Admin" || user.type === "Moderator" && review.user_type !== "Admin")) && <>
                                        <li><button onClick={handleReport}>🚩 Flag</button></li>
                                    </>}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className='comment-main'>
                <div className='flex'>
                    <img src={review.url || '../../../public/Gojo.jpeg'} alt={review.display_name} className='user-photo' />
                    <div className='flex justify-between w-full'>
                        <div className='comment-header -translate-y-1'>
                            {user && user.user_id === review.user_id ? <>
                                <Link to="/profile" className='comment-username'>{review.display_name}</Link>
                            </> : <>
                                <Link to={`/user-profile/${review.user_id}`} className='comment-username'>{review.display_name}</Link>
                            </>}
                            <span className='comment-time -translate-y-2'>{formatTimeDifference(review.review_date)}</span>
                        </div>
                        {comingFromUser === "Yes" && <p className='text-gray-400 z-10 text-sm'>from &nbsp;<Link to={`/anime/${review.anime_id}`} className='text-purple-500 font-semibold text-lg z-10'>{review.anime_title.slice(0, 10)}</Link></p>}
                    </div>
                </div>
                <div className='comment-body -translate-y-2 translate-x-4'>
                    <p>{review.review_text}</p>
                </div>
                <div className="comment-actions">
                    <div className='flex w-full justify-between'>
                        <div className="vote-section">
                            {user && user.user_id === review.user_id ? (<>
                                <button className='vote-disabled upvote-disabled bg-gray-300 text-gray-50' onClick={handleUpvote} disabled>&#x25B2; {review.upvote_count}</button>
                                <button className='vote-disabled downvote-disabled  bg-gray-300 text-gray-50' disabled>&#x25BC; {review.downvote_count}</button>
                            </>) : (<>
                                <button className={upvoted ? "vote upvote bg-blue-600 text-white" : "vote upvote bg-gray-200 text-gray-500"} onClick={handleUpvote} >&#x25B2; {review.upvote_count}</button>
                                <button className={downvoted ? "vote downvote bg-red-600 text-white" : "vote downvote  bg-gray-200 text-gray-500"} onClick={handleDownvote}>&#x25BC; {review.downvote_count}</button>
                            </>)}
                        </div>
                        <p className='text-3xl text-gray-400 font-semibold'>⭐ {review.rating_score ? review.rating_score : "0"}/10</p>
                    </div>
                </div>
            </div>
        </div>
    </>)
}

export default Reviews;