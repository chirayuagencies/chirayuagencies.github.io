import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-left">
          <img src={logo} alt="Chirayu Agencies Logo" className="logo" />
          <div className="brand-name">Chirayu Agencies</div>
        </Link>
        <div className="navbar-right">
          <div className={`navbar-links ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link to="/brands" onClick={() => setIsMenuOpen(false)}>Brands</Link>
            <Link to="/coverage" onClick={() => setIsMenuOpen(false)}>Coverage</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            <Link to="/verify" onClick={() => setIsMenuOpen(false)}>Verify</Link>
            <a 
              href="https://chirayumeds.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="buy-button"
              onClick={() => setIsMenuOpen(false)}
            >
              Buy
            </a>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
