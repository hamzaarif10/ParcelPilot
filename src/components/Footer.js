import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <div>
      {/* Pp Footer Section Start */}
        <footer class="pp-footer-section section-bg-2">
            <div class="top-shape">
                <img src="assets/img/home-1/bg-shape.png" alt="img"/>
            </div>
            <div class="container">
                <div class="pp-footer-widget-wrapper">
                    <div class="row justify-content-between">
                        <div class="col-xl-5 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay=".2s">
                            <div class="pp-footer-widget-items">
                                <div class="pp-widget-head">
                                    <a href="index.html" class="pp-footer-logo">
                                        <img src="assets/img/logo/white-logo.png" alt="img"/>
                                    </a>
                                </div>
     
                            </div>
                        </div>
                        <div class="col-xl-2 col-lg-4 col-md-6 col-sm-6 ps-lg-5 wow fadeInUp" data-wow-delay=".4s">
                            <div class="pp-footer-widget-items">
                                <div class="pp-widget-head">
                                    <h3>Quick Links</h3>
                                </div>
                                <ul class="pp-list-area">
                                    <li>
                                        <a href="/">
                                            Home
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/about-us">
                                            About Us
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/rate-estimate">
                                            Rate Estimate
                                        </a>
                                    </li>
                                   
                                </ul>
                            </div>
                        </div>
                        
                        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6 ps-lg-2 wow fadeInUp" data-wow-delay=".8s">
                            <div class="pp-footer-widget-items">
                                <div class="pp-contact-info">
                                    <div class="pp-icon">
                                        <i class="fa-regular fa-envelope"></i>
                                    </div>
                                    <div class="pp-content">
                                        <h6>
                                            <a href="mailto:support@parcelpilot.ca">
                                                support@parcelpilot.ca
                                            </a> <br/>
                                        </h6>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-bottom3">
                <div class="container">
                    <div class="pp-footer-bottom-wrapper">
                        <p class="wow fadeInUp" data-wow-delay=".3s">Copyright© <b>ParcelPilot</b></p>
                        <ul class="pp-footer-list wow fadeInUp" data-wow-delay=".5s">
                            <li>
                                <a href="/privacy-policy">Privacy Policy</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
        </div>
  );
}

export default Footer;
