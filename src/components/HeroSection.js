import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Importing framer-motion
import '../styles/HeroSection.css';

function HeroSection() {
  const navigate = useNavigate(); // Initialize the navigate function

  const handleRegisterClick = () => {
    // Navigate to the Register page when the button is clicked
    navigate('/register');
  };

  return (
    <section className="hero-section">
      <motion.div 
        className="hero-content"
        initial={{ opacity: 0, y: -50 }} // Initial position (slightly off-screen)
        animate={{ opacity: 1, y: 0 }} // Animate to normal position
        transition={{ duration: 1.5 }} // Duration of the animation
      >
        <motion.h1 
          className="hero-title"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <span style={{ color: 'cyan' }}>Save Big</span> on Shipping with GLS Rates
        </motion.h1>
        <motion.p 
          className="hero-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          Parcel Pilot gives you access to discounted GLS shipping rates, 
          allowing you to save on your shipping costs while enjoying reliable and fast deliveries.
        </motion.p>
        <motion.button
          onClick={handleRegisterClick}
          className="cta-button"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          Start Shipping Now
        </motion.button>
      </motion.div>
    </section>
  );
}

export default HeroSection;


