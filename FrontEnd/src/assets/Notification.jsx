import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import './CSS/profile.css'
import './CSS/style.css'

const Notifications = ({ notification, handleFetchingNotification }) => {
    const { user } = useSelector((state) => state.auth);
    /* notification = notification.notification */
    const [adminInfo, setAdminInfo] = useState({})
    const [notificationComment, setNotificationComment] = useState({})
    const [notificationReview, setNotificationReview] = useState({})
    const [notificationReply, setNotificationReply] = useState({})
    const [notificationForumReply, setNotificationForumReply] = useState({})
    const [notificationForum, setNotificationForum] = useState({})
    const [userInfo, setUserInfo] = useState({})

    useEffect(() => {
        if (notification.type === 'Promoted' || notification.type === 'Demoted' || notification.type === 'warning') {
            axios.get('http://localhost:5000/notifications/admin-info')
                .then((response) => {
                    setAdminInfo(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching admin info: ', error);
                })
        } else if (notification.type === 'upvote' || notification.type === 'downvote') {
            axios.get(`http://localhost:5000/notifications/user-info/${notification.trigger_user_id}`)
                .then((response) => {
                    setUserInfo(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching user info: ', error);
                });

            if (notification.entity_type === 'comment') {
                axios.get(`http://localhost:5000/notifications/comment-upvote-downvote/${notification.entity_id}`)
                    .then((response) => {
                        setNotificationComment(response.data)
                    })
                    .catch((error) => {
                        console.error('Error fetching comment upvote/downvote: ', error);
                    })
            } else if (notification.entity_type === 'review') {
                axios.get(`http://localhost:5000/notifications/review-upvote-downvote/${notification.entity_id}`)
                    .then((response) => {
                        setNotificationReview(response.data)
                    })
                    .catch((error) => {
                        console.error('Error fetching review upvote/downvote: ', error);
                    })
            } else if (notification.entity_type === 'reply') {
                axios.get(`http://localhost:5000/notifications/reply-upvote-downvote/${notification.entity_id}`)
                    .then((response) => {
                        setNotificationReply(response.data)
                    })
                    .catch((error) => {
                        console.error('Error fetching reply upvote/downvote: ', error);
                    })
            } else if (notification.entity_type === 'forum_reply') {
                axios.get(`http://localhost:5000/notifications/forumReply-upvote-downvote/${notification.entity_id}`)
                    .then((response) => {
                        setNotificationForumReply(response.data)
                    })
                    .catch((error) => {
                        console.error('Error fetching forum reply upvote/downvote: ', error);
                    })
            }
        } else if (notification.type === 'reply_comment') {
            axios.get(`http://localhost:5000/notifications/user-info/${notification.trigger_user_id}`)
                .then((response) => {
                    setUserInfo(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching user info: ', error);
                });

            axios.get(`http://localhost:5000/notifications/comment-upvote-downvote/${notification.entity_id}`)
                .then((response) => {
                    setNotificationComment(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching comment upvote/downvote: ', error);
                })
        } else if (notification.type === 'reply_forum') {
            axios.get(`http://localhost:5000/notifications/user-info/${notification.trigger_user_id}`)
                .then((response) => {
                    setUserInfo(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching user info: ', error);
                });

            axios.get(`http://localhost:5000/notifications/forum/${notification.entity_id}`)
                .then((response) => {
                    setNotificationForum(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching forum: ', error);
                })
        }

    }, [notification])


    const handleSeen = () => {
        axios.post(`http://localhost:5000/notifications/set-seen`, {
            notificationID: notification.notification_id
        })
            .then((response) => {
                console.log(response.data)
                handleFetchingNotification()
            })
            .catch((error) => {
                console.error('Error setting seen: ', error);
            });
    }



    return (<>
        <div className="userProf-notification-item m-5">
            <div className="userProf-notification-header">
                <span className="userProf-notification-type border-b border-blue-500 pb-0.5">{notification.type}</span>
                <span className="userProf-notification-time">{notification.time}</span>
            </div>
            {(notification.type === 'Promoted' || notification.type === 'Demoted') ? (<>
                <div className='flex justify-between'>
                    <div className="userProf-notification-body">
                        <img className="userProf-user-profile" src={adminInfo.url} alt={adminInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${adminInfo.user_id}`}>{adminInfo.display_name}</Link> {notification.type === "Promoted" ? " promoted you to Moderator " : " demoted you to Member "}</p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
            </>) : ((notification.type === 'upvote' || notification.type === 'downvote') && notification.entity_type === "comment" ? (<>
                <div className='flex justify-between'>
                    <div className='userProf-notification-body'>
                        <img className="userProf-user-profile" src={userInfo.url} alt={userInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${userInfo.user_id}`}>{userInfo.display_name}</Link> {notification.type === "upvote" ? " upvoted your comment " : " downvoted your comment "}</p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={user.url || '../../../public/Gojo.jpeg'} alt={user.display_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to="/profile" className='comment-username'>{user.display_name}</Link>
                                <span className='comment-time -translate-y-2'>{notificationComment.comment_date}</span>
                            </div>
                        </div>
                        <div className=''>
                            <p className='text-gray-400 text-sm'>from <Link to={`/anime/${notificationComment.anime_id}`} className='text-purple-600 font-extrabold'>{notificationComment.title}</Link></p>
                        </div>
                    </div>
                    <div className='comment-body -translate-y-2 translate-x-4'>
                        <p>{notificationComment.comment_text}</p>
                    </div>
                </div>
            </>) : ((notification.type === 'upvote' || notification.type === 'downvote') && notification.entity_type === "review" ? (<>
                <div className='flex justify-between'>
                    <div className='userProf-notification-body'>
                        <img className="userProf-user-profile" src={userInfo.url} alt={userInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${userInfo.user_id}`}>{userInfo.display_name}</Link> {notification.type === "upvote" ? " upvoted your review " : " downvoted your review "}</p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={user.url || '../../../public/Gojo.jpeg'} alt={user.display_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to="/profile" className='comment-username'>{user.display_name}</Link>
                                <span className='comment-time -translate-y-2'>{notificationReview.review_date}</span>
                            </div>
                        </div>
                        <div className=''>
                            <p className='text-gray-400 text-sm'>from <Link to={`/anime/${notificationReview.anime_id}`} className='text-purple-600 font-extrabold'>{notificationReview.title}</Link></p>
                        </div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='comment-body -translate-y-2 translate-x-4'>
                            <p>{notificationReview.review_text}</p>
                        </div>
                        <p className='text-3xl text-gray-400 font-semibold'>⭐ {notificationReview.rating_score ? notificationReview.rating_score : "0"}/10</p>
                    </div>
                </div>
            </>) : ((notification.type === 'upvote' || notification.type === 'downvote') && notification.entity_type === "reply" ? (<>
                <div className='flex justify-between'>
                    <div className='userProf-notification-body'>
                        <img className="userProf-user-profile" src={userInfo.url} alt={userInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${userInfo.user_id}`}>{userInfo.display_name}</Link> {notification.type === "upvote" ? " upvoted your reply " : " downvoted your reply "}</p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={user.url || '../../../public/Gojo.jpeg'} alt={user.display_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to="/profile" className='comment-username'>{user.display_name}</Link>
                                <span className='comment-time -translate-y-2'>{notificationReply.reply_date}</span>
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='comment-body -translate-y-2 translate-x-4'>
                            <p>{notificationReply.reply_text}</p>
                        </div>
                    </div>
                </div>
            </>) : ((notification.type === 'upvote' || notification.type === 'downvote') && notification.entity_type === "forum_reply" ? (<>
                <div className='flex justify-between'>
                    <div className='userProf-notification-body'>
                        <img className="userProf-user-profile" src={userInfo.url} alt={userInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${userInfo.user_id}`}>{userInfo.display_name}</Link> {notification.type === "upvote" ? " upvoted your forum reply " : " downvoted your forum reply "}</p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={user.url || '../../../public/Gojo.jpeg'} alt={user.display_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to="/profile" className='comment-username'>{user.display_name}</Link>
                                <span className='comment-time -translate-y-2'>{notificationForumReply.forum_reply_date}</span>
                            </div>
                        </div>
                        <div className=''>
                            <p className='text-gray-400 text-sm'>from <Link to={`/forum/${notificationForumReply.forum_id}`} className='text-purple-600 font-extrabold'>{notificationForumReply.title}</Link></p>
                        </div>
                    </div>
                    <div className='comment-body -translate-y-2 translate-x-4'>
                        <p>{notificationForumReply.message}</p>
                    </div>
                </div>
            </>) : ((notification.type === "reply_comment" ? (<>
                <div className='flex justify-between'>
                    <div className='userProf-notification-body'>
                        <img className="userProf-user-profile" src={userInfo.url} alt={userInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${userInfo.user_id}`}>{userInfo.display_name}</Link> replied to your comment </p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={user.url || '../../../public/Gojo.jpeg'} alt={user.display_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to="/profile" className='comment-username'>{user.display_name}</Link>
                                <span className='comment-time -translate-y-2'>{notificationComment.comment_date}</span>
                            </div>
                        </div>
                        <div className=''>
                            <p className='text-gray-400 text-sm'>from <Link to={`/anime/${notificationComment.anime_id}`} className='text-purple-600 font-extrabold'>{notificationComment.title}</Link></p>
                        </div>
                    </div>
                    <div className='comment-body -translate-y-2 translate-x-4'>
                        <p>{notificationComment.comment_text}</p>
                    </div>
                </div>
            </>) : (notification.type === "reply_forum" ? (<>
                <div className='flex justify-between'>
                    <div className='userProf-notification-body'>
                        <img className="userProf-user-profile" src={userInfo.url} alt={userInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${userInfo.user_id}`}>{userInfo.display_name}</Link> replied to your forum </p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={user.url || '../../../public/Gojo.jpeg'} alt={user.display_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to="/profile" className='comment-username'>{user.display_name}</Link>
                                <span className='comment-time -translate-y-2'>{notificationForum.create_date}</span>
                            </div>
                        </div>
                        <div className=''>
                            <p className='text-gray-400 text-sm'>from <Link to={`/forum/${notificationForum.forum_id}`} className='text-purple-600 font-extrabold'>{notificationForum.title}</Link></p>
                        </div>
                    </div>
                    <div className='comment-body -translate-y-2 translate-x-4'>
                        <p>{notificationForum.description}</p>
                    </div>
                </div>
            </>) : (notification.type === 'warning' && (<>
                <div className='flex justify-between'>
                    <div className='userProf-notification-body'>
                        <img className="userProf-user-profile" src={adminInfo.url} alt={adminInfo.display_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${adminInfo.user_id}`}>{adminInfo.display_name}</Link> has given you a warning </p>
                    </div>
                    <button className="userProf-notification-action" onClick={handleSeen}>Set as Seen</button>
                </div>
            </>)))))))))}
        </div >
    </>)
}

export default Notifications;