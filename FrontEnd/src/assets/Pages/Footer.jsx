import React from "react";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './../CSS/style.css'

const Footer = () => {
    return (<>
        <footer className="site-footer bottom-full">
            <div className="background-image" ></div>
            <div className="footer-container">
                <div className="footer-heading">
                    <h2 className="az-title">A-Z List</h2>
                    <p className="az-subtitle">Searching anime order by alphabet name A to Z.</p>
                </div>

                <nav className="alphabet-list">
                    <Link to={{ pathname: "/search", search: 'Any' }}>All</Link>
                    <Link to={{ pathname: "/search", search: '1' }}>0-9</Link>
                    <Link to={{ pathname: "/search", search: 'A' }}>A</Link>
                    <Link to={{ pathname: "/search", search: 'B' }}>B</Link>
                    <Link to={{ pathname: "/search", search: 'C' }}>C</Link>
                    <Link to={{ pathname: "/search", search: 'D' }}>D</Link>
                    <Link to={{ pathname: "/search", search: 'E' }}>E</Link>
                    <Link to={{ pathname: "/search", search: 'F' }}>F</Link>
                    <Link to={{ pathname: "/search", search: 'G' }}>G</Link>
                    <Link to={{ pathname: "/search", search: 'H' }}>H</Link>
                    <Link to={{ pathname: "/search", search: 'I' }}>I</Link>
                    <Link to={{ pathname: "/search", search: 'J' }}>J</Link>
                    <Link to={{ pathname: "/search", search: 'K' }}>K</Link>
                    <Link to={{ pathname: "/search", search: 'L' }}>L</Link>
                    <Link to={{ pathname: "/search", search: 'M' }}>M</Link>
                    <Link to={{ pathname: "/search", search: 'N' }}>N</Link>
                    <Link to={{ pathname: "/search", search: 'O' }}>O</Link>
                    <Link to={{ pathname: "/search", search: 'P' }}>P</Link>
                    <Link to={{ pathname: "/search", search: 'Q' }}>Q</Link>
                    <Link to={{ pathname: "/search", search: 'R' }}>R</Link>
                    <Link to={{ pathname: "/search", search: 'S' }}>S</Link>
                    <Link to={{ pathname: "/search", search: 'T' }}>T</Link>
                    <Link to={{ pathname: "/search", search: 'U' }}>U</Link>
                    <Link to={{ pathname: "/search", search: 'V' }}>V</Link>
                    <Link to={{ pathname: "/search", search: 'W' }}>W</Link>
                    <Link to={{ pathname: "/search", search: 'X' }}>X</Link>
                    <Link to={{ pathname: "/search", search: 'Y' }}>Y</Link>
                    <Link to={{ pathname: "/search", search: 'Z' }}>Z</Link>
                </nav>
                <div className="footer-branding">
                    <Link to="/" class="footer-logo hover:text-purple-500">AniHub</Link>
                </div>
                <div className="footer-links">
                    <p className="mr-3 text-gray-400">Help</p>
                    <Link to="/faq">FAQ</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/request">Request</Link>
                </div>

                <div className="footer-links mb-6">
                    <p className="mr-3 text-gray-400">Inspired By</p>
                    <Link to="https://myanimelist.net/" target="_blank">MAL</Link>
                    <Link to="https://aniwave.to/" target="_blank">AniWave</Link>
                    <Link to="https://anilist.co/" target="_blank">AniList</Link>
                </div>

                <div className="copyright-section">
                    <p className="copyright-text">Copyright © AniHub.co All Rights Reserved</p>
                    <p className="filecopy-text">This site does not store any files on its server. All contents are provided by non-affiliated third parties.</p>
                </div>

            </div>
        </footer>
    </>)
}

export default Footer;