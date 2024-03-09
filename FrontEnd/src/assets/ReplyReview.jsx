import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux"
import { useParams, Link, useNavigate } from "react-router-dom"

const ReplyReview = ({ reply, index, handleFetchReply }) => {
    const user = useSelector((state) => state.auth.user)
    const navigate = useNavigate();

    const [upvoted, setUpvoted] = useState(false);
    const [downvoted, setDownvoted] = useState(false);

    useEffect(() => {

        if (user) {
            axios.get(`http://localhost:5000/user/forum/reply-vote-check/${user.user_id}/${reply.forum_id}/${reply.reply_id}`)
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

    }, [user, upvoted, downvoted])


    const handleUpvote = () => {
        if (user && user.user_id !== reply.user_id) {
            axios.post('http://localhost:5000/user/forum-reply/vote', {
                userId: user.user_id,
                forumId: reply.forum_id,
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

                        handleFetchReply();
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
            axios.post('http://localhost:5000/user/forum-reply/vote', {
                userId: user.user_id,
                forumId: reply.forum_id,
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

                        handleFetchReply();
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

    return (<>
        <div className="discussion-reply">
            <div className="discussion-reply-header">
                <span className="discussion-timestamp">{reply.created_at}</span>
                <span className="discussion-reply-number">#{index + 1}</span>
            </div>
            <div className="discussion-reply-body">
                <div className="discussion-user-info">
                    <img src={reply.url} alt={reply.display_name} className="discussion-profile-pic" />
                    {user && user.user_id === reply.user_id ? (<>
                        <Link to="/profile"><p className="discussion-username">{reply.display_name}</p></Link>
                    </>) : (<>
                        <Link to={`/user-profile/${reply.user_id}`}><p className="discussion-username">{reply.display_name}</p></Link>
                    </>)}
                </div>
                <div className="discussion-comment">
                    <p>{reply.reply_message}</p>
                </div>
                <div className="discussion-vote-controls mb-2 mr-2">
                    {user && user.user_id === reply.user_id ? (<>
                        <button className='vote-disabled upvote-disabled bg-gray-500 text-gray-600' onClick={handleUpvote} disabled><i class="fas fa-thumbs-up"></i> {reply.upvote}</button>
                        <button className='vote-disabled downvote-disabled  bg-gray-500 text-gray-600' disabled><i class="fas fa-thumbs-down"></i> {reply.downvote}</button>
                    </>) : (<>
                            <button className={upvoted ? "vote upvote bg-blue-600 text-white" : "vote upvote bg-gray-600 text-gray-300"} onClick={handleUpvote} ><i class="fas fa-thumbs-up"></i> {reply.upvote || '0'}</button>
                            <button className={downvoted ? "vote downvote bg-red-600 text-white" : "vote downvote  bg-gray-600 text-gray-300"} onClick={handleDownvote}><i class="fas fa-thumbs-down"></i> {reply.downvote || '0'}</button>
                    </>)}
                </div>
            </div>
        </div>
    </>)
}

export default ReplyReview;