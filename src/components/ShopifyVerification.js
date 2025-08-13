import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ShopifyVerification = () => {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Completing Shopify authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const host = params.get('host');

    if (!shop) {
      setStatus('error');
      setMessage('Missing shop information');
      return;
    }

    // Check if user is logged in first
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      // Store shop info for after login
      sessionStorage.setItem('pendingShopifyShop', shop);
      if (host) sessionStorage.setItem('pendingShopifyHost', host);
      
      setStatus('redirect');
      setMessage('Please log in to complete the installation');
      
      // Redirect to login with return path
      setTimeout(() => {
        window.location.href = `/login?returnUrl=${encodeURIComponent('/shopify-verify?shop=' + shop + (host ? '&host=' + host : ''))}`;
      }, 2000);
      return;
    }

    // User is logged in, proceed with verification
    verifyShopifyConnection(shop, host);
  }, [navigate]);

  const verifyShopifyConnection = async (shop, host) => {
    try {
      setMessage('Associating your Shopify store with your account...');
      
      const authToken = localStorage.getItem('authToken');
      
      // First, associate the shop with the logged-in user
      const associateResponse = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/associate-shop`,
        { shop },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!associateResponse.data.success) {
        throw new Error('Failed to associate shop');
      }

      // Now verify the connection
      setMessage('Verifying your Shopify store connection...');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/get-shopify-auth-details`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.shopify_access_token && data.shopify_domain === shop) {
          setStatus('success');
          setMessage('Shopify store connected successfully!');
          
          // Clear any pending shop info
          sessionStorage.removeItem('pendingShopifyShop');
          sessionStorage.removeItem('pendingShopifyHost');
          
          // Small delay to show success message, then redirect
          setTimeout(() => {
            // Navigate to integrations page with shop params to trigger auto-sync
            navigate(`/integration?shop=${shop}${host ? `&host=${host}` : ''}`);
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Unable to verify store connection. Please try installing again.');
        }
      } else {
        setStatus('error');
        setMessage('Unable to verify Shopify connection');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('Connection verification failed. Please try again.');
    }
  };

  // Check for pending installation after login
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const pendingShop = sessionStorage.getItem('pendingShopifyShop');
    const pendingHost = sessionStorage.getItem('pendingShopifyHost');
    
    if (authToken && pendingShop && status === 'verifying') {
      
      // User just logged in with pending installation
      const params = new URLSearchParams(window.location.search);
      const currentShop = params.get('shop');
      
      if (!currentShop && pendingShop) {
        // Redirect to complete the pending installation
        window.location.href = `/shopify-verify?shop=${pendingShop}${pendingHost ? `&host=${pendingHost}` : ''}`;
      }
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {status === 'verifying' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            {status === 'redirect' && (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            )}
          </div>
         
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status === 'verifying' && 'Connecting to Shopify'}
            {status === 'success' && 'Connection Complete'}
            {status === 'error' && 'Connection Failed'}
            {status === 'redirect' && 'Login Required'}
          </h2>
         
          <p className="text-gray-600">{message}</p>
        </div>
        
        {status === 'verifying' && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
            </div>
            <p className="text-sm text-gray-500">This may take a few seconds...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mt-4 space-y-3">
            <button
              onClick={() => window.location.href = `https://${new URLSearchParams(window.location.search).get('shop')}/admin/apps`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Return to Shopify Admin
            </button>
            <button
              onClick={() => navigate('/integration')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Go to Integrations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyVerification;