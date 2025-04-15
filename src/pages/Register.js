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
    if (!name) 
    {
      setErrorMsg("Name is required!");
      return; 
    
    } else if (!email) 
    {
      setErrorMsg("Email is required!");
      return; 
    
    } else if (!password) 
    {
        setErrorMsg("Password is required!");
        return; 
    } 
    
    // correct format checks
    if(!validator.isEmail(email))
    {
        setErrorMsg("Email is in the wrong format");
        return;
    } else if (!validator.isStrongPassword(password, options))
    {
        setErrorMsg("Password must be at least 8 characters");
        return;
    }
  
    // If all fields are filled, clear the error and proceed
    setErrorMsg(""); 
    
    //query the sql database
    const registerUser = async () => {
      try {
        const data = { firstName: name, email: email, password: password };
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/register`, data);
        setIsSubmitted(true);
      } catch (error) {
        console.error(error);
        setErrorMsg('Registration failed. Please try again.');
      }
    };
    registerUser();
  };
  //Handle email verification
  const handleVerify = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/verify-email`, { email, code });
      setMessage(res.data.message);

      // Redirect to login page after successful verification
      if (res.data.message === "Email verified successfully!") {
        // Redirect to login page
        setTimeout(() => {
          navigate("/login"); // Adjust the route if necessary
        }, 2000); // Wait for 2 seconds before redirecting, to show the success message
      }
    } catch (error) {
      setMessage("Verification failed. Please check your code and try again.");
    }
  };
//handle resend code
const handleResendCode = async () => {
  try {
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/resend-code`, { email });
    setMessage("A new verification code has been sent!");
  } catch (error) {
    setMessage("Failed to resend verification code.");
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
              <div className="card" style={{ borderRadius: "15px" }}>
                <div className="card-body p-5">
                  {!isSubmitted ? (
                    <>
                      <h2 className="text-uppercase text-center mb-5">Create an account</h2>
                      <form onSubmit={handleSubmit}>
                        {/* Form Inputs */}
                        <div data-mdb-input-init className="form-outline mb-4">
                          <input
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            id="form3Example1cg"
                            className="form-control form-control-lg"
                          />
                          <label className="form-label" htmlFor="form3Example1cg">
                            Your Name
                          </label>
                        </div>
  
                        <div data-mdb-input-init className="form-outline mb-4">
                          <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="text"
                            id="form3Example3cg"
                            className="form-control form-control-lg"
                          />
                          <label className="form-label" htmlFor="form3Example3cg">
                            Your Email
                          </label>
                        </div>
  
                        <div data-mdb-input-init className="form-outline mb-4">
                          <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="form3Example4cg"
                            className="form-control form-control-lg"
                          />
                          <label className="form-label" htmlFor="form3Example4cg">
                            Password
                          </label>
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
                            className="btn btn-success btn-block btn-lg gradient-custom-4 text-body"
                          >
                            Register
                          </button>
                        </div>
  
                        <p className="text-center text-muted mt-5 mb-0">
                          Already have an account?{" "}
                          <a href="Login" className="fw-bold text-body">
                            <u>Login here</u>
                          </a>
                        </p>
                      </form>
                    </>
                  ) : (
                    <>
                      <h2 className="text-uppercase text-center mb-5">Email Verification</h2>
                      <div data-mdb-input-init className="form-outline mb-4">
                      <input
                        type="text"
                        placeholder="Enter verification code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="form-control form-control-lg"
                      />
                      <label className="form-label" htmlFor="form3Example1cg">
                            Verification Code
                          </label>
                      </div>
                      <button onClick={handleVerify} className="btn btn-success btn-block btn-lg gradient-custom-4 text-body">Verify</button>
                      <button onClick={handleResendCode} className="btn btn-success btn-block btn-lg gradient-custom-4 text-body">Resend Code</button>
                      <p>{message}</p>
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

