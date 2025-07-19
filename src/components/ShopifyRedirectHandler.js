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

      // If ANY Shopify parameters are present (launched from Shopify)
      if (shop || host) {
        console.log('Launched from Shopify - redirecting to OAuth immediately');
        // ALWAYS redirect to OAuth when launched from Shopify - no UI before OAuth
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth?shop=${shop}&host=${host || ''}`;
        return;
      }

      // No Shopify context - regular website visitor
      if (isLoggedIn && !shop && !hmac && !host) {
        window.location.href = '/create-shipment';
      }
    }
  }, [location]);

  return null;
};

export default ShopifyRedirectHandler;
