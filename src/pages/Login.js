import React, { useState, useEffect } from 'react';
import '../styles/Login.css';
import axios from 'axios';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@chakra-ui/react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState('');
  const [loginDisabled, setLoginDisabled] = useState(false);

  axios.defaults.withCredentials = true;

  // Get the returnUrl from query parameters
  const getReturnUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('returnUrl') || null;
  };

  // On mount: check for pending Shopify installation
  useEffect(() => {
    // First check if we already have pending Shopify data in session
    const existingShop = sessionStorage.getItem('pendingShopifyShop');
    const existingHost = sessionStorage.getItem('pendingShopifyHost');
    
    if (existingShop) {
      console.log('[LOGIN] Found existing pending Shopify installation:', existingShop);
      return; // Don't override existing pending data
    }

    // If not, check the returnUrl for Shopify parameters
    const returnUrl = getReturnUrl();
    if (returnUrl && returnUrl.includes('shopify-verify')) {
      // Parse the shop and host from the returnUrl
      const returnUrlParams = new URLSearchParams(returnUrl.split('?')[1]);
      const shop = returnUrlParams.get('shop');
      const host = returnUrlParams.get('host');
      
      if (shop) {
        console.log('[LOGIN] Found Shopify params in returnUrl:', { shop, host });
        sessionStorage.setItem('pendingShopifyShop', shop);
        if (host) {
          sessionStorage.setItem('pendingShopifyHost', host);
        }
      }
    }
  }, [location.search]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, { email, password });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);

        // Check for pending Shopify installation
        const pendingShop = sessionStorage.getItem('pendingShopifyShop');
        const pendingHost = sessionStorage.getItem('pendingShopifyHost');
        
        if (pendingShop) {
          console.log('[LOGIN] Redirecting to complete Shopify installation for shop:', pendingShop);
          
          // Don't clear the session storage yet - let the verification page do it
          // This ensures the data is available if something goes wrong
          
          // Redirect to shopify-verify with the shop parameters
          const verifyUrl = `/shopify-verify?shop=${pendingShop}${pendingHost ? `&host=${pendingHost}` : ''}`;
          navigate(verifyUrl);
        } else {
          // Check if we have a returnUrl that's not Shopify-related
          const returnUrl = getReturnUrl();
          if (returnUrl && !returnUrl.includes('shopify-verify')) {
            navigate(returnUrl);
          } else {
            // Default redirect
            toast({
              title: "Login successful",
              description: "Redirecting to create shipment page...",
              status: "success",
              duration: 3000,
              isClosable: true,
              position: "top"
            });

            window.location.href = "/create-shipment";
          }
        }
      }
    } catch (error) {
      console.error('Error logging in:', error.response?.data || error.message);
      const err = error.response?.data || {};
      let message = "An unexpected error occurred. Please try again.";

      if (err.code === "USER_NOT_FOUND" || (err.message && err.message.toLowerCase().includes("user not found"))) {
        message = "User not found. Please check your email address.";
      } else if (err.code === "INVALID_PASSWORD" || (err.message && err.message.toLowerCase().includes("password"))) {
        message = "Wrong password. Please try again.";
      } else if (err.message) {
        message = err.message;
      }

      toast({
        title: "Login failed",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });

      setLoginDisabled(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email && !password) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    if (!email) {
      setErrorMsg("Please enter an email.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter a password");
      return;
    }

    setErrorMsg("");
    setLoginDisabled(true);
    await login(email, password);
  };

  // Show a message if coming from Shopify
  const showShopifyMessage = sessionStorage.getItem('pendingShopifyShop') !== null;

  return (
    <section className="h-100 gradient-form" style={{ backgroundColor: '#eee' }}>
      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-xl-10">
            <div className="card rounded-3 text-black">
              <div className="row g-0">
                <div className="col-lg-6">
                  <div className="card-body p-md-5 mx-md-4">
                    <div className="text-center">
                      <h3 className="mt-1 mb-5 pb-1">Welcome to Parcel Pilot</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <p>Please login to your account</p>
                      
                      {showShopifyMessage && (
                        <div className="alert alert-info mb-3">
                          Please log in to complete your Shopify store installation.
                        </div>
                      )}

                      <div className="form-outline mb-4">
                        <input
                          onChange={e => setEmail(e.target.value)}
                          type="text"
                          id="form2Example11"
                          className="form-control"
                          placeholder="Email Address"
                        />
                        <label className="form-label" htmlFor="form2Example11">Email</label>
                      </div>

                      <div className="form-outline mb-4">
                        <input
                          onChange={e => setPassword(e.target.value)}
                          type="password"
                          id="form2Example22"
                          className="form-control"
                          placeholder="Password"
                        />
                        <label className="form-label" htmlFor="form2Example22">Password</label>
                      </div>

                      {errorMsg && <div className="text-danger mt-1">{errorMsg}</div>}

                      <div className="text-center pt-1 mb-5 pb-1">
                        <button
                          className="btn btn-primary btn-block fa-lg gradient-custom-2 mb-3"
                          type="submit"
                          disabled={loginDisabled}
                        >
                          {loginDisabled ? "Logging in..." : "Log in"}
                        </button>
                        <Link className="text-muted" to="/reset-password-request">
                          Forgot password?
                        </Link>
                      </div>

                      <div className="d-flex align-items-center justify-content-center pb-4">
                        <p className="mb-0 me-2">Don't have an account?</p>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => navigate("/register")}
                        >
                          Create new
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="col-lg-6 d-flex align-items-center gradient-custom-2">
                  <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                    <h4 className="mb-4">Canada Wide Shipping</h4>
                    <p className="small mb-0">
                      ParcelPilot makes it easy to ship anywhere across Canada. From major urban centres to small towns coast-to-coast, you'll always get a great rate on your domestic shipping.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;