import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Navigation, Footer } from './imports'
import { useSelector } from 'react-redux';
import './../CSS/style.css'

const ForumFeed = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const [forums, setForums] = useState([]);


    useEffect(() => {
        axios.get('http://localhost:5000/forums-feed')
            .then((response) => {
                 setForums(response.data);
            })
            .catch((error) => {
                 console.error('Error fetching forums: ', error);
            })
    }, [])


    return (<>
        <Navigation />
        <div className='discussion_body min-h-screen'>
            <div className='discussion-container' style={{backgroundColor: 'transparent', border: 'none'}}>
                <div className="comment-section">
                    <div className="flex justify-between">
                        <h2 className='comment-section-title'>Recent Forum Discussion</h2>
                    </div>
                    {forums && forums.slice(0, 5).map((forum) => (
                        <div className="discussion-list-item mb-4">
                            <div className="discussion-list-info">
                                <Link to={`/forum/${forum.forum_id}`}><p className="discussion-list-title mb-2 text-gray-300">{forum.title}</p></Link>
                                <p className='discussion-text mb-2 text-sm text-gray-500'>{forum.description}</p>
                                <div className='flex '>
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
                            <div className="flex">
                                <p className="discussion-list-reply-count"><i class="fas fa-comments"></i> {forum.total_replies}</p>
                                <p className="discussion-list-reply-count"><i class="fas fa-eye"></i> {forum.total_views}</p>
                            </div>
                        </div>
                    ))}

                </div>
                <div className="comment-section">
                    <div className="flex justify-between">
                        <h2 className='comment-section-title'>Recently Created Forum</h2>
                    </div>
                    {forums && forums.sort((a, b) => {
                        const dateA = new Date(a.ct);
                        const dateB = new Date(b.ct);
                        console.log(dateB - dateA, dateB, dateA)
                        return dateB - dateA;
                    })
                        .slice(0, 5).map((forum) => (
                            <div className="discussion-list-item mb-4">
                                <div className="discussion-list-info">
                                    <Link to={`/forum/${forum.forum_id}`}><p className="discussion-list-title mb-2 text-gray-300">{forum.title}</p></Link>
                                    <p className='discussion-text mb-2 text-sm text-gray-500'>{forum.description}</p>
                                    <div className='flex '>
                                        <img src={forum.url || '../../../public/Gojo.jpeg'} alt='User Name' className='h-5 w-5 rounded-full' />
                                        <div className='flex'>
                                            {user && user.user_id === forum.user_id ? (<>
                                                <Link to="/profile" className=' pl-2 text-red-600 font-bold text-sm'>{user.display_name}</Link>
                                            </>) : (<>
                                                <Link to={`/user-profile/${forum.user_id}`} className=' pl-2 text-red-600 font-bold text-sm'>{forum.display_name}</Link>
                                            </>)}
                                            <p className='ml-2 text-sm text-gray-400'> created this on {forum.created_at}</p>
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
            </div>
        </div>
        <Footer />
    </>)
}


export default ForumFeed;