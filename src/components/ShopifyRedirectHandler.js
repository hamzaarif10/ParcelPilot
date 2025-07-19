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
      const isLoggedIn = localStorage.getItem('authToken');

      if (shop && hmac && host) {
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}/?${params.toString()}`;
      }

      if (isLoggedIn && !shop && !hmac && !host) {
        window.location.href = '/create-shipment';
      }
    }
  }, [location]);

  return null;
};

export default ShopifyRedirectHandler;
