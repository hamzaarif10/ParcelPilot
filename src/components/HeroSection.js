import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Importing framer-motion
import '../styles/HeroSection.css';

function HeroSection() {
  const navigate = useNavigate(); // Initialize the navigate function

  return (
   <div>
        {/* pp Hero Section Start */}
        <section class="pp-hero-section pp-hero-1 fix">
            <div class="top-shape">
                <img src="assets/img/home-1/hero/hero-bg.png" alt="img"/>
            </div>
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-xl-10">
                        <div class="pp-hero-content">
                            <h1
                                    className="wow img-custom-anim-left"
                                    data-wow-duration="1.3s"
                                    data-wow-delay="0.3s"
                                    style={{ fontSize: '4rem', lineHeight: '1.2' }}
                                    >
                                   <span style={{ color: '#ffffffff' }}>Ship Smarter.</span><span style={{ color: '#8cff09ff' }}> Save Bigger.</span><br />
                                    </h1>
                                    

                            <h1 class="wow fadeInUp" data-wow-delay=".5s" style={{ fontSize: '2rem', lineHeight: '1.2' }}>
                                <span style={{ color: '#ffffffff' }}>Stop overpaying for shipping. ParcelPilot helps Canadian sellers access deep discounts on every label — no contracts, no hidden fees, no minimums. Compare rates, buy labels, and fulfill orders faster and more efficiently than ever.
                            </span></h1>
                            <div class="pp-hero-button">
                                <a href="/register" class="pp-theme-btn wow fadeInUp" data-wow-delay=".3s">Get Started Now <i class="fa-solid fa-arrow-right-long"></i></a>
                               
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-12">
                        <div class="pp-hero-image wow img-custom-anim-bottom" data-wow-duration="1.3s" data-wow-delay="0.3s">
                            <img src="assets/img/home-1/hero/hero-1.jpg" alt="img"/>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Pp-Brand Section Start */}
        <div class="pp-brand-section section-padding pb-0 fix">
            <div class="container custom-container-3">
                <div class="brand-wrapper style-2">
                    <div class="brand-title wow fadeInUp" data-wow-delay=".3s">
                        <h3>Powered By Industry Leaders.</h3>
                    </div>
                    <div class="swiper pp-brand-slider">
                        <div class="swiper-wrapper">
                            <div class="swiper-slide">
                                <div class="brand-image text-center">
                                    <img src="assets/img/home-1/brand/01.png" alt="img"/>
                                </div>
                            </div>
                            <div class="swiper-slide">
                                <div class="brand-image text-center">
                                    <img src="assets/img/home-1/brand/02.png" alt="img"/>
                                </div>
                            </div>
                            <div class="swiper-slide">
                                <div class="brand-image text-center">
                                    <img src="assets/img/home-1/brand/03.png" alt="img"/>
                                </div>
                            </div>
                            <div class="swiper-slide">
                                <div class="brand-image text-center">
                                    <img src="assets/img/home-1/brand/04.png" alt="img"/>
                                </div>
                            </div>
                            <div class="swiper-slide">
                                <div class="brand-image text-center">
                                    <img src="assets/img/home-1/brand/05.png" alt="img"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      
        {/* Pp-About Section Start */}
        <section class="pp-about-section section-padding fix">
            <div class="container">
                <div class="pp-about-wrapper">
                    <div class="row g-4">
                        <div class="col-lg-6">
                            <div class="about-image">
                                <img src="assets/img/home-1/about/about-1.jpg" alt="img" class="wow img-custom-anim-left" data-wow-duration="1.3s" data-wow-delay="0.3s"/>
         
                                <div class="circle-shape">
                                    <img src="assets/img/home-1/about/shape-2.png" alt="img"/>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="about-content">
                                <div class="pp-section-title mb-0">
                                    <span class="pp-sub-title wow fadeInUp">Unbeatable Savings</span>
                                    <h1 class="wow fadeInUp" data-wow-delay=".3s">
                                        Join thousands of businesses revolutionizing their logistics with our cutting-edge platform. From unbeatable savings to global reach, we’ve got everything you need to ship smarter, faster, and better. Ready to dominate the shipping game? Let’s dive into the benefits that set us apart!
                                    </h1>
                                </div>
                                <div class="about-count-item wow fadeInUp" data-wow-delay=".3s">
                                    <div class="count-text">
                                        <h2><span class="pp-count">10</span>k+</h2>
                                        <p>
                                            Packages Shipped
                                        </p>
                                    </div>
                                    <div class="count-text">
                                        <h2><span class="pp-count">1000</span>+</h2>
                                        <p>
                                            Happy Clients
                                        </p>
                                    </div>
                                    <div class="count-text">
                                        <h2><span class="pp-count">50</span>k+</h2>
                                        <p>
                                           In Savings
                                        </p>
                                    </div>
                                </div>
    
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Pp-Offer Section Start */}
        <section class="pp-offer-section section-padding fix section-bg">
            <div class="container">
                <div class="pp-section-title text-center">
                    <span class="pp-sub-title wow fadeInUp">
                        WHAT WE OFFER
                        <span class="pp-style-2"></span>
                    </span>
                 </div>
                <div class="row">
                    <div class="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".3s">
                        <div class="pp-offer-box-item">
                            <div class="pp-offer-content">
                                <h1>
                                    <span style={{ color: '#393131' }}><b>Maximize Savings</b></span>
                                </h1>
                                <h2>
                                    <span style={{ color: '#393131' }}>Cut shipping costs up to 70% with exclusive carrier rates. Our platform optimizes every shipment through real-time comparisons and bulk discounts, keeping your profits soaring.</span>
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".5s">
                        <div class="pp-offer-box-item">
        
                            <div class="pp-offer-content">
                                <h1><span style={{ color: '#393131' }}><b>Seamless Simplicity</b></span></h1>
                                <h2>
                                    <span style={{ color: '#393131' }}>Say goodbye to shipping headaches. Our intuitive platform streamlines rate calculations, label generation, and pickups all in one place. Perfect for e-commerce pros and beginners alike.</span>
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".7s">
                        <div class="pp-offer-box-item">
                            <div class="pp-offer-content">
                                <h1>
                                   <span style={{ color: '#393131' }}><b>Seamless Integrations</b></span> 
                                </h1>
                                <h2>
                                   <span style={{ color: '#393131' }}>Connect your Shopify store in seconds. Automatically import orders and ship across Canada and beyond using our discounted carrier network. We handle label generation to pickup scheduling—you focus on growth.</span> 
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

       

        {/* Pp-key-feature Section Start */}
        <section class="pp-key-feature-section section-padding pb-0 fix">
            <div class="container">
                <div class="pp-key-feature-wrapper">
                    <div class="row g-4">
                        <div class="col-lg-6">
                            <div class="pp-key-feature-image">
                                <img src="assets/img/home-1/feature/02.jpg" alt="img"/>
         
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="pp-key-feature-content">
                                <div class="pp-section-title mb-0">
                                    <span class="pp-sub-title wow fadeInUp">Manage all your Shipments in one place</span>
                                    <h2 class="wow fadeInUp" data-wow-delay=".3s">
                                         All major carriers in one seamless platform.
                                    </h2>
                                </div>
                                <ul class="pp-feature-list wow fadeInUp" data-wow-delay=".3s">
                                    <li>
                                        Schedule Pickups
                                    </li>
                                    <li>
                                        Generate Shipping Labels
                                    </li>
                                    <li>
                                        Compare Rates
                                    </li>
                                </ul>
        
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

     


        {/* Pp-testimonial Section Start */}
        <section class="pp-testimonial-section section-padding fix">
            <div class="container">
                <div class="pp-section-title-area">
                    <div class="pp-section-title">
                        <span class="pp-sub-title wow fadeInUp">TESTIMONIALS</span>
                        <h2 class="wow fadeInUp" data-wow-delay=".3s">
                            Success Stories from Our Users
                        </h2>
                    </div>
                     <div class="pp-array-buttons wow fadeInUp" data-wow-delay=".5s">
                        <button class="array-prev"><i class="fa-solid fa-arrow-left-long"></i></button>
                        <button class="array-next"><i class="fa-solid fa-arrow-right-long"></i></button>
                  </div>
                </div>
                <div class="swiper pp-testimonial-slider">
                    <div class="swiper-wrapper">
                        <div class="swiper-slide">
                            <div class="pp-testimonial-card">
                                <p>
                                    "I ship hundreds of orders every month, and ParcelPilot makes fulfillment stress-free. The discounts are great, but what I love most is how fast and reliable it is. My customers get their packages quicker, and I save money too."
                                </p>
                                <div class="pp-client-info-item">
                                    <div class="pp-client-image">
                                        <img src="assets/img/home-1/testimonial/client-1.png" alt="img"/>
                                    </div>
                                    <div class="pp-content">
                                        <h5>Arif</h5>
                                        <span>Owner at Cheetah Automotive</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="swiper-slide">
                            <div class="pp-testimonial-card">
                                <p>
                                    "Most shipping platforms lock you into subscriptions or minimums. ParcelPilot gave me the freedom to start small with no commitments, and I still get the same discounts as high-volume sellers."
                                </p>
                                <div class="pp-client-info-item">
                                    <div class="pp-client-image">
                                        <img src="assets/img/home-1/testimonial/client-2.png" alt="img"/>
                                    </div>
                                    <div class="pp-testimonial-content">
                                        <h5>Mark</h5>
                                        <span>Marketing Manager at Tecman Automotive</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="swiper-slide">
                            <div class="pp-testimonial-card">
                                <p>
                                    "I was blown away by how easy it was to compare rates and print labels. What used to take me hours is now done in minutes. Plus, syncing with Shopify was seamless — my orders show up instantly."
                                </p>
                                <div class="pp-client-info-item">
                                    <div class="pp-client-image">
                                        <img src="assets/img/home-1/testimonial/client-2.png" alt="img"/>
                                    </div>
                                    <div class="pp-testimonial-content">
                                        <h5>Jeffrey</h5>
                                        <span>Marketing Manager at Strictly AutoParts.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <div style={{height: '300px', position: 'relative', zIndex: 999}}>
    {/* empty */}
</div>
        {/* Pp-cta Section Start */}
        <section>
            
            
        </section>
   </div>
  );
}

export default HeroSection;


