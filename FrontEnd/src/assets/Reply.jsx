import React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './CSS/style.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Reply = ({ reply, handleFetchingReply }) => {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const replyMenuRef = useRef(null);
    const [replyMenuContent, setReplyMenuContent] = useState(false);
    const [upvoted, setUpvoted] = useState(false);
    const [downvoted, setDownvoted] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [replyText, setReplyText] = useState(reply.reply_text);
    const [updatedReplyText, setUpdatedReplyText] = useState(reply.reply_text);


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
        setReplyMenuContent(!replyMenuContent);
    };

    const handleChangeReplyText = (event) => {
        setUpdatedReplyText(event.target.value);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (replyMenuRef.current && !replyMenuRef.current.contains(event.target)) {
                setReplyMenuContent(false); // Close the menu if click is outside
            }
        };

        if (user) {
            axios.get(`http://localhost:5000/user/comment/reply-vote-check/${user.user_id}/${reply.comment_id}/${reply.reply_id}`)
                .then((response) => {
                    if (response.data.vote_type === 'upvote') {
                        setUpvoted(true);
                        setDownvoted(false);
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
        handleFetchingReply();

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user, upvoted, downvoted, replyText, replyMenuRef])

    const handleUpvote = () => {
        if (user && user.user_id !== reply.user_id) {
            axios.post('http://localhost:5000/user/reply/vote', {
                userId: user.user_id,
                commentId: reply.comment_id,
                replyId: reply.reply_id,
                voteType: 'upvote'
            })
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.message === 'Added vote') {
                            console.log('Added vote')
                            setUpvoted(true);
                            setDownvoted(false);
                        }
                        else if (response.data.message === 'Removed vote') {
                            console.log('Removed vote')
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
            axios.post('http://localhost:5000/user/reply/vote', {
                userId: user.user_id,
                commentId: reply.comment_id,
                replyId: reply.reply_id,
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
        setEditMode(true);
    }

    const handleCancel = () => {
        setEditMode(false);
        setUpdatedReplyText(comment.comment_text);
    }

    const handleDelete = () => {
        axios.post(`http://localhost:5000/user/comment/reply/delete/${user.user_id}/${reply.comment_id}/${reply.reply_id}`)
            .then((response) => {
                setReplyMenuContent(false);
                handleFetchingReply();
                toast.success("Reply deleted successfully")
            })
            .catch((error) => {
                console.error('Error deleting reply: ', error);
                toast.error("Error deleting reply")
            })
    }

    const handleUpdate = () => {
        if (updatedReplyText !== reply.reply_text) {
            axios.post(`http://localhost:5000/user/anime/reply/update`, {
                userId: user.user_id,
                commentId: reply.comment_id,
                replyId: reply.reply_id,
                replyText: updatedReplyText,
            })
                .then((response) => {
                    setReplyText(response.data.reply_text);
                    setEditMode(false);
                    setUpdatedReplyText(response.data.reply_text);
                    setReplyMenuContent(false);
                    toast.success("Reply updated successfully");
                })
                .catch((error) => {
                    console.error('Error updating reply: ', error);
                    toast.error("Error updating reply")
                })
        } else {
            setEditMode(false);
            setUpdatedReplyText(reply.reply_text);
        }
    }

    const handleReport = () => {
        axios.post(`http://localhost:5000/user/report`, {
            reported_user_id: reply.user_id,
            reporting_user_id: user.user_id,
            entity_id: reply.reply_id,
            entity_type: "reply",
            reason: "This reply was flagged by another user"
        })
            .then((response) => {
                setReplyMenuContent(false);
                toast.success("Reply was reported successfully");
            })
            .catch((error) => {
                console.error('Error reporting reply: ', error);
                toast.error("Error reporting reply")
            })
    }

    return (<>
        {editMode ? (<>
            <div className='flex'>
                <img src={reply.url || '../../../public/Gojo.jpeg'} alt={reply.display_name} className='user-photo' />
                <Link to="/profile" className='comment-username translate-y-2'>{reply.display_name}</Link>
            </div>
            <textarea
                placeholder='Give your updated reply'
                className='review-input w-full text-gray-900'
                value={updatedReplyText}
                onChange={handleChangeReplyText}
            ></textarea>
            <div className='flex justify-between'>
                <button className='post-comment-btn' onClick={handleUpdate}>Update</button>
                <button className='post-comment-btn' onClick={handleCancel}>Cancel</button>
            </div>
        </>) : (<>
            <div className='comment-menu-button text-gray-50'>
                <div ref={replyMenuRef}>
                    <button className='comment-menu-trigger -translate-x-7 translate-y-20' onClick={toggleMenuContent}>&#8942;</button>
                    {replyMenuContent && (
                        <>
                            <div className='comment-menu-content'>
                                <ul>
                                    {user && ((user.user_id === reply.user_id || user.type === "Admin" || (user.type === "Moderator" && reply.user_type !== "Admin")) && <>
                                        <li><button onClick={handleEdit}>✍️ Edit</button></li>
                                        <li><button onClick={handleDelete}>🚮 Delete</button></li>
                                    </>)}
                                    {!(user && (user.user_id === reply.user_id || user.type === "Admin" || (user.type === "Moderator" && reply.user_type !== "Admin"))) && <>
                                        <li><button onClick={handleReport}>🚩 Flag</button></li>
                                    </>}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className='flex'>
                <img src={reply.url || '../../../public/Gojo.jpeg'} alt={reply.display_name} className="user-photo translate-x-3" />
                <div className="reply-main">
                    <div className="reply-header">
                        {user && user.user_id === reply.user_id ? <>
                            <Link to="/profile" className="comment-username z-10">{reply.display_name}</Link>
                        </> : <>
                            <Link to={`/user-profile/${reply.user_id}`} className="comment-username z-10">{reply.display_name}</Link>
                        </>}
                        <span className="reply-time">{formatTimeDifference(reply.reply_date)}</span>
                    </div>
                    <div className="reply-body text-gray-300">
                        <p>{replyText}</p>
                    </div>
                    <div className="vote-section">
                        {user && user.user_id === reply.user_id ? (<>
                            <button className='vote-disabled upvote-disabled bg-gray-400 text-gray-50' onClick={handleUpvote} disabled>&#x25B2; {reply.upvote_count}</button>
                            <button className='vote-disabled downvote-disabled  bg-gray-400 text-gray-50' disabled>&#x25BC; {reply.downvote_count}</button>
                        </>) : (<>
                            <button className={upvoted ? "vote upvote bg-blue-600 text-white" : "vote upvote bg-gray-200 text-gray-600"} onClick={handleUpvote} >&#x25B2; {reply.upvote_count}</button>
                            <button className={downvoted ? "vote downvote bg-red-600 text-white" : "vote downvote  bg-gray-200 text-gray-600"} onClick={handleDownvote}>&#x25BC; {reply.downvote_count}</button>
                        </>)}
                    </div>
                </div>
            </div>
        </>)}
    </>)
}

export default Reply;