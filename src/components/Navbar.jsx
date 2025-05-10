import React from 'react';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => (
  <nav className="navbar">
    <div className="navbar-container">
      <div className="navbar-left">
        <img src={logo} alt="Chirayu Agencies Logo" className="logo" />
        <div className="brand-name">Chirayu Agencies</div>
      </div>
      <div className="navbar-links">
        <a href="#about">About</a>
        <a href="#brands">Brands</a>
        <a href="#contact">Contact</a>
      </div>
    </div>
  </nav>
);

export default Navbar;
