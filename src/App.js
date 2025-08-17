import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import HeroSection from './components/HeroSection';
import BenefitsSection from './components/BenefitsSection';
import HowItWorks from './components/HowItWorks.js';
import AboutUs from './components/AboutUs.js';
import LandingPageRateEstimate from './components/LandingPageRateEstimate.js';
import RateEstimateForm from './components/RateEstimateForm';
import Footer from './components/Footer';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute.js';
import DashboardNav from './components/DashboardNav.js';
import './styles/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import CreateShipment from './pages/CreateShipment.js';
import ShipmentDetailsModal from './modals/ShipmentDetailsModal.js';
import ViewLabels from "./pages/ViewLabels.js"
import AccountDetails from './pages/AccountDetails.js';
import Integrations from './pages/Integrations.js';
import AddPaymentMethod from "./pages/AddPaymentMethod.js";
import SupportPage from './pages/SupportPage.js';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import ResetPasswordRequest from './pages/ResetPasswordRequest.js';
import ResetPassword from './pages/ResetPassword.js';
import ViewTransactions from './pages/ViewTransactions.js';
import RateEstimate from './components/RateEstimate.js';
import PrivacyPolicy from './pages/PrivacyPolicy.js';
import ShopifyVerification from "./components/ShopifyVerification.js";
import "./axiosConfig.js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISH_KEY);

// Component that handles immediate Shopify redirect BEFORE any UI renders
const HomePage = () => {
  useEffect(() => {
    // Check for Shopify parameters immediately
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const host = params.get('host');
    
    // If ANY Shopify parameters exist, redirect immediately to OAuth
    if (shop || host) {
      //console.log('Shopify parameters detected - redirecting to OAuth immediately');
      window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth?shop=${shop}&host=${host || ''}`;
      return;
    }
    
    // Check for regular user login redirect
    const isLoggedIn = localStorage.getItem('authToken');
    if (isLoggedIn) {
      window.location.href = '/create-shipment';
    }
  }, []);

  // Don't render anything if Shopify parameters exist - just redirect
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop');
  const host = params.get('host');
  
  if (shop || host) {
    // Show nothing while redirecting to OAuth
    return <div style={{backgroundColor: 'white', height: '100vh'}}></div>;
  }

  // Only render homepage for regular visitors (no Shopify params)
  return (
    <>
      <Navbar/>
      <HeroSection />
      <Footer/>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/shopify-verify" element={<ShopifyVerification />} />
          <Route path="/how-it-works" element={<div><Navbar/><HowItWorks/><Footer/></div>}/>
          <Route path="/rate-estimate" element={<div><Navbar/><LandingPageRateEstimate/><Footer/></div>}/>
          <Route path="/about-us" element={<div><Navbar/><AboutUs/><Footer/></div>}/>
          <Route path="/register" element={<div><Navbar/><Register/></div>}/>
          <Route path="/login" element={<div><Navbar/><Login/></div>}/>
          <Route path="/reset-password-request" element={<div><Navbar/><ResetPasswordRequest/></div>}/>
          <Route path="/reset-password" element={<div><Navbar/><ResetPassword/></div>}/>
          <Route path="/privacy-policy" element={<div><Navbar/><PrivacyPolicy/></div>}/>
          <Route path="/create-shipment" element={<ProtectedRoute><DashboardNav/><CreateShipment/><ShipmentDetailsModal/></ProtectedRoute>} />
          <Route path="/view-labels" element={<ProtectedRoute><DashboardNav/><ViewLabels /></ProtectedRoute>} />
          <Route path="/integration" element={<ProtectedRoute><DashboardNav/><Integrations /></ProtectedRoute>} />
          <Route path="/view-transactions" element={<ProtectedRoute><DashboardNav/><ViewTransactions /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><DashboardNav/><SupportPage /></ProtectedRoute>}/>
          <Route path="/account" element={<ProtectedRoute><DashboardNav/><AccountDetails /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><DashboardNav/><Elements stripe={stripePromise}><AddPaymentMethod /></Elements></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;


