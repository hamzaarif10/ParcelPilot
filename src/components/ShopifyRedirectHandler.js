import { useEffect } from 'react';

const ShopifyRedirectHandler = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const hmac = params.get('hmac');
    const host = params.get('host');
    const isLoggedIn = localStorage.getItem('authToken');

    // Case 1: Coming from Shopify → redirect to backend to verify and redirect correctly
    if (shop && hmac && host) {
      window.location.href = `${process.env.REACT_APP_BACKEND_URL}/?${params.toString()}`;
    }

    // Case 2: Already logged in and no Shopify params → redirect to create-shipment
    if (isLoggedIn && !shop && !hmac && !host && window.location.pathname === '/') {
      window.location.href = '/create-shipment';
    }
  }, []);

  return null; // This component just redirects and renders nothing
};

export default ShopifyRedirectHandler;