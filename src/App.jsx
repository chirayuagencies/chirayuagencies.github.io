import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Brands from './components/Brands';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CartonVerifier from './components/CartonVerifier';
import CoverageMap from './components/CoverageMap';


function App() {
  return (
    <Router>
      <Routes>
        {/* Home route with only Hero section */}
        <Route
          path="/"
          element={
            <div className="text-gray-800">
              <Navbar />
              <Hero />
              <Footer />
            </div>
          }
        />

        {/* About page */}
        <Route
          path="/about"
          element={
            <div className="text-gray-800">
              <Navbar />
              <About />
              <Footer />
            </div>
          }
        />

        {/* Brands page */}
        <Route
          path="/brands"
          element={
            <div className="text-gray-800">
              <Navbar />
              <Brands />
              <Footer />
            </div>
          }
        />

        {/* Contact page */}
        <Route
          path="/contact"
          element={
            <div className="text-gray-800">
              <Navbar />
              <Contact />
              <Footer />
            </div>
          }
        />

        {/* Coverage Map page */}
        <Route
          path="/coverage"
          element={
            <div className="text-gray-800">
              <Navbar />
              <CoverageMap />
              <Footer />
            </div>
          }
        />

        {/* Verify page */}
        <Route path="/verify" element={<CartonVerifier />} />
        
      </Routes>
    </Router>
  );
}

export default App;
