import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ShopifyRedirectHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only run redirect logic on the homepage or frontend routes
    if (location.pathname === '/') {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get('shop');
      const hmac = params.get('hmac');
      const host = params.get('host');
      const session = params.get('session');
      const timestamp = params.get('timestamp');
      const isLoggedIn = localStorage.getItem('authToken');

      console.log('ShopifyRedirectHandler params:', { shop, hmac, host, session, timestamp });

      // If this is the INITIAL request from Shopify admin (before OAuth)
      // Characteristics: has shop and host, but no session/timestamp from OAuth completion
      if (shop && host && !session && !timestamp) {
        console.log('Initial Shopify admin request - redirecting to backend auth');
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth?shop=${shop}&host=${host}`;
        return;
      }

      // If this is AFTER OAuth completion (has session/timestamp)
      // Characteristics: has shop, hmac, host, session, and timestamp
      if (shop && hmac && host && session && timestamp) {
        console.log('OAuth completed - staying on frontend, redirecting to integration');
        // OAuth is complete, redirect to your app's integration page
        window.location.href = '/integration';
        return;
      }

      // If user is logged in but no Shopify params, go to main app
      if (isLoggedIn && !shop && !hmac && !host) {
        window.location.href = '/create-shipment';
      }
    }
  }, [location]);

  return null;
};

export default ShopifyRedirectHandler;
