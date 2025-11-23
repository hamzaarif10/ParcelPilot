import React, { useState } from "react";
import "../styles/Register.css";
import validator from 'validator';
import axios from 'axios';
import { useNavigate } from "react-router";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  //verification 
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  //bool to manage if register page has been submitted
  const [isSubmitted, setIsSubmitted] = useState(false);
   //states to make sure there are no button spams
  const [registerDisabled, setRegisterDisabled] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyDisabled, setVerifyDisabled] = useState(false);

    
  //password requirements
  const options = {
    minLength: 8,
    minLowercase: 0,     // Minimum number of lowercase letters (optional)
    minUppercase: 0,     // Minimum number of uppercase letters (optional)
    minNumbers: 0,       // Minimum number of numbers (optional)
    minSymbols: 0,       // Minimum number of symbols (optional)
    returnScore: false,   // Whether to return the score of password strength (optional)
  }
  // Handle register button / form validation
  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Check for empty fields
    if (!name) {
      setErrorMsg("Name is required!");
      return;
    } else if (!email) {
      setErrorMsg("Email is required!");
      return;
    } else if (!password) {
      setErrorMsg("Password is required!");
      return;
    }
  
    // Format validations
    if (!validator.isEmail(email)) {
      setErrorMsg("Email is in the wrong format");
      return;
    } else if (!validator.isStrongPassword(password, options)) {
      setErrorMsg("Password must be at least 8 characters");
      return;
    }
  
    // All validations passed
    setErrorMsg("");
    setRegisterDisabled(true); // Immediately disable the register button
  
    const registerUser = async () => {
      try {
        const data = { firstName: name, email: email, password: password };
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/register`, data);

        // Fire Google conversion after successful signup
    if (window.gtag) {
  window.gtag('event', 'conversion', {
    'send_to': 'AW-576188796/Lc2XCLP8jcUbEPzi35IC'
  });
}


        setIsSubmitted(true);
      } catch (error) {
        console.error(error);
        setErrorMsg('Registration failed. Please try again.');
        setRegisterDisabled(false); // Re-enable if registration fails
      }
    };
  
    registerUser();

  };

  //Handle email verification
  const handleVerify = async () => {
    setVerifyDisabled(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/verify-email`, { email, code });
      setMessage(res.data.message);
  
      if (res.data.message === "Email verified successfully!") {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setVerifyDisabled(false); // only re-enable if not successful
      }
    } catch (error) {
      setMessage("Verification failed. Please check your code and try again.");
      setVerifyDisabled(false); // re-enable on failure
    }
  };
//handle resend code
const handleResendCode = async () => {
  setResendDisabled(true);       // Immediately disable the button
  setResendTimer(9);             // Start the countdown

  // Start countdown timer right away
  const interval = setInterval(() => {
    setResendTimer((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setResendDisabled(false);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  try {
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/resend-code`, { email });
    setMessage("A new verification code has been sent!");
  } catch (error) {
    setMessage("Failed to resend verification code.");
    clearInterval(interval);
    setResendDisabled(false);
    setResendTimer(0);
  }
};

  return (
    <section
      className="vh-100 bg-image"
      style={{
        backgroundImage:
          "url('https://mdbcdn.b-cdn.net/img/Photos/new-templates/search-box/img4.webp')",
      }}
    >
      <div className="mask d-flex align-items-center h-100 gradient-custom-3">
        <div className="container h-100">
          <div className="row d-flex justify-content-center align-items-center h-100">
            <div className="col-12 col-md-9 col-lg-7 col-xl-6">
              <div className="card" style={{ borderRadius: "15px", border: "2px solid #dee2e6" }}>
                <div className="card-body p-5">
                  {!isSubmitted ? (
                    <>
                      <h2 className="text-uppercase text-center mb-5">Create an account</h2>
                      <form onSubmit={handleSubmit}>
                        {/* Form Inputs */}
                        <div className="mb-4">
                          <label htmlFor="form3Example1cg" style={{ 
                            fontWeight: "500", 
                            display: "block", 
                            marginBottom: "8px",
                            color: "#333"
                          }}>
                            Your Name
                          </label>
                          <input
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            id="form3Example1cg"
                            placeholder="Enter your full name"
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
                          <label htmlFor="form3Example3cg" style={{ 
                            fontWeight: "500", 
                            display: "block", 
                            marginBottom: "8px",
                            color: "#333"
                          }}>
                            Your Email
                          </label>
                          <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="text"
                            id="form3Example3cg"
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
                          <label htmlFor="form3Example4cg" style={{ 
                            fontWeight: "500", 
                            display: "block", 
                            marginBottom: "8px",
                            color: "#333"
                          }}>
                            Password
                          </label>
                          <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="form3Example4cg"
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
  
                        <div id="passwordHelpBlock" className="form-text">
                          Your password must be at least 8 characters long
                        </div>
  
                        {errorMsg && (
                          <div id="passwordError" className="text-danger mt-1">
                            {errorMsg}
                          </div>
                        )}
  
                        <div className="d-flex justify-content-center">
                        <button
                          type="submit"
                          disabled={registerDisabled}
                          className="btn btn-success btn-block btn-lg gradient-custom-4 text-body"
                          style={{
                            border: "2px solid #198754",
                            borderRadius: "8px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#157347";
                            e.target.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#198754";
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          {registerDisabled ? "Registering..." : "Register"}
                        </button>
                        </div>
  
                        <p className="text-center text-muted mt-5 mb-0">
                          Already have an account?{" "}
                          <a href="Login" className="fw-bold text-body" style={{ 
                            border: "1px solid transparent",
                            borderRadius: "4px",
                            padding: "2px 4px",
                            transition: "border-color 0.2s"
                          }}
                          onMouseEnter={(e) => e.target.style.borderColor = "#6c757d"}
                          onMouseLeave={(e) => e.target.style.borderColor = "transparent"}>
                            <u>Login here</u>
                          </a>
                        </p>
                      </form>
                    </>
                  ) : (
                    <>
                      <h2 className="text-uppercase text-center mb-5">Email Verification</h2>
                      <div className="mb-4">
                        <label htmlFor="verificationCode" style={{ 
                          fontWeight: "500", 
                          display: "block", 
                          marginBottom: "8px",
                          color: "#333"
                        }}>
                          Verification Code
                        </label>
                        <input
                          type="text"
                          id="verificationCode"
                          placeholder="Enter verification code"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
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
                      <div className="d-flex flex-column gap-3">
                        <button 
                          onClick={handleVerify} 
                          disabled={verifyDisabled}
                          className="btn btn-success btn-block btn-lg gradient-custom-4 text-body"
                          style={{
                            border: "2px solid #198754",
                            borderRadius: "8px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#157347";
                            e.target.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#198754";
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          {verifyDisabled ? "Verifying..." : "Verify"}
                        </button>
                        <button 
                          onClick={handleResendCode} 
                          disabled={resendDisabled}
                          className="btn btn-outline-success btn-block btn-lg"
                          style={{
                            border: "2px solid #198754",
                            borderRadius: "8px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#157347";
                            e.target.style.backgroundColor = "#198754";
                            e.target.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#198754";
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#198754";
                          }}
                        >
                          {resendDisabled ? `Resend Code (${resendTimer}s)` : "Resend Code"}
                        </button>
                      </div>
                      <p className="mt-3">{message}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;


