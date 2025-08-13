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
            <div className="card rounded-3 text-black" style={{ border: "2px solid #dee2e6" }}>
              <div className="row g-0">
                <div className="col-lg-6">
                  <div className="card-body p-md-5 mx-md-4">
                    <div className="text-center">
                      <h3 className="mt-1 mb-5 pb-1">Welcome to Parcel Pilot</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <p>Please login to your account</p>
                      
                      {showShopifyMessage && (
                        <div className="alert alert-info mb-3" style={{ 
                          border: "2px solid #b3d7ff",
                          borderRadius: "8px"
                        }}>
                          Please log in to complete your Shopify store installation.
                        </div>
                      )}

                      <div className="mb-4">
                        <label htmlFor="form2Example11" style={{ 
                          fontWeight: "500", 
                          display: "block", 
                          marginBottom: "8px",
                          color: "#333"
                        }}>
                          Email
                        </label>
                        <input
                          onChange={e => setEmail(e.target.value)}
                          type="text"
                          id="form2Example11"
                          placeholder="Enter your email address"
                          style={{ 
                            width: "100%",
                            padding: "12px 16px",
                            border: "2px solid #ced4da",
                            borderRadius: "8px",
                            transition: "border-color 0.2s",
                            fontSize: "16px",
                            outline: "none",
                            backgroundColor: "#fff"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#0d6efd"}
                          onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="form2Example22" style={{ 
                          fontWeight: "500", 
                          display: "block", 
                          marginBottom: "8px",
                          color: "#333"
                        }}>
                          Password
                        </label>
                        <input
                          onChange={e => setPassword(e.target.value)}
                          type="password"
                          id="form2Example22"
                          placeholder="Enter your password"
                          style={{ 
                            width: "100%",
                            padding: "12px 16px",
                            border: "2px solid #ced4da",
                            borderRadius: "8px",
                            transition: "border-color 0.2s",
                            fontSize: "16px",
                            outline: "none",
                            backgroundColor: "#fff"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#0d6efd"}
                          onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                        />
                      </div>

                      {errorMsg && <div className="text-danger mt-1">{errorMsg}</div>}

                      <div className="text-center pt-1 mb-5 pb-1">
                        <button
                          className="btn btn-primary btn-block fa-lg gradient-custom-2 mb-3"
                          type="submit"
                          disabled={loginDisabled}
                          style={{
                            border: "2px solid #0d6efd",
                            borderRadius: "8px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#0b5ed7";
                            e.target.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#0d6efd";
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          {loginDisabled ? "Logging in..." : "Log in"}
                        </button>
                        <Link 
                          className="text-muted" 
                          to="/reset-password-request"
                          style={{ 
                            border: "1px solid transparent",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            display: "inline-block",
                            transition: "border-color 0.2s",
                            textDecoration: "underline"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#6c757d";
                            e.target.style.backgroundColor = "#f8f9fa";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "transparent";
                            e.target.style.backgroundColor = "transparent";
                          }}
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <div className="d-flex align-items-center justify-content-center pb-4">
                        <p className="mb-0 me-2">Don't have an account?</p>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => navigate("/register")}
                          style={{
                            border: "2px solid #dc3545",
                            borderRadius: "8px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#bb2d3b";
                            e.target.style.backgroundColor = "#dc3545";
                            e.target.style.color = "white";
                            e.target.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#dc3545";
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#dc3545";
                            e.target.style.transform = "translateY(0)";
                          }}
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