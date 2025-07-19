import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import HeroSection from './components/HeroSection';
import BenefitsSection from './components/BenefitsSection';
import HowItWorks from './components/HowItWorks.js';
import AboutUs from './components/AboutUs.js';
import RateEstimateForm from './components/RateEstimateForm';
import Footer from './components/Footer';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute.js';
import DashboardNav from './components/DashboardNav.js';
import './styles/App.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // If Bootstrap is installed via npm
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
import ShopifyRedirectHandler from './componentsShopifyRedirectHandler';

 // Load Stripe with your publishable key
 const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISH_KEY);
 
function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <ShopifyRedirectHandler />
      <Routes>
      <Route
          index
          element={
            <>
              <Navbar />
              <HeroSection />
              <RateEstimateForm />
              <BenefitsSection />
              <Footer />
            </>
          }
        />
        <Route path="/how-it-works" element={<div><Navbar/><HowItWorks/><Footer/></div>}/>
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


