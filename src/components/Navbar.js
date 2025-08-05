import React, { useState, useEffect } from "react";
import "../styles/Navbar.css";
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
 
  const handleSignUpClick = () => {
    navigate('/register');
    setIsOpen(false);
  };
 
  const handleLoginClick = () => {
    navigate("/login");
    setIsOpen(false);
  };
 
  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => handleNavigation('/')}>
        <img src="/logo.png" alt="Logo" className="logo" />
      </div>
      
      {/* Hamburger menu icon for mobile */}
      <div className="hamburger-menu" onClick={toggleMenu}>
        <div className={`hamburger-line ${isOpen ? 'open' : ''}`}></div>
        <div className={`hamburger-line ${isOpen ? 'open' : ''}`}></div>
        <div className={`hamburger-line ${isOpen ? 'open' : ''}`}></div>
      </div>
      
      {/* Mobile menu - shows when hamburger is clicked */}
      <div className={`mobile-menu ${isOpen ? 'show' : ''}`}>
        <ul className="mobile-links">
          <li onClick={() => handleNavigation('/how-it-works')}>How It Works</li>
          <li onClick={() => handleNavigation('/about-us')}>About Us</li>
        </ul>
        <div className="mobile-buttons">
          <button onClick={handleSignUpClick} className="sign-up">Sign Up</button>
          <button onClick={handleLoginClick} className="login">Login</button>
        </div>
      </div>
      
      {/* Desktop menu */}
      <div className="desktop-menu">
        <ul className="navbar-links">
          <li onClick={() => handleNavigation('/how-it-works')}>How It Works</li>
          <li onClick={() => handleNavigation('/about-us')}>About Us</li>
          <li onClick={() => handleNavigation('/billing-info')}>See Pricing</li>
        </ul>
        <div className="navbar-buttons">
          <button onClick={handleSignUpClick} className="sign-up">Sign Up</button>
          <button onClick={handleLoginClick} className="login">Login</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
