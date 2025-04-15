import {React, useState} from 'react';
import '../styles/Login.css';
import axios from 'axios';
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, { email, password });
      const token = response.data.token;
      localStorage.setItem('authToken', token);  // Store the token
      window.location.href = "/create-shipment"; // Redirect to the protected page
    } catch (error) {
      console.error('Error logging in:', error.response?.data || error.message);
      alert(`Failed to log in: ${error.response?.data || error.message}`);
    }
};
function Login() {
    const navigate = useNavigate();
    //State variables
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState('');
    
    //Form validation
    const handleSubmit = async (e) => {
        e.preventDefault();
            if (!email && !password)
            {
                setErrorMsg("Please fill out all fields.");
                return;
            }
            if (!email)
            {
                setErrorMsg("Please enter an email.");
                return;
            }
            if (!password)
            {
                setErrorMsg("Please enter a password");
                return;
            }
    // If all fields are filled, clear the error and proceed
    setErrorMsg(""); 
    
    await login(email, password);
    }
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

                                            <div data-mdb-input-init className="form-outline mb-4">
                                                <input 
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    type="text" 
                                                    id="form2Example11" 
                                                    className="form-control" 
                                                    placeholder="Email Address" 
                                                />
                                                <label className="form-label" htmlFor="form2Example11">Email</label>
                                            </div>

                                            <div data-mdb-input-init className="form-outline mb-4">
                                                <input 
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    type="password" 
                                                    id="form2Example22" 
                                                    className="form-control" 
                                                    placeholder="Password" 
                                                />
                                                <label className="form-label" htmlFor="form2Example22">Password</label>
                                            </div>

                                             {/* Render error message conditionally */}
                                                {errorMsg && (
                                                <div id="passwordError" className="text-danger mt-1">
                                                    {errorMsg}
                                                </div>
                                                )}
                                            <div className="text-center pt-1 mb-5 pb-1">
                                                <button 
                                                    data-mdb-button-init 
                                                    data-mdb-ripple-init 
                                                    className="btn btn-primary btn-block fa-lg gradient-custom-2 mb-3" 
                                                    type="submit"
                                                >
                                                    Log in
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
                                        ParcelPilot makes it easy to ship anywhere across Canada. From major urban centres to small towns coast-to-coast, you’ll always get a great rate on your domestic shipping.
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
}

export default Login;
