// const Hero = () => (
//   <section className="bg-blue-100 p-12 text-center">
//     <h1 className="text-4xl font-bold mb-4">Welcome to Chirayu Agencies</h1>
//     <p className="text-lg">Your Trusted Distribution Partner</p>
//   </section>
// );
// export default Hero;

import React from 'react';
import banner from '../assets/banner.png'; // Adjust the path if needed
import './Hero.css'; // We'll define styles here

const Hero = () => {
  return (
    <section className="hero-section">
      {/* <div className="hero-overlay">
        <h1 className="text-4xl font-bold mb-4">Welcome to Chirayu Agencies</h1>
        <p className="text-lg">Delivering Excellence in Distribution & Logistics</p>
      </div> */}
      <div className="hero-overlay flex flex-col justify-center items-center text-center px-4 sm:px-8 md:px-16 py-12">
        <h1 className="text-white text-3xl sm:text-5xl font-bold mb-4">Welcome to Chirayu Agencies</h1>
        <p className="text-white text-base sm:text-lg max-w-xl mb-6">Delivering trusted brands with efficiency and care.</p>
        <a
          href="https://chirayumeds.com"
          target="_blank"
          rel="noopener noreferrer"
          className="buy-button-hero bg-yellow-400 text-blue-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-colors shadow-lg"
        >
          Buy Now
        </a>
      </div>

    </section>
  );
};

export default Hero;
