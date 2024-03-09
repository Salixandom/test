import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import './CSS/profile.css'
import './CSS/style.css'

const Reports = ({ report, handleFetchingReports }) => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [reportComment, setReportComment] = useState({})
    const [reportReview, setReportReview] = useState({})
    const [reportReply, setReportReply] = useState({})

    useEffect(() => {

        if (report.entity_type === 'comment') {
            axios.get(`http://localhost:5000/notifications/comment-upvote-downvote/${report.entity_id}`)
                .then((response) => {
                    setReportComment(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching comment report: ', error);
                })
        } else if (report.entity_type === 'review') {
            axios.get(`http://localhost:5000/notifications/review-upvote-downvote/${report.entity_id}`)
                .then((response) => {
                    setReportReview(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching review report: ', error);
                })
        } else if (report.entity_type === 'reply') {
            axios.get(`http://localhost:5000/notifications/reply-upvote-downvote/${report.entity_id}`)
                .then((response) => {
                    setReportReply(response.data)
                })
                .catch((error) => {
                    console.error('Error fetching reply report: ', error);
                })
        }

    }, [report])

    const handleReview = () => {
        axios.post(`http://localhost:5000/report/set-resolved`, {
            reportID: report.report_id
        })
            .then((response) => {
                navigate(`/user-profile/${report.reported_user_id}`)
            })
            .catch((error) => {
                console.error('Error setting seen: ', error);
            });
    }

    const handleDelete = () => {
        axios.post(`http://localhost:5000/report/set-resolved`, {
            reportID: report.report_id
        })
            .then((response) => {
                handleFetchingReports()
            })
            .catch((error) => {
                console.error('Error setting seen: ', error);
            });
    }


    return (<>
        <div className="userProf-notification-item m-5">
            {report.entity_type === 'comment' ? (<>
                <div className="userProf-notification-header">
                    <span className="userProf-notification-type border-b border-blue-500 pb-0.5">{report.entity_type}</span>
                    <span className="userProf-notification-time">{report.report_date}</span>
                </div>
                <div className='flex justify-between'>
                    <div className="userProf-notification-body">
                        <img className="userProf-user-profile" src={report.reporting_user_img} alt={report.reporting_user_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${report.reporting_user_id}`}>{report.reporting_user_name}</Link> reported this comment</p>
                    </div>
                    <div className='flex'>
                        <button className="userProf-notification-action mr-2" onClick={handleDelete}>Delete</button>
                        <button className="userProf-notification-action" onClick={handleReview}>Review User</button>
                    </div>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={report.reported_user_img || '../../../public/Gojo.jpeg'} alt={report.reported_user_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to={`/user-profile/${report.reported_user_id}`} className='comment-username'>{report.reported_user_name}</Link>
                                <span className='comment-time -translate-y-2'>{reportComment.comment_date}</span>
                            </div>
                        </div>
                        <div className=''>
                            <p className='text-gray-400 text-sm'>from <Link to={`/anime/${reportComment.anime_id}`} className='text-purple-600 font-extrabold'>{reportComment.title}</Link></p>
                        </div>
                    </div>
                    <div className='comment-body -translate-y-2 translate-x-4'>
                        <p>{reportComment.comment_text}</p>
                    </div>
                </div>
            </>) : (report.entity_type === 'reply' ? (<>
                <div className="userProf-notification-header">
                    <span className="userProf-notification-type border-b border-blue-500 pb-0.5">{report.entity_type}</span>
                    <span className="userProf-notification-time">{report.report_date}</span>
                </div>
                <div className='flex justify-between'>
                    <div className="userProf-notification-body">
                        <img className="userProf-user-profile" src={report.reporting_user_img} alt={report.reporting_user_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${report.reporting_user_id}`}>{report.reporting_user_name}</Link> reported this reply</p>
                    </div>
                    <div className='flex'>
                        <button className="userProf-notification-action mr-2" onClick={handleDelete}>Delete</button>
                        <button className="userProf-notification-action" onClick={handleReview}>Review User</button>
                    </div>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={report.reported_user_img || '../../../public/Gojo.jpeg'} alt={report.reported_user_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to={`/user-profile/${report.reported_user_id}`} className='comment-username'>{report.reported_user_name}</Link>
                                <span className='comment-time -translate-y-2'>{reportReply.reply_date}</span>
                            </div>
                        </div>
                    </div>
                    <div className='comment-body -translate-y-2 translate-x-4'>
                        <p>{reportReply.reply_text}</p>
                    </div>
                </div>
            </>) : (report.entity_type === 'review' ? (<>
                <div className="userProf-notification-header">
                    <span className="userProf-notification-type border-b border-blue-500 pb-0.5">{report.entity_type}</span>
                    <span className="userProf-notification-time">{report.report_date}</span>
                </div>
                <div className='flex justify-between'>
                    <div className="userProf-notification-body">
                        <img className="userProf-user-profile" src={report.reporting_user_img} alt={report.reporting_user_name} />
                        <p className="userProf-notification-text"><Link to={`/user-profile/${report.reporting_user_id}`}>{report.reporting_user_name}</Link> reported this review</p>
                    </div>
                    <div className='flex'>
                        <button className="userProf-notification-action mr-2" onClick={handleDelete}>Delete</button>
                        <button className="userProf-notification-action" onClick={handleReview}>Review User</button>
                    </div>
                </div>
                <div className='mt-3 mb-3 p-3 ml-12 rounded-md bg-gray-700'>
                    <div className='flex justify-between'>
                        <div className='flex'>
                            <img src={report.reported_user_img || '../../../public/Gojo.jpeg'} alt={report.reported_user_name} className='user-photo' />
                            <div className='comment-header -translate-y-1'>
                                <Link to={`/user-profile/${report.reported_user_id}`} className='comment-username'>{report.reported_user_name}</Link>
                                <span className='comment-time -translate-y-2'>{reportReview.review_date}</span>
                            </div>
                        </div>
                        <div className=''>
                            <p className='text-gray-400 text-sm'>from <Link to={`/anime/${reportReview.anime_id}`} className='text-purple-600 font-extrabold'>{reportReview.title}</Link></p>
                        </div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='comment-body -translate-y-2 translate-x-4'>
                            <p>{reportReview.review_text}</p>
                        </div>
                        <p className='text-3xl text-gray-400 font-semibold'>⭐ {reportReview.rating_score ? reportReview.rating_score : "0"}/10</p>
                    </div>
                </div>
            </>) : (
                <>
                    <div className="userProf-notification-header">
                        <span className="userProf-notification-type border-b border-blue-500 pb-0.5">{report.entity_type}</span>
                        <span className="userProf-notification-time">{report.report_date}</span>
                    </div>
                    <div className='flex align-middle'>
                        <p className='text-gray-300 ml-3 mr-3'>About user</p>
                        <div className='flex'>
                            <img className="userProf-user-profile -translate-y-2" src={report.reported_user_img || './../../public/Gojo.jpeg'} alt={report.reported_user_name} />
                            <p className="userProf-notification-text"><Link to={`/user-profile/${report.reported_user_id}`}>{report.reported_user_name}</Link></p>
                        </div>
                    </div>
                    <div className='flex justify-between'>
                        <div className="userProf-notification-body">
                            <img className="userProf-user-profile" src={report.reporting_user_img} alt={report.reporting_user_name} />
                            <p className="userProf-notification-text"><Link to={`/user-profile/${report.reporting_user_id}`}>{report.reporting_user_name}</Link> said: {report.reason}</p>
                        </div>
                        <div className='flex'>
                            <button className="userProf-notification-action mr-2" onClick={handleDelete}>Delete</button>
                            <Link className="userProf-notification-action" to={`/user-profile/${report.reported_user_id}`}>Review User</Link>
                        </div>
                    </div>
                </>
            )))}
        </div>
    </>)
}

export default Reports;