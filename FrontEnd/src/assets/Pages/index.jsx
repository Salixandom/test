import React from 'react';
import { Link } from 'react-router-dom';
import './../CSS/style2.css';

const index = () => {
    const handleToggle = () => {
        const dropdownMenu = document.querySelector('.dropdown');
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        const menuToggle = document.querySelector('.toggle');
        menuToggle.classList.toggle('active');
    };

    return (
        <section className="showcase">
            <header>
                <img src='./../../../public/logo.png' className='w-28' />
                <div className="navbar">
                    <div className="toggle" onClick={handleToggle}></div>
                    <div className="dropdown">
                        <ul>
                            <li><Link to="/home">Home</Link></li>
                            <li><Link to="/browse">Browse</Link></li>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/register">Signup</Link></li>
                            <li><Link to="#">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </header>
            <video src="./amv1.mkv" loop autoPlay></video>
            <div className="overlay"></div>
            <div className="text">
                <h3>Welcome To</h3>
                <h2>AniHub!</h2>
                <p>Your go-to place for Anime knowledge</p>
                <Link to="/home">Explore</Link>
            </div>
            <ul className="social">
                <li><Link to="#"><img src="https://i.ibb.co/x7P24fL/facebook.png" alt="Facebook" /></Link></li>
                <li><Link to="#"><img src="https://i.ibb.co/Wnxq2Nq/twitter.png" alt="Twitter" /></Link></li>
                <li><Link to="#"><img src="https://i.ibb.co/ySwtH4B/instagram.png" alt="Instagram" /></Link></li>
            </ul>
        </section>
    );
};

export default index;
