import React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux';
import YouTube from 'react-youtube'
import Slider from '../AnimeSlider';
import StatusChart from '../SegmentedProgressBar'
import ScoreDistributionGraph from '../ScoreDistributionGraph';
import Rating from 'react-rating';
import LineChart from '../LineChart';
import Comments from '../Comments';
import Reviews from '../Review';
import { Navigation, Footer } from './imports'
import './../CSS/style.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const AnimePage = () => {

    let { id } = useParams()
    const navigate = useNavigate();
    const [animeData, setAnimeData] = useState({})
    const user = useSelector((state) => state.auth.user);
    const [isInFavorites, setIsInFavorites] = useState(false);
    const [characterVoiceActor, setCharacterVoiceActor] = useState([]);
    const [production, setProduction] = useState([]);
    const [trailer, setTrailer] = useState({});
    const [recommendation, setRecommendation] = useState([]);
    const [relations, setRelations] = useState([]);
    const [toList, setToList] = useState('Add to list');
    const [rating, setRating] = useState(null);
    const [hoverRating, setHoverRating] = useState(null);
    const [nav, setNav] = useState("Overview");
    const [selectedCharacterLanguage, setSelectedCharacterLanguage] = useState('All');
    const [characterAccordingLanguage, setCharacterAccordingLanguage] = useState([]);
    const [showAllRelations, setShowAllRelations] = useState(false);
    const [interactionCount, setInteractionCount] = useState(0);
    const [interactionRank, setInteractionRank] = useState(0);
    const [interactionPerDate, setInteractionPerDate] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [activeTab, setActiveTab] = useState('Comment');
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [maxComment, setMaxComment] = useState(5);
    const [loadMoreComments, setLoadMoreComments] = useState(false);
    const [ratingOpen, setRatingOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [maxReviews, setMaxReviews] = useState(5);
    const [loadMoreReviews, setLoadMoreReviews] = useState(false);
    const [reviewRating, setReviewRating] = useState(null);
    const [reviewText, setReviewText] = useState('');
    const reviewMenuRef = useRef(null);
    const [reviewMenuContent, setReviewMenuContent] = useState(false);
    const [editModeReview, setEditModeReview] = useState(false);
    const [tempReviewText, setTempReviewText] = useState('');
    const [updatedReviewText, setUpdatedReviewText] = useState('');
    const [updatedRatingReview, setUpdatedRatingReview] = useState(0);
    const [tempRatingReview, setTempRatingReview] = useState(0);
    const [episodes, setEpisodes] = useState([]);
    const [episodeStart, setEpisodeStart] = useState(0);
    const [episodeEnd, setEpisodeEnd] = useState(40);
    const [userReview, setUserReview] = useState({
        bool: false,
        review: {}
    })
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

    const displayedRelations = showAllRelations ? relations : relations.slice(0, 8);
    const characterLanguage = ['Japanese', 'English', 'German', 'Portuguese (BR)', 'Italian', 'Spanish', 'Korean', 'French', 'Hungarian', 'Hebrew']
    const characterVoiceActorJapanese = characterVoiceActor.filter(voiceActor => voiceActor.va_language === 'Japanese');
    const tempCharacterVoiceActorJapanese = characterVoiceActorJapanese.slice(0, 10);
    const [charStart, setCharStart] = useState(0);
    const [charEnd, setCharEnd] = useState(30);
    const [addDiscussionOpen, setAddDiscussionOpen] = useState(false);
    const [discussionTitle, setDiscussionTitle] = useState('');
    const [discussionContent, setDiscussionContent] = useState('');
    const [forums, setForums] = useState([]);


    const toggleReviewMenuContent = () => {
        setReviewMenuContent(!reviewMenuContent);
    };


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

    const handleTitle = (title) => {
        if (title) {
            if (title.length > 15) {
                return title.substring(0, 20) + " ...";
            } else {
                return title;
            }
        }
    }


    useEffect(() => {
        const animeID = id;

        const handleClickOutside = (event) => {
            if (reviewMenuRef.current && !reviewMenuRef.current.contains(event.target)) {
                setReviewMenuContent(false); // Close the menu if click is outside
            }
        };

        axios.get(`http://localhost:5000/anime/${animeID}`)
            .then((response) => {
                setAnimeData(response.data);
            })
            .catch((error) => {
                console.error('Error fetching anime data: ', error);
            })
        axios.get(`http://localhost:5000/anime/${animeID}/keywords`)
            .then((response) => {
                setKeywords(response.data.keywords);
            })
            .catch((error) => {
                console.error('Error fetching anime keywords: ', error);
            })
        axios.get(`http://localhost:5000/anime/${animeID}/rank_interaction`)
            .then((response) => {
                setInteractionCount(response.data.interaction_count);
                setInteractionRank(response.data.interaction_rank);
            })
            .catch((error) => {
                console.error('Error fetching anime interaction data: ', error);
            })
        axios.get(`http://localhost:5000/anime/${animeID}/interaction-per-day`)
            .then((response) => {
                setInteractionPerDate(response.data);
            })
            .catch((error) => {
                console.error('Error fetching anime interaction per date data: ', error);
            })
        axios.get(`http://localhost:5000/anime/${animeID}/statusSegment`)
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

        axios.get(`http://localhost:5000/anime/${animeID}/scoreGraph`)
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

        axios.get(`http://localhost:5000/anime/${animeID}/episodes`)
            .then((response) => {
                setEpisodes(response.data);
            })
            .catch((error) => {
                console.log("Error fetching anime episodes data: ", error);
            })

        handleFetchingForums();

        if (user) {
            axios.get(`http://localhost:5000/user/favorites/check/${user.user_id}/${animeID}`)
                .then((response) => {
                    setIsInFavorites(response.data.isInFavorites);
                })
                .catch((error) => {
                    console.error('Error checking favorites: ', error);
                })
            axios.get(`http://localhost:5000/user/add_to_list/check/${user.user_id}/${animeID}`)
                .then((response) => {
                    if (response.status === 200) {
                        setToList(response.data.status);
                    }
                    else if (response.status === 400) {
                        setToList('Add to list');
                    }
                })
                .catch((error) => {
                    console.error('Error checking list: ', error);
                })

            axios.get(`http://localhost:5000/anime/rating/check/${user.user_id}/${animeID}`)
                .then((response) => {
                    if (response.status === 200) {
                        setRating(response.data.rating_score);
                        setHoverRating(response.data.rating_score);
                    }
                })
                .catch((error) => {
                    console.error('Error checking rating: ', error);
                })

            axios.post(`http://localhost:5000/user_interaction`, {
                userId: user.user_id,
                animeId: id,
                status: 'Visited'
            })
                .catch((error) => {
                    console.error('Error adding to interaction: ', error);
                });

            axios.get(`http://localhost:5000/user/anime/review/${id}/${user.user_id}`)
                .then((response) => {
                    setUserReview({
                        bool: response.data.bool,
                        review: response.data.review
                    })
                    setTempReviewText(response.data.review.review_text);
                    setUpdatedReviewText(response.data.review.review_text);
                    setTempRatingReview(response.data.review.rating_score);
                    setUpdatedRatingReview(response.data.review.rating_score);
                })
                .catch((error) => {
                    console.error('Error checking user review: ', error);
                });
        }

        axios.get(`http://localhost:5000/anime/${animeID}/character-voice-actor`)
            .then((response) => {
                setCharacterVoiceActor(response.data);
                setCharacterAccordingLanguage(response.data);
            })
            .catch((error) => {
                console.error('Error fetching character voice actors: ', error);
            })

        axios.get(`http://localhost:5000/anime/${animeID}/production`)
            .then((response) => {
                setProduction(response.data)
            })
            .catch((error) => {
                console.error('Error fetching production: ', error);
            })
        axios.get(`http://localhost:5000/anime/${animeID}/trailer`)
            .then((response) => {
                setTrailer(response.data)
            })
            .catch((error) => {
                console.error('Error fetching trailer: ', error);
            })
        axios.get(`http://localhost:5000/anime/${animeID}/recommendations`)
            .then((response) => {
                setRecommendation(response.data)
            })
            .catch((error) => {
                console.error('Error fetching recommendations: ', error);
            })
        axios.get(`http://localhost:5000/anime/${animeID}/related`)
            .then((response) => {
                setRelations(response.data)
            })
            .catch((error) => {
                console.error('Error fetching related anime: ', error);
            })

        handleFetchingComments();
        handleFetchingReviews();

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [id, user, reviewMenuRef, tempReviewText, rating])

    const formatReleaseDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const extractYouTubeVideoId = (url) => {
        const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

        const match = url.match(regExp);
        if (match && match[1]) {
            return match[1];
        } else {
            return null;
        }
    }

    function getCardClassName(episodeNumber) {
        const pattern = [1, 2, 3, 4, 2, 3, 4, 1, 3, 4, 1, 2, 4, 1, 2, 3];
        const index = (episodeNumber - 1) % pattern.length;
        return `episode-card${pattern[index]}`;
    }

    const handleFavorites = () => {
        if (user) {
            const userId = user.user_id;
            const animeId = animeData.anime_id;

            if (isInFavorites) {
                axios.delete(`http://localhost:5000/user/favorites/${userId}/${animeId}`)
                    .then(() => {
                        setIsInFavorites(false);
                        toast.success("Removed from favorites successfully")
                    })
                    .catch((error) => {
                        console.error('Error removing from favorites: ', error);
                        toast.error("Error removing from favorites")
                    });
            } else {
                axios.post(`http://localhost:5000/user/favorites`, { userId, animeId })
                    .then(() => {
                        setIsInFavorites(true);
                        toast.success("Added to favorites successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding to favorites: ', error);
                        toast.error("Error adding to favorites")
                    });
            }
        } else {
            toast.error("Please login first")
            navigate('/login')
        }
    }

    const handleAddToList = (e) => {
        if (user) {
            if (e === 'watching') {
                axios.post(`http://localhost:5000/user/add_to_list`,
                    { userId: user.user_id, animeId: animeData.anime_id, status: 'Watching' })
                    .then(() => {
                        setToList('Watching');
                        toast.success("Added to Watching successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding to list: ', error);
                        toast.error("Error adding to list")
                    });
            }
            else if (e === 'planning') {
                axios.post(`http://localhost:5000/user/add_to_list`,
                    { userId: user.user_id, animeId: animeData.anime_id, status: 'Planning' })
                    .then(() => {
                        setToList('Planning');
                        toast.success("Added to Planning successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding to list: ', error);
                        toast.error("Error adding to list")
                    });
            }
            else if (e === 'completed') {
                axios.post(`http://localhost:5000/user/add_to_list`,
                    { userId: user.user_id, animeId: animeData.anime_id, status: 'Completed' })
                    .then(() => {
                        setToList('Completed');
                        toast.success("Added to Completed successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding to list: ', error);
                        toast.error("Error adding to list")
                    });
            }
            else if (e === 'dropped') {
                axios.post(`http://localhost:5000/user/add_to_list`,
                    { userId: user.user_id, animeId: animeData.anime_id, status: 'Dropped' })
                    .then(() => {
                        setToList('Dropped');
                        toast.success("Added to Dropped successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding to list: ', error);
                        toast.error("Error adding to list")
                    });
            }
            else if (e === 'paused') {
                axios.post(`http://localhost:5000/user/add_to_list`,
                    { userId: user.user_id, animeId: animeData.anime_id, status: 'Paused' })
                    .then(() => {
                        setToList('Paused');
                        toast.success("Added to Paused successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding to list: ', error);
                        toast.error("Error adding to list")
                    });
            }
        } else {
            toast.error("Please login first")
            navigate('/login')
        }
    }

    const handleSaveRating = (r) => {
        if (user) {
            axios.post(`http://localhost:5000/user/anime/rating`, {
                userId: user.user_id,
                animeId: animeData.anime_id,
                rating: r
            })
                .then(() => {
                    setRating(r);
                    setRatingOpen(false);
                    toast.success("Rating was updated successfully")
                })
                .catch((error) => {
                    console.error('Error saving rating: ', error);
                    toast.error("Error saving rating")
                })
        }
        else {
            toast.error("Please login first")
            navigate('/login')
        }
    }

    const handleSaveRatingReview = (r) => {
        setReviewRating(r);
    }

    const FullStar = () => (
        <div className='pr-2 pl-2 justify-center mt-1'>
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="#4166F5" >
                <path d="M12 .587l3.668 7.431 8.332 1.209-6.001 5.852 1.415 8.253-7.414-3.897-7.414 3.897 1.415-8.253-6.001-5.852 8.332-1.209z" />
            </svg>
        </div>
    );

    const EmptyStar = () => (
        <div className='pr-2 pl-2 justify-center align-middle mt-1'>
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="#25294e" stroke='#FFF'>
                <polygon points="12 .587 15.668 8.018 24 9.227 18 15.079 19.416 23.332 12 19.435 4.584 23.332 6 15.079 0 9.227 8.332 8.018" />
            </svg>
        </div>
    );

    const EmptyStarReview = () => (
        <div className='pr-2 pl-2 justify-center align-middle mt-1'>
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="#253142" stroke='#FFF'>
                <polygon points="12 .587 15.668 8.018 24 9.227 18 15.079 19.416 23.332 12 19.435 4.584 23.332 6 15.079 0 9.227 8.332 8.018" />
            </svg>
        </div>
    );

    const FullStarReview = () => (
        <div className='pr-2 pl-2 justify-center mt-1'>
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="#FFEF00" >
                <path d="M12 .587l3.668 7.431 8.332 1.209-6.001 5.852 1.415 8.253-7.414-3.897-7.414 3.897 1.415-8.253-6.001-5.852 8.332-1.209z" />
            </svg>
        </div>
    );


    const handleCharacterLanguageSelect = (event) => {
        setSelectedCharacterLanguage(event.target.value);
        if (event.target.value === "All") {
            setCharacterAccordingLanguage(characterVoiceActor);
            setCharStart(0);
            setCharEnd(30);
        } else {
            const tempCharacters = characterVoiceActor.filter(character => character.va_language === event.target.value);
            setCharacterAccordingLanguage(tempCharacters);
            setCharStart(0);
            setCharEnd(30);
        }
    }

    const handleNextCharacters = () => {
        if (charStart + 30 < characterAccordingLanguage.length) {
            setCharStart(charStart + 30);
        }
        if (charEnd + 30 > characterAccordingLanguage.length) {
            setCharEnd(characterAccordingLanguage.length);
        } else {
            setCharEnd(charEnd + 30);
        }
    }

    const handleNextEpisodes = () => {
        if (episodeStart + 40 < episodes.length) {
            setEpisodeStart(episodeStart + 40);
        }
        if (episodeEnd + 40 > episodes.length) {
            setEpisodeEnd(episodes.length);
        } else {
            setEpisodeEnd(episodeEnd + 40);
        }
    }

    const handlePreviousCharacters = () => {
        if (charStart - 30 > 0) {
            setCharStart(charStart - 30);
            setCharEnd(charEnd - 30);
        } else {
            setCharStart(0);
            setCharEnd(30);
        }
        if (charEnd === characterAccordingLanguage.length) {
            setCharEnd(charEnd - (charEnd % 30));
        }
        else if (charEnd - 30 > 30) {
            setCharEnd(charEnd - 30)
        } else {
            setCharEnd(30);
        }
    }

    const handlePreviousEpisodes = () => {
        if (episodeStart - 40 > 0) {
            setEpisodeStart(episodeStart - 40);
            setEpisodeEnd(episodeEnd - 40);
        } else {
            setEpisodeStart(0);
            setEpisodeEnd(40);
        }
        if (episodeEnd === episodes.length) {
            setEpisodeEnd(episodeEnd - (episodeEnd % 40));
        }
        else if (episodeEnd - 40 > 40) {
            setEpisodeEnd(episodeEnd - 40)
        } else {
            setEpisodeEnd(40);
        }
    }

    const handleActiveTab = (tabName) => {
        setActiveTab(tabName);
    }

    const handleCommentTextChange = (event) => {
        setCommentText(event.target.value);
    }

    const handleCommentPost = () => {
        if (user) {
            if (commentText === '') {
                alert('Comment text can not be empty');
            } else {
                axios.post(`http://localhost:5000/user/anime/comment`, {
                    userId: user.user_id,
                    animeId: animeData.anime_id,
                    commentText: commentText,
                })
                    .then((response) => {
                        setCommentText('');
                        handleFetchingComments();
                        toast.success("Comment was posted successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding comment: ', error);
                        toast.error("Error adding comment")
                    });
            }
        } else {
            toast.error("Please login first")
            navigate('/login');
        }
    }

    const handleReviewTextChange = (event) => {
        setReviewText(event.target.value);
    }

    const handleReviewPost = () => {
        if (user) {
            if (reviewText === '') {
                alert('Review text can not be empty')
            } else {
                axios.post(`http://localhost:5000/user/anime/review`, {
                    userId: user.user_id,
                    animeId: animeData.anime_id,
                    reviewText: reviewText,
                    reviewRating: reviewRating,
                })
                    .then((response) => {
                        setReviewText('');
                        handleFetchingReviews();
                        toast.success("Review was posted successfully")
                    })
                    .catch((error) => {
                        console.error('Error adding review: ', error);
                        toast.error("Error adding review")
                    })
            }
        } else {
            toast.error("Please login first")
            navigate('/login');
        }
    }

    const handleFetchingComments = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/anime/comments/${id}`);
            setComments(response.data);
            checkLoadMore();
        } catch (error) {
            setComments([]);
            console.error('Error fetching comments: ', error);
        }
    }

    const handleFetchingReviews = async () => {
        try {
            if (user) {
                const response = await axios.get(`http://localhost:5000/anime/reviews/${id}/${user.user_id}`);
                setReviews(response.data);
                checkLoadMore();
            } else {
                const response = await axios.get(`http://localhost:5000/anime/reviews/${id}/${"0"}`);
                setReviews(response.data);
                checkLoadMoreReviews();
            }
        } catch (error) {
            setReviews([]);
            console.error('Error fetching reviews: ', error);
        }
    }

    const checkLoadMore = () => {
        if (maxComment === comments.length) {
            setLoadMoreComments(false);
        } else {
            setLoadMoreComments(true);
        }
    }

    const checkLoadMoreReviews = () => {
        if (maxReviews === reviews.length) {
            setLoadMoreReviews(false);
        } else {
            setLoadMoreReviews(true);
        }
    }

    const handleLoadMore = () => {
        if (maxComment === comments.length) {
            setLoadMoreComments(false);
        } else if (maxComment + 5 == comments.length) {
            setMaxComment(5 + maxComment);
            setLoadMoreComments(false);
        } else if (maxComment + 5 < comments.length) {
            setMaxComment(5 + maxComment);
            setLoadMoreComments(true);
        } else if (maxComment + 5 > comments.length) {
            setMaxComment(comments.length);
            setLoadMoreComments(false);
        }
    }

    const handleLoadMoreReviews = () => {
        if (maxReviews === reviews.length) {
            setLoadMoreReviews(false);
        } else if (maxReviews + 5 == reviews.length) {
            setMaxReviews(5 + maxReviews);
            setLoadMoreReviews(false);
        } else if (maxReviews + 5 < reviews.length) {
            setMaxReviews(5 + maxReviews);
            setLoadMoreReviews(true);
        } else if (maxReviews + 5 > reviews.length) {
            setMaxReviews(reviews.length);
            setLoadMoreReviews(false);
        }
    }

    const handleReviewEdit = () => {
        setEditModeReview(true);
    }

    const handleReviewDelete = () => {
        axios.post(`http://localhost:5000/user/anime/review/delete/${user.user_id}/${userReview.review.anime_id}/${userReview.review.review_id}`)
            .then((response) => {
                setReviewMenuContent(false);
                toast.success("Review deleted successfully")
            })
            .catch((error) => {
                console.error('Error deleting review: ', error);
                toast.error("Error deleting review")
            })
    }

    const handleReviewText = (event) => {
        setUpdatedReviewText(event.target.value);
    }

    const handleReviewCancel = () => {
        setEditModeReview(false);
        setReviewMenuContent(false);
        setUpdatedReviewText(userReview.review_text);
    }

    const handleReviewUpdate = () => {
        if (updatedReviewText !== userReview.review_text) {
            axios.post(`http://localhost:5000/user/anime/review/update`, {
                userId: user.user_id,
                animeId: id,
                reviewId: userReview.review.review_id,
                reviewText: updatedReviewText,
                ratingScore: updatedRatingReview,
            })
                .then((response) => {
                    setTempReviewText(response.data.review_text);
                    setEditModeReview(false);
                    setUpdatedReviewText(response.data.comment_text);
                    setReviewMenuContent(false);
                    setTempRatingReview(response.data.rating_score);
                    toast.success("Review updated successfully")
                })
                .catch((error) => {
                    console.error('Error updating review: ', error);
                    toast.error("Error updating review")
                })
        } else {
            setEditModeReview(false);
            setUpdatedReviewText(userReview.review.review_text);
            setUpdatedRatingReview(userRating.review.rating_score);
        }
    }

    const handleEditRatingReview = (e) => {
        setUpdatedRatingReview(e);
    }

    const handleDDiscussionTitle = (event) => {
        setDiscussionTitle(event.target.value);
    }

    const handleDiscussionContent = (event) => {
        setDiscussionContent(event.target.value);
    }

    const handleFetchingForums = () => {
        axios.get(`http://localhost:5000/anime/forums/${id}`)
            .then((response) => {
                setForums(response.data);
            })
            .catch((error) => {
                setForums([])
                console.error('Error fetching forums: ', error);
            })
    }

    const handleForumPost = () => {
        if (discussionTitle === '' || discussionContent === '') {
            alert('Forum Title or Forum Content can not be empty')
        } else {
            axios.post(`http://localhost:5000/user/anime/forumPost`, {
                userId: user.user_id,
                animeId: animeData.anime_id,
                title: discussionTitle,
                content: discussionContent,
            })
                .then((response) => {
                    handleFetchingForums()
                    setAddDiscussionOpen(false);
                    setDiscussionContent('');
                    setDiscussionTitle('');
                    toast.success("Forum was posted successfully")
                })
                .catch((error) => {
                    console.error('Error posting forum: ', error);
                    toast.error("Error posting forum")
                })
        }
    }

    return (<>
        <Navigation />
        <main className='bg-gray-800'>
            <div className="cover-photo-container">
                <img src={animeData.top_image} alt={animeData.title} className="cover-photo" />
            </div>
            <div className="anime-container">
                <div className="left-column">
                    <img src={animeData.cover_image} alt={animeData.title} className="anime-image" />
                    <div className='anime-sidebar mb-5 mt-0 -translate-y-5'><pre className='rank_tab font-sans font-bold text-gray-400 text-center'>⭐  #{animeData.rating_position} Highest Rated All Time</pre></div>
                    <div className='anime-sidebar mb-5 mt-0 -translate-y-5'><pre className='rank_tab font-sans font-bold text-gray-400 text-center'>❤️  #{animeData.favorites_position} Most Popular All Time</pre></div>
                    <div className="anime-sidebar -translate-y-4">
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Title:<br /></strong> {animeData.title}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Release Date:<br /></strong> {formatReleaseDate(animeData.release_date)}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Season:<br /></strong> {animeData.airing_season}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Total Episodes:<br /></strong> {animeData.episode_no} </p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Episode Duration:<br /></strong> {animeData.runtime} </p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Source:<br /></strong> {animeData.source}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Show Type:<br /></strong> {animeData.showtype}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Language:<br /></strong> {animeData.language}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Status:<br /></strong> {animeData.ongoing_status ? "Ongoing" : "Finished"}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Favorites:<br /></strong> {animeData.favorites}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Title Japanese:<br /></strong> {animeData.title_japanese}</p>
                        <p style={{ paddingBottom: '12px' }} className='text-gray-400'><strong className='text-gray-200'>Title Synonyms:<br /></strong> {animeData.title_synonyms && animeData.title_synonyms.map((title, index) => (
                            <span key={index}>{title}{index !== animeData.title_synonyms.length - 1 && <br />}</span>
                        ))}</p>
                    </div>
                    <div className="animepage-genre-section">
                        <h2 className="section-title">Genres</h2>
                        <div className="animepage-genres-container">
                            {animeData.genres && animeData.genres.map((genre, index) => (
                                <button key={index} className="animepage-genre">{genre}</button>
                            ))}
                        </div>
                    </div>
                    <div className="tags-section">
                        <h2 className="section-title">Tags</h2>
                        <div className="tags-container">
                            {keywords && keywords.map((keyword, index) => (
                                <button key={index} className="tag">{keyword}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="animePage-details">
                    <h1 style={{ fontSize: '5em', fontWeight: 'bolder', paddingBottom: '10px', fontFamily: 'sans-serif' }} className='text-gray-200'>{handleTitle(animeData.title)}</h1>
                    <div className="badge-container">
                        <span className="badge2 -translate-y-2">{animeData.rated}</span>
                        <span className="badge2 -translate-y-2">Ratings: {animeData.average_rating}</span>
                    </div>
                    <div className="anime-actions">
                        <div className='button-group'>
                            <button className="anime-button watch-now" onClick={() => setNav("Episodes")}>Watch now</button>

                            <div className="dropdown-add">
                                <button className="anime-button add-to-list">{toList}</button>
                                <label for="toggle-dropdown" className="dropdown-toggle"></label>
                                <input type="checkbox" id="toggle-dropdown" className="dropdown-checkbox" />
                                <div className="dropdown-content">
                                    <button className="dropdown-item" onClick={() => handleAddToList('watching')}>Set as Watching</button>
                                    <button className="dropdown-item" onClick={() => handleAddToList('planning')}>Set as Planning</button>
                                    <button className="dropdown-item" onClick={() => handleAddToList('dropped')}>Set as Dropped</button>
                                    <button className="dropdown-item" onClick={() => handleAddToList('completed')}>Set as Completed</button>
                                    <button className="dropdown-item" onClick={() => handleAddToList('paused')}>Set as Paused</button>
                                </div>
                            </div>

                            <button className="anime-button favorites" onClick={handleFavorites}>{isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}</button>
                        </div>
                        <div className='rating-populatiry-group'>
                            <div className='flex'>
                                {user && (<>
                                    <div class="Anihub-rating">
                                        <span class="star-icon">&#9733;</span>
                                        <span class="rating-value text-2xl -translate-y-0.5">{rating ? parseInt(rating) : '0'}/10</span>
                                    </div>
                                </>)}
                                <button onClick={() => setRatingOpen(true)} className='12'>
                                    <div class="Anihub-rating">
                                        <span class="star-icon">&#9734;</span>
                                        <span class="rating-value text-2xl -translate-y-0.5">Rate</span>
                                    </div>
                                </button>
                            </div>
                            {ratingOpen && (
                                <>
                                    <div className='modal z-10'>

                                        <div className='modal-content'>
                                            <button className='close-modal -translate-y-7  w-1' onClick={() => setRatingOpen(false)}>x</button>
                                            <div className='-translate-y-24'>
                                                <p className='text-9xl pb-3'>⭐</p>
                                                <p className='text-white text-xl font-bold pb-1'>Rate This</p>
                                                <p className='text-yellow-300 text-3xl font-bold pb-3'>{animeData.title.substring(0, 20)}</p>
                                                <Rating
                                                    start={0}
                                                    stop={10}
                                                    step={1}
                                                    fractions={1}
                                                    initialRating={rating}
                                                    onChange={handleSaveRating}
                                                    emptySymbol={<EmptyStar />}
                                                    fullSymbol={<FullStar />}
                                                    placeholderRating={0}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="anime-description text-gray-400">{animeData.description}</p>

                    <div className="animepage-nav-tabs">
                        <button onClick={() => setNav("Overview")} className="animepage-nav-tab">Overview</button>
                        <button onClick={() => setNav("Episodes")} className="animepage-nav-tab">Episodes</button>
                        <button onClick={() => setNav("Characters")} className="animepage-nav-tab">Characters</button>
                        <button onClick={() => setNav("Staffs")} className="animepage-nav-tab">Staff</button>
                        <button onClick={() => setNav("Stats")} className="animepage-nav-tab">Stats</button>
                        <button onClick={() => setNav("Social")} className="animepage-nav-tab">Social</button>
                    </div>

                    {(nav === 'Overview') ? (<>
                        <div className="animepage-relations mt-3 mb-12">
                            <div className="relations-header">
                                <h2 className="relations-title">Relations</h2>
                            </div>
                            <div className="relations-grid">
                                {displayedRelations && displayedRelations.map((relation, index) => (
                                    <Link to={`/anime/${relation.anime_id}`} key={relation.anime_id}>
                                        <div className='relation-card' style={{ backgroundImage: `url(${relation.cover_image})` }}>
                                            <div className='relation-info'>
                                                <h3 className='relation-name'>{relation.title}</h3>
                                                <p className='relation-type'>{relation.relation_type}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {(relations.length > 8) && (<>
                                <div className="flex justify-center mt-4">
                                    <button
                                        onClick={() => setShowAllRelations(!showAllRelations)} // Toggle the state to show all/not all
                                        className="show-all-button px-4 py-2 bg-blue-700 text-white font-semibold rounded hover:bg-blue-600 transition duration-300" // Add appropriate styling for this button
                                    >
                                        {showAllRelations ? "Show Less" : "Show All"}
                                    </button>
                                </div>
                            </>)}
                        </div>

                        <div className="character-section mb-14">
                            <h2 className="section-title">Characters</h2>
                            <div className="character-grid">
                                {
                                    tempCharacterVoiceActorJapanese.map((characterVoiceActor, index) => (
                                        <div className='character-card' key={index}>
                                            <div className='character-details'>
                                                <img src={characterVoiceActor.character_image} alt={characterVoiceActor.character_name} className='character-image' />
                                                <div>
                                                    <h3 className='character-name text-gray-300'>{characterVoiceActor.character_name}</h3>
                                                </div>
                                            </div>
                                            <div className='voice-actor-details'>
                                                <div>
                                                    <p className='voice-actor-name text-gray-300'>{characterVoiceActor.va_name}</p>
                                                    <p className='voice-actor-language'>{characterVoiceActor.va_language}</p>
                                                </div>
                                                <img src={characterVoiceActor.va_image} alt={characterVoiceActor.va_name} className='voice-actor-image' />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="animepage-staffs mb-12">
                            <h2 className="staff-title">Production</h2>
                            <div className="staff-grid">
                                {production.map((pr, index) => (
                                    <div className='staff-card'>
                                        <img key={index}
                                            src={
                                                (pr.type === 'producer') ?
                                                    './../../../public/producer.jpg' :
                                                    (pr.type === 'licensor' ?
                                                        './../../../public/licensor.jpg' :
                                                        './../../../public/studio.jpg')
                                            }
                                            alt='Production'
                                            className='staff-image'
                                        />
                                        <div className='staff-info'>
                                            <h3 className='staff-name text-gray-300'>{pr.studio_name}</h3>
                                            <p className='staff-role'>{pr.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="status-score-container">

                            <div className="distribution-container status-container">
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

                            <div className="distribution-container score-container">
                                <h2 className="distribution-title">Score Distribution</h2>
                                <ScoreDistributionGraph scoreData={scoreData} />
                            </div>

                        </div>

                        <div className="trailer-section mb-12">
                            <h2 className="trailer-title">Trailer</h2>
                            <div className="video-container">
                                {trailer && trailer.trailer_title && (
                                    <YouTube
                                        videoId={extractYouTubeVideoId(trailer.trailer_title)}
                                        opts={{ width: '100%', height: '100%' }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="animepage-recommendation">
                            <h2 className="recommendation-title">Recommendations</h2>
                            <Slider slides={recommendation} slideCount={5} />
                        </div>

                        <div className="comment-section">
                            <div className="flex justify-between">
                                <h2 className='comment-section-title'>Forums</h2>
                                {user && <button className="add-discussion-list-button h-10" onClick={() => setAddDiscussionOpen(!addDiscussionOpen)}>{addDiscussionOpen ? 'Cancel' : 'Add Discussion'}</button>}
                            </div>
                            {addDiscussionOpen && (<>
                                <div className='mb-3'>
                                    <label htmlFor='discussion title' className='text-gray-300'>Forum Title</label>
                                    <input
                                        type='text'
                                        name='discussion title'
                                        id='discussion title'
                                        value={discussionTitle}
                                        onChange={handleDDiscussionTitle}
                                        placeholder='Add forum title'
                                        className='ml-4 rounded-md w-96 p-2 text-sm mb-2'
                                    >
                                    </input>
                                    <br />
                                    <label htmlFor='discussion content' className='text-gray-300'>Forum Content</label> <br />
                                    <textarea
                                        type='text'
                                        name='discussion content'
                                        id='discussion content'
                                        value={discussionContent}
                                        onChange={handleDiscussionContent}
                                        placeholder='Add your thoughts'
                                        className='w-full rounded-md mt-2 p-3 min-h-20'>
                                    </textarea>
                                    <button className='post-comment-btn' onClick={handleForumPost}>Post</button>
                                </div>
                            </>)}
                            {forums && forums.slice(0, 4).map((forum) => (
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

                        <div className='Animepage-tab'>
                            <button className={activeTab === 'Comment' ? 'tablinks active' : 'tablinks'} onClick={() => handleActiveTab('Comment')}>Comments</button>
                            <button className={activeTab === 'Review' ? 'tablinks active' : 'tablinks'} onClick={() => handleActiveTab('Review')}>Reviews</button>
                        </div>
                        {activeTab === 'Comment' ? <>
                            <div id='Comments' className='tabcontent' style={{ display: 'block' }}>
                                <div className='comment-section'>
                                    <h2 className='comment-section-title'>Comments</h2>
                                    {user && <><div className='User flex'>
                                        <img src={user.url || '../../../public/Gojo.jpeg'} alt='User Name' className='user-photo' />
                                        <Link to="/profile" className='comment-username translate-y-2 pl-2 text-gray-300'>{user.display_name}</Link>
                                    </div></>}
                                    <div className='comment-box -translate-y-5'>
                                        <textarea
                                            placeholder='Leave a comment'
                                            className='comment-input bg-gray-200'
                                            value={commentText}
                                            onChange={handleCommentTextChange}
                                        ></textarea>
                                        <div className='flex justify-between'>
                                            <button className='post-comment-btn' onClick={handleCommentPost}>Post</button>
                                            <button className='text-3xl mt-2' onClick={handleFetchingComments}>🔃</button>
                                        </div>
                                    </div>

                                    <div className='user-comment'>
                                        {comments ? (comments.slice(0, maxComment).map((comment, index) => (
                                            <Comments comment={comment} handleFetchingComments={handleFetchingComments} />
                                        ))) : <></>}
                                    </div>
                                    {loadMoreComments && (
                                        <div className="load-more-container">
                                            <button className="load-more-btn" onClick={handleLoadMore}>Load More Comments</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </> : <>
                            <div id='Reviews' className='tabcontent'>
                                <div className='review-section'>
                                    <h2 className='review-section-title'>Reviews</h2>
                                    <div className='review-box'>
                                        {user && userReview.bool ? (<></>) : (<>
                                            {user && <><div className='User flex'>
                                                <img src={user.url || '../../../public/Gojo.jpeg'} alt='User Name' className='user-photo' />
                                                <Link to="/profile" className='comment-username translate-y-2 pl-2'>{user.display_name}</Link>
                                            </div></>}
                                            <textarea
                                                placeholder="Leave a review"
                                                className="review-input bg-gray-200"
                                                value={reviewText}
                                                onChange={handleReviewTextChange}
                                            ></textarea>
                                            <div className='flex justify-between'>
                                                <div className='flex'>
                                                    <button className="post-review-btn" onClick={handleReviewPost}>Post Review</button>
                                                    <div className='star-rating'>
                                                        <Rating
                                                            className='-translate-x-11 translate-y-0.5'
                                                            start={0}
                                                            stop={10}
                                                            step={2}
                                                            fractions={2}
                                                            initialRating={10}
                                                            onChange={handleSaveRatingReview}
                                                            emptySymbol={<EmptyStarReview />}
                                                            fullSymbol={<FullStarReview />}
                                                            placeholderRating={10}
                                                        />
                                                    </div>
                                                </div>
                                                <button className='text-3xl mt-2' onClick={handleFetchingReviews}>🔃</button>
                                            </div>
                                        </>)}
                                    </div>
                                    <div className="user-review">
                                        {user && userReview.bool ? (<>
                                            <div className='bg-gray-800 mb-3 p-3 rounded-lg border border-cyan-600'>
                                                {editModeReview ? (<>
                                                    <div className='flex justify-between'>
                                                        <div className='flex'>
                                                            <img src={userReview.review.url || '../../../public/Gojo.jpeg'} alt={userReview.review.display_name} className='user-photo' />
                                                            <Link to="/profile" className='comment-username translate-y-2'>{userReview.review.display_name}</Link>
                                                        </div>
                                                        <div className='star-rating'>
                                                            <Rating
                                                                className='-translate-x-11 translate-y-0.5'
                                                                start={0}
                                                                stop={10}
                                                                step={2}
                                                                fractions={2}
                                                                initialRating={userReview.review.rating}
                                                                onChange={handleEditRatingReview}
                                                                emptySymbol={<EmptyStarReview />}
                                                                fullSymbol={<FullStarReview />}
                                                                placeholderRating={0}
                                                            />
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        placeholder='Give your updated review'
                                                        className='review-input w-full bg-gray-200'
                                                        value={updatedReviewText}
                                                        onChange={handleReviewText}
                                                    ></textarea>
                                                    <div className='flex justify-between'>
                                                        <button className='post-comment-btn' onClick={handleReviewUpdate}>Update</button>
                                                        <button className='post-comment-btn' onClick={handleReviewCancel}>Cancel</button>
                                                    </div>
                                                </>) : (<>
                                                    <div className='comment-menu-button text-gray-50'>
                                                        <div ref={reviewMenuRef}>
                                                            <button className='review-menu-trigger -translate-x-1' onClick={toggleReviewMenuContent}>&#8942;</button>
                                                            {reviewMenuContent && (
                                                                <>
                                                                    <div className='comment-menu-content'>
                                                                        <ul>
                                                                            {user && (user.user_id === userReview.review.user_id && <>
                                                                                <li><button onClick={handleReviewEdit}>✍️ Edit</button></li>
                                                                                <li><button onClick={handleReviewDelete}>🚮 Delete</button></li>
                                                                            </>)}
                                                                        </ul>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className='comment-main'>
                                                        <div className='flex'>
                                                            <img src={userReview.review.url || '../../../public/Gojo.jpeg'} alt={userReview.review.display_name} className='user-photo' />
                                                            <div>
                                                                <div className='comment-header -translate-y-1'>
                                                                    <Link to="/profile" className='comment-username'>{userReview.review.display_name}</Link>
                                                                    <span className='comment-time -translate-y-2'>{formatTimeDifference(userReview.review.review_date)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='comment-body -translate-y-2 translate-x-4'>
                                                            <p>{userReview.review.review_text}</p>
                                                        </div>
                                                        <div className="comment-actions">
                                                            <div className='flex w-full justify-between'>
                                                                <div className="vote-section">
                                                                    <button className='vote-disabled upvote-disabled bg-gray-400 text-gray-50' disabled>&#x25B2; {userReview.review.upvote_count}</button>
                                                                    <button className='vote-disabled downvote-disabled  bg-gray-400 text-gray-50' disabled>&#x25BC; {userReview.review.downvote_count}</button>
                                                                </div>
                                                                <p className='text-3xl text-gray-400 font-semibold'>⭐ {tempRatingReview ? tempRatingReview : "0"}/10</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>)}
                                            </div>
                                        </>) : (<></>)}
                                        {reviews && reviews.slice(0, maxReviews).map((review, index) => (
                                            <Reviews review={review} />
                                        ))}
                                    </div>
                                    <div className="load-more-container">
                                        <button className="load-more-btn" onClick={handleLoadMoreReviews}>Load More Reviews</button>
                                    </div>
                                </div>
                            </div>
                        </>}

                    </>) : (nav === "Characters" ? (<>
                        <div className="character-section">
                            <h2 className="section-title">Characters</h2>
                            <select value={selectedCharacterLanguage} onChange={handleCharacterLanguageSelect} className='w-auto'>
                                <option value="All">All</option>
                                {characterLanguage.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))}
                            </select>
                            <div className="character-grid">
                                {characterAccordingLanguage.slice(charStart, charEnd).map((characterVoiceActor, index) => (
                                    <div className='character-card' key={index}>
                                        <div className='character-details'>
                                            <img src={characterVoiceActor.character_image} alt={characterVoiceActor.character_name} className='character-image' />
                                            <div>
                                                <h3 className='character-name text-gray-300'>{characterVoiceActor.character_name}</h3>
                                            </div>
                                        </div>
                                        <div className='voice-actor-details'>
                                            <div>
                                                <p className='voice-actor-name text-gray-300'>{characterVoiceActor.va_name}</p>
                                                <p className='voice-actor-language'>{characterVoiceActor.va_language}</p>
                                            </div>
                                            <img src={characterVoiceActor.va_image} alt={characterVoiceActor.va_name} className='voice-actor-image' />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className='flex justify-end'>
                                <button className='text-xl mr-5 relative text-gray-300' onClick={handlePreviousCharacters}>
                                    Prev
                                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500"></span>
                                </button>
                                <button className='text-xl mr-3 relative text-gray-300' onClick={handleNextCharacters}>
                                    Next
                                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500"></span>
                                </button>
                            </div>

                        </div>
                    </>) : (nav === "Staffs" ? (<>
                        <div className="animepage-staffs">
                            <h2 className="staff-title">Production</h2>
                            <div className="staff-grid">
                                {production.map((pr, index) => (
                                    <div className='staff-card'>
                                        <img key={index}
                                            src={
                                                (pr.type === 'producer') ?
                                                    './../../../public/producer.jpg' :
                                                    (pr.type === 'licensor' ?
                                                        './../../../public/licensor.jpg' :
                                                        './../../../public/studio.jpg')
                                            }
                                            alt='Production'
                                            className='staff-image'
                                        />
                                        <div className='staff-info'>
                                            <h3 className='staff-name text-gray-300'>{pr.studio_name}</h3>
                                            <p className='staff-role'>{pr.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>) : (nav === "Stats" ? (<>
                        <div className='distribution-container2 mt-6'>
                            <h2 className="staff-title">Rankings</h2>
                            <div className='grid grid-cols-3'>
                                <div className='rank_tab pt-3 pb-3 rounded-xl shadow-lg w-11/12 mb-5 mt-0'><pre className='font-sans font-bold text-gray-300 text-center'>⭐             #{animeData.rating_position} Highest Rated All Time    </pre></div>
                                <div className='rank_tab pt-3 pb-3 rounded-xl shadow-lg w-11/12 mb-5 mt-0'><pre className='font-sans font-bold text-gray-300 text-center'>❤️             #{animeData.favorites_position} Most Popular All Time   </pre></div>
                                <div className='rank_tab pt-3 pb-3 rounded-xl shadow-lg w-11/12 mb-5 mt-0'><pre className='font-sans font-bold text-gray-300 text-center'>👆             #{interactionCount} Total Interactions    </pre></div>
                                <div className='rank_tab pt-3 pb-3 rounded-xl shadow-lg w-11/12 mb-5 mt-0'><pre className='font-sans font-bold text-gray-300 text-center'>📈            #{interactionRank} Most Trending All Time    </pre></div>
                            </div>
                        </div>
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
                    </>) : (nav === 'Episodes' ? (<>
                        <div className='distribution-container2 mt-6'>
                            <h2 className="distribution-title">Episodes</h2>
                            <div className="episodes-container">
                                {episodes.slice(episodeStart, episodeEnd).map((episode) => (
                                    <div className={getCardClassName(episode.episode_no)} key={episode.episode_no}>
                                        <div className="episode-info">
                                            <h2>Episode {episode.episode_no}</h2>
                                            <h3>Title: <br />{episode.title}</h3>
                                            <p>Release Date: {formatReleaseDate(episode.release_date)}</p>
                                            <p>Score:  {episode.score * 2}/10</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className='flex justify-end'>
                                <button className='text-xl mr-5 relative text-gray-300' onClick={handlePreviousEpisodes}>
                                    Prev
                                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500"></span>
                                </button>
                                <button className='text-xl mr-3 relative text-gray-300' onClick={handleNextEpisodes}>
                                    Next
                                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500"></span>
                                </button>
                            </div>
                        </div>
                    </>) : (nav === 'Social' ? (<>
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
                                                <p className='ml-2 text-sm text-gray-400'> created this on {forum.created_at}</p>
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
                        <div id='Reviews' className='tabcontent'>
                            <div className='review-section'>
                                <h2 className='review-section-title'>Reviews</h2>
                                <div className='review-box'>
                                    {user && userReview.bool ? (<></>) : (<>
                                        {user && <><div className='User flex'>
                                            <img src={user.url || '../../../public/Gojo.jpeg'} alt='User Name' className='user-photo' />
                                            <Link to="/profile" className='comment-username translate-y-2 pl-2'>{user.display_name}</Link>
                                        </div></>}
                                        <textarea
                                            placeholder="Leave a review"
                                            className="review-input bg-gray-200"
                                            value={reviewText}
                                            onChange={handleReviewTextChange}
                                        ></textarea>
                                        <div className='flex justify-between'>
                                            <div className='flex'>
                                                <button className="post-review-btn" onClick={handleReviewPost}>Post Review</button>
                                                <div className='star-rating'>
                                                    <Rating
                                                        className='-translate-x-11 translate-y-0.5'
                                                        start={0}
                                                        stop={10}
                                                        step={2}
                                                        fractions={2}
                                                        initialRating={10}
                                                        onChange={handleSaveRatingReview}
                                                        emptySymbol={<EmptyStarReview />}
                                                        fullSymbol={<FullStarReview />}
                                                        placeholderRating={10}
                                                    />
                                                </div>
                                            </div>
                                            <button className='text-3xl mt-2' onClick={handleFetchingReviews}>🔃</button>
                                        </div>
                                    </>)}
                                </div>
                                <div className="user-review">
                                    {user && userReview.bool ? (<>
                                        <div className='bg-gray-800 mb-3 p-3 rounded-lg border border-cyan-600'>
                                            {editModeReview ? (<>
                                                <div className='flex justify-between'>
                                                    <div className='flex'>
                                                        <img src={userReview.review.url || '../../../public/Gojo.jpeg'} alt={userReview.review.display_name} className='user-photo' />
                                                        <Link to="/profile" className='comment-username translate-y-2'>{userReview.review.display_name}</Link>
                                                    </div>
                                                    <div className='star-rating'>
                                                        <Rating
                                                            className='-translate-x-11 translate-y-0.5'
                                                            start={0}
                                                            stop={10}
                                                            step={2}
                                                            fractions={2}
                                                            initialRating={userReview.review.rating}
                                                            onChange={handleEditRatingReview}
                                                            emptySymbol={<EmptyStarReview />}
                                                            fullSymbol={<FullStarReview />}
                                                            placeholderRating={0}
                                                        />
                                                    </div>
                                                </div>
                                                <textarea
                                                    placeholder='Give your updated review'
                                                    className='review-input w-full bg-gray-200'
                                                    value={updatedReviewText}
                                                    onChange={handleReviewText}
                                                ></textarea>
                                                <div className='flex justify-between'>
                                                    <button className='post-comment-btn' onClick={handleReviewUpdate}>Update</button>
                                                    <button className='post-comment-btn' onClick={handleReviewCancel}>Cancel</button>
                                                </div>
                                            </>) : (<>
                                                <div className='comment-menu-button text-gray-50'>
                                                    <div ref={reviewMenuRef}>
                                                        <button className='review-menu-trigger -translate-x-1' onClick={toggleReviewMenuContent}>&#8942;</button>
                                                        {reviewMenuContent && (
                                                            <>
                                                                <div className='comment-menu-content'>
                                                                    <ul>
                                                                        {user && (user.user_id === userReview.review.user_id && <>
                                                                            <li><button onClick={handleReviewEdit}>✍️ Edit</button></li>
                                                                            <li><button onClick={handleReviewDelete}>🚮 Delete</button></li>
                                                                        </>)}
                                                                    </ul>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className='comment-main'>
                                                    <div className='flex'>
                                                        <img src={userReview.review.url || '../../../public/Gojo.jpeg'} alt={userReview.review.display_name} className='user-photo' />
                                                        <div>
                                                            <div className='comment-header -translate-y-1'>
                                                                <Link to="/profile" className='comment-username'>{userReview.review.display_name}</Link>
                                                                <span className='comment-time -translate-y-2'>{formatTimeDifference(userReview.review.review_date)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='comment-body -translate-y-2 translate-x-4'>
                                                        <p>{userReview.review.review_text}</p>
                                                    </div>
                                                    <div className="comment-actions">
                                                        <div className='flex w-full justify-between'>
                                                            <div className="vote-section">
                                                                <button className='vote-disabled upvote-disabled bg-gray-400 text-gray-50' disabled>&#x25B2; {userReview.review.upvote_count}</button>
                                                                <button className='vote-disabled downvote-disabled  bg-gray-400 text-gray-50' disabled>&#x25BC; {userReview.review.downvote_count}</button>
                                                            </div>
                                                            <p className='text-3xl text-gray-400 font-semibold'>⭐ {tempRatingReview ? tempRatingReview : "0"}/10</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>)}
                                        </div>
                                    </>) : (<></>)}
                                    {reviews && reviews.slice(0, maxReviews).map((review, index) => (
                                        <Reviews review={review} />
                                    ))}
                                </div>
                                <div className="load-more-container">
                                    <button className="load-more-btn" onClick={handleLoadMoreReviews}>Load More Reviews</button>
                                </div>
                            </div>
                        </div>
                    </>) : <></>)))))}
                </div>
            </div>

        </main >
        <Footer />
    </>)
}

export default AnimePage;

