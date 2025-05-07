import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Brands from './components/Brands';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <div className="text-gray-800">
      <Navbar />
      <Hero />
      <About />
      <Brands />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;
