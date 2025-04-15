import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaRocket, FaShieldAlt, FaLightbulb, FaGlobe } from 'react-icons/fa';
import '../styles/BenefitsSection.css';
import { useNavigate } from 'react-router-dom';

// Import courier logos (replace with your actual logo assets)
import canadaPostLogo from './assets/couriers/canadapost.png';
import upsLogo from './assets/couriers/ups.png';
import fedexLogo from './assets/couriers/fedex.png';
import purolatorLogo from './assets/couriers/purolator.png';
import glsLogo from './assets/couriers/gls.png';
import canparLogo from './assets/couriers/canpar.webp';

function BenefitsSection() {
  const navigate = useNavigate();
  // Animation controls
  const controlsTitle = useAnimation();
  const controlsIntro = useAnimation();
  const controlsCards = useAnimation();
  const controlsLogos = useAnimation();
  const controlsFeatures = useAnimation();
  const controlsCta = useAnimation();

  // InView hooks
  const [refTitle, inViewTitle] = useInView({ threshold: 0.2 });
  const [refIntro, inViewIntro] = useInView({ threshold: 0.2 });
  const [refCards, inViewCards] = useInView({ threshold: 0.2 });
  const [refLogos, inViewLogos] = useInView({ threshold: 0.2 });
  const [refFeatures, inViewFeatures] = useInView({ threshold: 0.2 });
  const [refCta, inViewCta] = useInView({ threshold: 0.2 });

  // Trigger animations
  useEffect(() => {
    if (inViewTitle) controlsTitle.start('visible');
    if (inViewIntro) controlsIntro.start('visible');
    if (inViewCards) controlsCards.start('visible');
    if (inViewLogos) controlsLogos.start('visible');
    if (inViewFeatures) controlsFeatures.start('visible');
    if (inViewCta) controlsCta.start('visible');
  }, [
    inViewTitle,
    inViewIntro,
    inViewCards,
    inViewLogos,
    inViewFeatures,
    inViewCta,
    controlsTitle,
    controlsIntro,
    controlsCards,
    controlsLogos,
    controlsFeatures,
    controlsCta,
  ]);

  // Animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const introVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: (i) => ({
      opacity: 0,
      x: i % 2 === 0 ? -100 : 100,
    }),
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        delay: i * 0.3,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 80,
      },
    }),
  };

  const logoVariants = {
    hidden: (i) => ({
      opacity: 0,
      x: i % 2 === 0 ? -50 : 50,
    }),
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: i * 0.2,
        ease: 'easeOut',
      },
    }),
  };

  const featureVariants = {
    hidden: (i) => ({
      opacity: 0,
      y: 30,
    }),
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: i * 0.1,
        ease: 'easeOut',
      },
    }),
  };

  const ctaVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  // Courier logos
  const couriers = [
    { name: 'Canada Post', logo: canadaPostLogo },
    { name: 'UPS', logo: upsLogo },
    { name: 'FedEx', logo: fedexLogo },
    { name: 'Purolator', logo: purolatorLogo },
    { name: 'GLS', logo: glsLogo },
    { name: 'Canpar', logo: canparLogo },
  ];

  // Calculate number of repeats to fill screen
  const [repeatCount, setRepeatCount] = useState(2); // Default to 2x
  const marqueeRef = useRef(null);

  useEffect(() => {
    const updateRepeatCount = () => {
      if (marqueeRef.current) {
        const viewportWidth = window.innerWidth;
        const logoWidth = 160; // 130px width + 30px margin-right
        const singleSetWidth = couriers.length * logoWidth; // 6 * 160 = 960px
        const minRepeats = Math.ceil(viewportWidth / singleSetWidth) + 1; // Ensure at least 1 extra set
        setRepeatCount(Math.max(minRepeats, 2)); // Minimum 2x for seamless loop
      }
    };

    updateRepeatCount();
    window.addEventListener('resize', updateRepeatCount);
    return () => window.removeEventListener('resize', updateRepeatCount);
  }, []);

  // Generate repeated logos
  const repeatedCouriers = Array(repeatCount)
    .fill(couriers)
    .flat()
    .map((courier, index) => ({ ...courier, key: `${courier.name}-${index}` }));

  return (
    <section className="benefits-section">
      <div className="benefits-container">
        {/* Section Header */}
        <motion.div
          className="section-header"
          ref={refTitle}
          initial="hidden"
          animate={controlsTitle}
          variants={titleVariants}
        >
          <h2 className="section-title">Unleash Your Shipping Potential</h2>
          <div className="title-underline"></div>
        </motion.div>

        {/* Intro Paragraph */}
        <motion.div
          className="section-intro"
          ref={refIntro}
          initial="hidden"
          animate={controlsIntro}
          variants={introVariants}
        >
          <p className="intro-text">
            Join thousands of businesses revolutionizing their logistics with our cutting-edge platform. From unbeatable savings to global reach, we’ve got everything you need to ship smarter, faster, and better. Ready to dominate the shipping game? Let’s dive into the benefits that set us apart!
          </p>
        </motion.div>

        {/* Benefits Cards */}
        <motion.div
          className="benefits-showcase"
          ref={refCards}
          initial="hidden"
          animate={controlsCards}
        >
          {[
  {
    icon: <FaRocket />,
    title: 'Maximize Savings',
    text: 'Cut shipping costs by up to <span className="highlight">70%</span> with our exclusive carrier rates. Whether you’re a small startup or a large enterprise, our platform optimizes every shipment to save you money. Leverage real-time rate comparisons and bulk discounts to keep your profits soaring.',
  },
  {
    icon: <FaShieldAlt />,
    title: 'Rock-Solid Reliability',
    text: 'Never worry about late deliveries again. Our trusted network of carriers ensures <span className="highlight">99.9% on-time delivery</span>. With advanced tracking, proactive alerts, and dedicated support, your packages arrive exactly when and where they’re needed.',
  },
  {
    icon: <FaLightbulb />,
    title: 'Seamless Simplicity',
    text: 'Say goodbye to shipping headaches. Our intuitive platform streamlines everything—rate calculations, label generation, and schedule pickups all in one place. Perfect for e-commerce pros and beginners alike, it’s designed to save you time and effort every step of the way.',
  },
  {
    icon: <FaGlobe />,
    title: 'Seamless Integrations',
    text: 'Connect your <span className="highlight">Shopify store</span> in seconds. Automatically import your orders and start shipping <span className="highlight">all over Canada and beyond</span> using our discounted carrier network. From label generation to pickup scheduling, we handle the heavy lifting so you can focus on growth.',
  },
].map((benefit, index) => (
  <motion.div
    key={index}
    className={`benefit-card ${index % 2 === 0 ? 'align-left' : 'align-right'}`}
    custom={index}
    variants={cardVariants}
    whileHover={{ scale: 1.03, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
    style={{ marginTop: index > 0 ? '-150px' : '0' }}
  >
    <div className="benefit-icon">{benefit.icon}</div>
    <h3>{benefit.title}</h3>
    <p dangerouslySetInnerHTML={{ __html: benefit.text }} />
  </motion.div>
))}

        </motion.div>

        {/* Courier Logos Marquee */}
        <motion.div
          className="courier-logos"
          ref={refLogos}
          initial="hidden"
          animate={controlsLogos}
        >
          <h3 className="courier-title">Powered by Industry Leaders</h3>
          <div className="logo-marquee-wrapper" ref={marqueeRef}>
            <div className="logo-marquee">
              {repeatedCouriers.map((courier, index) => (
                <motion.div
                  key={courier.key}
                  className="courier-logo"
                  custom={index % couriers.length} // Use modulo for animation staggering
                  variants={logoVariants}
                  whileHover={{ scale: 1.1, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
                >
                  <img src={courier.logo} alt={`${courier.name} logo`} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="features-grid"
          ref={refFeatures}
          initial="hidden"
          animate={controlsFeatures}
        >
          {[
            { stat: '24/7', label: 'Live Support' },
            { stat: '1000+', label: 'Happy Clients' },
            { stat: '50K+', label: 'Packages Shipped' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="feature-item"
              custom={index}
              variants={featureVariants}
              whileHover={{ scale: 1.05 }}
            >
              <div className="feature-stat">{feature.stat}</div>
              <div className="feature-label">{feature.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          className="cta-banner"
          ref={refCta}
          initial="hidden"
          animate={controlsCta}
          variants={ctaVariants}
        >
          <h3>Ready to Transform Your Shipping?</h3>
          <p>Join today and unlock powerful shipping tools with no hidden fees and no long-term contracts. Import orders, compare rates, and ship with ease—whether you're sending across Canada or around the world</p>
          <a href="/register" className="cta-button">
            Get Started Now
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default BenefitsSection;