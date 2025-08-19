import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Inline styles for mobile menu
  const offcanvasStyle = {
    position: "fixed",
    top: 0,
    right: menuOpen ? 0 : "-300px", // slide in/out
    width: "280px",
    height: "100%",
    background: "#fff",
    boxShadow: "-3px 0 10px rgba(0,0,0,0.2)",
    transition: "right 0.3s ease",
    zIndex: 1000,
    overflowY: "auto",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
  };

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    opacity: menuOpen ? 1 : 0,
    visibility: menuOpen ? "visible" : "hidden",
    transition: "opacity 0.3s ease",
    zIndex: 900,
  };

  const hamburgerStyle = {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    zIndex: 1100,
  };

  const barStyle = {
    width: "25px",
    height: "3px",
    backgroundColor: "#000",
    margin: "4px 0",
    borderRadius: "2px",
  };

  const mobileLinkStyle = {
    marginBottom: "20px",
    fontSize: "16px",
    fontWeight: 500,
    color: "#000",
    textDecoration: "none",
  };

  const mobileButtonStyle = {
    display: "block",
    padding: "10px 20px",
    marginBottom: "15px",
    background: "#007bff",
    color: "#fff",
    borderRadius: "6px",
    textAlign: "center",
    textDecoration: "none",
    fontWeight: 600,
  };

  return (
    <div>
      {/* Offcanvas Mobile Menu */}
      <div style={offcanvasStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/">
            <img src="assets/img/logo/black-logo.png" alt="logo-img" style={{ maxWidth: "120px" }} />
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}
          >
            &times;
          </button>
        </div>

        <nav style={{ marginTop: "40px", display: "flex", flexDirection: "column" }}>
          <Link to="/" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/about-us" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>About Us</Link>
          <Link to="/rate-estimate" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>Quick Quote</Link>
        </nav>

        <Link to="/register" style={mobileButtonStyle} onClick={() => setMenuOpen(false)}>Get Started</Link>
        <Link to="/login" style={mobileButtonStyle} onClick={() => setMenuOpen(false)}>Login</Link>
      </div>

      {/* Overlay */}
      <div style={overlayStyle} onClick={() => setMenuOpen(false)}></div>

      {/* Header - DESKTOP VERSION UNCHANGED */}
      <header id="header-sticky" className="header-1">
        <div className="container-fluid">
          <div className="mega-menu-wrapper">
            <div className="header-main style-1 d-flex justify-content-between align-items-center">
              <div className="logo">
                <Link to="/" className="header-logo">
                  <img src="assets/img/logo/black-logo.png" alt="logo-img" />
                </Link>
              </div>

              <div className="mean__menu-wrapper d-none d-xl-block">
                <div className="main-menu">
                  <nav>
                    <ul>
                      <li className="has-dropdown active menu-thumb">
                        <Link to="/">Home</Link>
                      </li>
                      <li>
                        <Link to="/about-us">About Us</Link>
                      </li>
                      <li>
                        <Link to="/rate-estimate">Quick Quote</Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>

              <div className="header-right d-flex align-items-center">
                <Link to="/register" className="pp-theme-btn d-none d-xl-inline-block mr-2">
                  Get Started <i className="fa-solid fa-arrow-right-long"></i>
                </Link>
                <Link to="/login" className="pp-theme-btn d-none d-xl-inline-block">
                  Login <i className="fa-solid fa-arrow-right-long"></i>
                </Link>

                {/* Mobile Hamburger */}
                <div
                  className="header__hamburger d-xl-none ml-3"
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={hamburgerStyle}
                >
                  <span style={barStyle}></span>
                  <span style={barStyle}></span>
                  <span style={barStyle}></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default Navbar;
