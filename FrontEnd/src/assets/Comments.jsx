import React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Reply from './Reply';
import './CSS/style.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Comments = ({ comment, handleFetchingComments }) => {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const commentMenuRef = useRef(null);
    const [commentMenuContent, setCommentMenuContent] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [upvoted, setUpvoted] = useState(false);
    const [downvoted, setDownvoted] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replies, setReplies] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [commentText, setCommentText] = useState(comment.comment_text);
    const [updatedCommentText, setUpdatedCommentText] = useState(comment.comment_text);

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

    const handleChange = (event) => {
        setReplyText(event.target.value);
    };

    const toggleMenuContent = () => {
        setCommentMenuContent(!commentMenuContent);
    };

    const handleChangeCommentText = (event) => {
        setUpdatedCommentText(event.target.value);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (commentMenuRef.current && !commentMenuRef.current.contains(event.target)) {
                setCommentMenuContent(false); // Close the menu if click is outside
            }
        };

        if (user) {
            axios.get(`http://localhost:5000/user/anime/vote-check/${user.user_id}/${comment.anime_id}/${comment.comment_id}`)
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

        handleFetchingReply();
        handleFetchingComments();

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user, upvoted, downvoted, commentText, commentMenuRef])

    const handleUpvote = () => {
        if (user && user.user_id !== comment.user_id) {
            console.log('dhuke');
            axios.post('http://localhost:5000/user/anime/vote', {
                userId: user.user_id,
                animeId: comment.anime_id,
                commentId: comment.comment_id,
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
            axios.post('http://localhost:5000/user/anime/vote', {
                userId: user.user_id,
                animeId: comment.anime_id,
                commentId: comment.comment_id,
                voteType: 'downvote'
            })
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.message === 'Added vote') {
                            setDownvoted(true);
                            setUpvoted(false);
                        }
                        else if (response.data.message === 'Removed vote') {
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

    const handleDelete = () => {
        axios.post(`http://localhost:5000/user/anime/comment/delete/${user.user_id}/${comment.anime_id}/${comment.comment_id}`)
            .then((response) => {
                setCommentMenuContent(false);
                handleFetchingComments();
                toast.success("Comment deleted successfully")
            })
            .catch((error) => {
                console.error('Error deleting comment: ', error);
                toast.error("Error deleting comment")
            })
    }

    const handleReplyPost = () => {
        if (user) {
            if (replyText === '') {

            } else {
                axios.post(`http://localhost:5000/user/anime/reply`, {
                    userId: user.user_id,
                    commentId: comment.comment_id,
                    replyText: replyText,
                })
                    .then((response) => {
                        setReplyText('');
                        handleFetchingReply();
                        setReplyOpen(false);
                        toast.success("Reply posted successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding reply: ', error);
                        toast.error("Error adding reply")
                    });
            }
        } else {
            toast.error("Please login first")
            navigate('/login');
        }
    }

    const handleFetchingReply = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/anime/comments/reply/${comment.comment_id}`);
            const tempReply = response.data;
            setReplies(tempReply);

        } catch (error) {
            console.error('Error fetching reply: ', error);
        }
    }

    const handleCancel = () => {
        setEditMode(false);
        setUpdatedCommentText(comment.comment_text);
    }

    const handleUpdate = () => {
        if (updatedCommentText !== comment.comment_text) {
            axios.post(`http://localhost:5000/user/anime/comment/update`, {
                userId: user.user_id,
                animeId: comment.anime_id,
                commentId: comment.comment_id,
                commentText: updatedCommentText,
            })
                .then((response) => {
                    setCommentText(response.data.comment_text);
                    setEditMode(false);
                    setUpdatedCommentText(response.data.comment_text);
                    setCommentMenuContent(false);
                    toast.success("Comment updated successfully")
                })
                .catch((error) => {
                    console.error('Error updating comment: ', error);
                    toast.error("Error updating comment")
                })
        } else {
            setEditMode(false);
            setUpdatedCommentText(comment.comment_text);
        }
    }

    const handleReport = () => {
        axios.post(`http://localhost:5000/user/report`, {
            reported_user_id: comment.user_id,
            reporting_user_id: user.user_id,
            entity_id: comment.comment_id,
            entity_type: "comment",
            reason: "This comment was flagged by another user"
        })
            .then((response) => {
                setCommentMenuContent(false);
                toast.success("Comment was reported successfully")
            })
            .catch((error) => {
                console.error('Error reporting comment: ', error);
                toast.error("Error reporting comment")
            })
    }

    return (<>
        <div className='comment-cont mb-3 p-3 rounded-lg'>
            {editMode ? (<>
                <div className='flex'>
                    <img src={comment.url || '../../../public/Gojo.jpeg'} alt={comment.display_name} className='user-photo' />
                    <Link to="/profile" className='comment-username translate-y-2'>{comment.display_name}</Link>
                </div>
                <textarea
                    placeholder='Give your updated comment'
                    className='review-input w-full bg-gray-200'
                    value={updatedCommentText}
                    onChange={handleChangeCommentText}
                ></textarea>
                <div className='flex justify-between'>
                    <button className='post-comment-btn' onClick={handleUpdate}>Update</button>
                    <button className='post-comment-btn' onClick={handleCancel}>Cancel</button>
                </div>
            </>) : (<>
                <div className='comment-menu-button text-gray-50'>
                    <div ref={commentMenuRef}>
                        <button className='comment-menu-trigger -translate-x-7' onClick={toggleMenuContent}>&#8942;</button>
                        {commentMenuContent && (
                            <>
                                <div className='comment-menu-content'>
                                    <ul>
                                        {user && ((user.user_id === comment.user_id || user.type === "Admin" || (user.type === "Moderator" && comment.user_type !== "Admin")) && <>
                                            <li><button onClick={handleEdit}>✍️ Edit</button></li>
                                            <li><button onClick={handleDelete}>🚮 Delete</button></li>
                                        </>)}
                                        {!(user && (user.user_id === comment.user_id || user.type === "Admin" || (user.type === "Moderator" && comment.user_type !== "Admin"))) && <>
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
                        <img src={comment.url || '../../../public/Gojo.jpeg'} alt={comment.display_name} className='user-photo' />
                        <div className='comment-header -translate-y-1'>
                            {user && user.user_id === comment.user_id ? <>
                                <Link to="/profile" className='comment-username'>{comment.display_name}</Link>
                            </> : <>
                                <Link to={`/user-profile/${comment.user_id}`} className='comment-username'>{comment.display_name}</Link>
                            </>}
                            <span className='comment-time -translate-y-2'>{formatTimeDifference(comment.comment_date)}</span>
                        </div>
                    </div>
                    <div className='comment-body -translate-y-2 translate-x-4'>
                        <p>{commentText}</p>
                    </div>
                    <div className="comment-actions">
                        <div className="vote-section">
                            {user && user.user_id === comment.user_id ? (<>
                                <button className='vote-disabled upvote-disabled bg-gray-400 text-gray-50' onClick={handleUpvote} disabled>&#x25B2; {comment.upvote_count}</button>
                                <button className='vote-disabled downvote-disabled  bg-gray-400 text-gray-50' disabled>&#x25BC; {comment.downvote_count}</button>
                            </>) : (<>
                                <button className={upvoted ? "vote upvote bg-blue-600 text-white" : "vote upvote bg-gray-300 text-gray-600"} onClick={handleUpvote} >&#x25B2; {comment.upvote_count}</button>
                                <button className={downvoted ? "vote downvote bg-red-600 text-white" : "vote downvote  bg-gray-300 text-gray-600"} onClick={handleDownvote}>&#x25BC; {comment.downvote_count}</button>
                            </>)}
                        </div>
                        <button className="reply-btn" onClick={() => setReplyOpen(!replyOpen)}>Reply</button>
                    </div>

                    {replyOpen && <>
                        <div className="reply-input-container" >
                            <textarea
                                className="reply-input bg-gray-200"
                                placeholder="Leave a reply"
                                value={replyText}
                                onChange={handleChange}
                            ></textarea>
                            <button className="post-reply-btn" onClick={handleReplyPost}>Post</button>
                        </div>
                    </>}
                    <div className="replies">
                        <div className="user-reply bg-gray-800">
                            {replies && replies.map((reply, index) => (
                                <Reply reply={reply} handleFetchingReply={handleFetchingReply} />
                            ))}
                        </div>
                    </div>
                </div>
            </>)}
        </div>
    </>)
}

export default Comments;