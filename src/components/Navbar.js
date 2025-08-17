import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./assets/css/bootstrap.min.css";
import "./assets/css/all.min.css";
import "./assets/css/animate.css";
import "./assets/css/magnific-popup.css";
import "./assets/css/meanmenu.css";
import "./assets/css/swiper-bundle.min.css";
import "./assets/css/nice-select.css";
import "./assets/css/main.css";
function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

   useEffect(() => {
    const scripts = [
      "./assets/js/jquery-3.7.1.min.js",
      "./assets/js/bootstrap.bundle.min.js",
      "./assets/js/jquery.nice-select.min.js",
      "./assets/js/jquery.waypoints.js",
      "./assets/js/jquery.counterup.min.js",
      "./assets/js/swiper-bundle.min.js",
      "./assets/js/jquery.meanmenu.min.js",
      "./assets/js/jquery.magnific-popup.min.js",
      "./assets/js/wow.min.js",
      "./assets/js/main.js",
    ];

    const addedScripts = [];

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
        addedScripts.push(script);
      });

    (async () => {
      for (const src of scripts) await loadScript(src);
    })();

    return () => {
      // Cleanup: remove scripts when leaving landing page
      addedScripts.forEach((s) => s.remove());
    };
  }, []);



  return (
   <div>
    
        {/* pp Back To Top Start */}
        <button id="pp-back-top" class="pp-back-to-top show">
           <i class="fa-solid fa-arrow-up"></i>
        </button>

        {/* pp MouseCursor Start */}
        <div class="mouseCursor cursor-outer"></div>
        <div class="mouseCursor cursor-inner"></div>

        {/* Offcanvas Area Start */}
         <div class="fix-area">
            <div class="offcanvas__info">
                <div class="offcanvas__wrapper">
                    <div class="offcanvas__content">
                        <div class="offcanvas__top mb-5 d-flex justify-content-between align-items-center">
                            <div class="offcanvas__logo">
                                <a href="/">
                                    <img src="assets/img/logo/black-logo.png" alt="logo-img" />

                                </a>
                            </div>
                            <div class="offcanvas__close">
                                <button>
                                <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text d-none d-xl-block">
                            Nullam dignissim, ante scelerisque the  is euismod fermentum odio sem semper the is erat, a feugiat leo urna eget eros. Duis Aenean a imperdiet risus.
                        </p>
                        <div class="mobile-menu fix mb-3"></div>
                         <a href="/register" class="pp-theme-btn">
                                <span class="pp-icon-btn"><i class="icon-icon-1"></i></span>
                                <span class="pp-text-btn">
                                    <span class="pp-text-2">Get Started</span>
                                </span>
                            </a>
                            <a href="/login" class="pp-theme-btn">
                                <span class="pp-icon-btn"><i class="icon-icon-1"></i></span>
                                <span class="pp-text-btn">
                                    <span class="pp-text-2">Login</span>
                                </span>
                            </a>
                        <div class="offcanvas__contact">
                            <h4>Contact Info</h4>
                            <ul>
                                
                                <li class="d-flex align-items-center">
                                    <div class="offcanvas__contact-icon mr-15">
                                        <i class="fal fa-envelope"></i>
                                    </div>
                                    <div class="offcanvas__contact-text">
                                        <a href="mailto:info@example.com"><span class="mailto:info@example.com">support@parcelpilot.ca</span></a>
                                    </div>
                                </li>
                                <li class="d-flex align-items-center">
                                    <div class="offcanvas__contact-icon mr-15">
                                        <i class="fal fa-clock"></i>
                                    </div>
                                    <div class="offcanvas__contact-text">
                                        <a target="_blank" href="#">Monday-friday, 09am - 05pm</a>
                                    </div>
                                </li>
                            </ul>
                            <div class="header-button mt-4">
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="offcanvas__overlay"></div>

        {/* Header Section Start */}
         <header id="header-sticky" class="header-1">
            <div class="container-fluid">
                <div class="mega-menu-wrapper">
                    <div class="header-main style-1">
                        <div class="logo">
                            <a href="/" class="header-logo">
                                <img src="assets/img/logo/black-logo.png" alt="logo-img" />

                            </a>
                            <a href="/" class="header-logo-2">
                                <img src="assets/img/logo/black-logo.png" alt="logo-img" />

                            </a>
                        </div>
                        <div class="mean__menu-wrapper">
                            <div class="main-menu">
                                <nav id="mobile-menu">
                                    <ul>
                                        <li class="has-dropdown active menu-thumb">
                                            <a href="/">
                                                Home 
                                            </a>
                                            
                                        </li>
                                        <li class="has-dropdown active d-xl-none">
                                            <a href="/" class="border-none">
                                            Home
                                            </a>
                                        </li>
                                        
                                       <li>
                                            <a href="/about-us">
                                                About Us
                                            </a>
                                           
                                        </li>
                                        <li>
                                            <a href="/rate-estimate">Quick Quote</a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                        <div class="header-right d-flex justify-content-end align-items-center">
                          <a href="/register" class="pp-theme-btn">
                                Get Started <i class="fa-solid fa-arrow-right-long"></i>
                            </a>
                            <a href="/login" class="pp-theme-btn">
                                Login <i class="fa-solid fa-arrow-right-long"></i>
                            </a>
                            <div class="header__hamburger d-xl-none my-auto">
                                <div class="sidebar__toggle">
                                    <div class="header-bar style-1">
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
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
