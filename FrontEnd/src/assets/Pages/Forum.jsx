import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Navigation, Footer } from './imports'
import ReplyReview from '../ReplyReview'
import './../CSS/forum.css'

const Forum = () => {
    let { forumId } = useParams()
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const [replyOpen, setReplyOpen] = useState(false);
    const [forum, setForum] = useState({});
    const [replyContent, setReplyContent] = useState('');
    const [replies, setReplies] = useState([]);
    const [displayLimit, setDisplayLimit] = useState(10);

    const handleReply = () => {
        if (user) {
            setReplyOpen(!replyOpen);
        } else {
            navigate('/login');
        }
    }

    useEffect(() => {
        axios.get(`http://localhost:5000/forum/${forumId}`)
            .then((response) => {
                setForum(response.data);
            })
            .catch((error) => {
                console.error('Error fetching forum data: ', error);
            })


        handleFetchReply();

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [forumId, displayLimit])


    const handleScroll = () => {
        const threshold = 6; // Adjust based on your needs
        const currentPosition = window.innerHeight + document.documentElement.scrollTop;
        const nearBottom = currentPosition >= document.documentElement.offsetHeight - threshold;

        if (nearBottom) {
            setDisplayLimit((prevLimit) => prevLimit + 8); // Increase limit by 35 upon reaching near bottom
        }
    };


    const handleReplyChange = (event) => {
        setReplyContent(event.target.value);
    }

    const handlePostReply = () => {
        if (replyContent === '') {
            alert('Reply content can not be empty');
        } else {
            axios.post(`http://localhost:5000/forum/reply-post`, {
                userId: user.user_id,
                forumId: forumId,
                replyContent: replyContent,
            })
                .then((response) => {
                    setReplyContent('');
                    handleFetchReply();
                    setReplyOpen(false);
                })
                .catch((error) => {
                    console.error('Error posting reply: ', error);
                })
        }
    }

    const handleFetchReply = () => {
        axios.get(`http://localhost:5000/forum/fetch-reply/${forumId}`)
            .then((response) => {
                setReplies(response.data);
            })
            .catch((error) => {
                console.error('Error fetching replies: ', error);
            })
    }

    return (<>
        <Navigation />
        <div className="discussion_body">
            <div className="discussion-container">
                <div className="mb-10">
                    <div className="discussion-topic">
                        <div className="discussion-topic-details">
                            <h1>{forum.title}</h1>
                            <p className="mb-4 mt-2 text-gray-300 ml-3 border-l-2 border-green-500 pl-3 rounded-sm">{forum.description}</p>
                            <div className='flex justify-start'>
                                <img src={forum.url || '../../../public/Gojo.jpeg'} alt='User Name' className='h-5 w-5 rounded-full' />
                                <div className='flex'>
                                    {user && user.user_id === forum.user_id ? (<>
                                        <Link to="/profile" className=' pl-2 text-red-600 font-bold text-sm'>{user.display_name}</Link>
                                    </>) : (<>
                                        <Link to={`/user-profile/${forum.user_id}`} className=' pl-2 text-red-600 font-bold text-sm'>{forum.display_name}</Link>
                                    </>)}
                                    <p className='ml-2 text-sm text-gray-400'> created this forum on {forum.created_at}</p>
                                    <Link className="ml-1 text-sm text-gray-400" to={`/anime/${forum.anime_id}`}>for<span className="ml-1 text-purple-700 font-bold text-sm">{forum.anime_title}</span> anime</Link>
                                </div>
                            </div>
                        </div>
                        <button id="discussion-reply-button" className="discussion-reply-button" onClick={handleReply}>{replyOpen ? "Cancel" : "Reply"}</button>
                    </div>
                    {replyOpen && (<>
                        <div id="discussion-reply-box" className="discussion-reply-box discussion-hidden">
                            <textarea
                                id="discussion-reply-text"
                                className="discussion-reply-text"
                                placeholder="Type your reply here..."
                                value={replyContent}
                                onChange={handleReplyChange}
                            ></textarea>
                            <button id="discussion-post-reply" className="discussion-post-reply" onClick={handlePostReply}>Post Reply</button>
                        </div>
                    </>)}
                </div>

                {replies && replies.slice(0, displayLimit).map((reply, index) => (
                    <ReplyReview reply={reply} index={index} handleFetchReply={handleFetchReply} />
                ))}
            </div>
        </div>
        <Footer />
    </>)
}

export default Forum;