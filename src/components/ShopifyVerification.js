import React, { useEffect, useState } from 'react';

const ShopifyVerification = () => {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Completing Shopify authentication...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const host = params.get('host');

    if (!shop) {
      setStatus('error');
      setMessage('Missing shop information');
      return;
    }

    // Verify OAuth completion and shop connection
    verifyShopifyConnection(shop, host);
  }, []);

  const verifyShopifyConnection = async (shop, host) => {
    try {
      setMessage('Verifying your Shopify store connection...');
      
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setStatus('error');
        setMessage('Please log in to your account first');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }

      // Test the Shopify API connection
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
          setMessage('Shopify authentication completed successfully!');
          
          // Small delay to show success message, then redirect
          setTimeout(() => {
            window.location.href = `/integration?shop=${shop}${host ? `&host=${host}` : ''}`;
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Shopify authentication failed. Please try again.');
        }
      } else {
        setStatus('error');
        setMessage('Unable to verify Shopify connection');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('Connection verification failed');
    }
  };

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
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status === 'verifying' && 'Authenticating with Shopify'}
            {status === 'success' && 'Authentication Complete'}
            {status === 'error' && 'Authentication Failed'}
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
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyVerification;