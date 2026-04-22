import React, { useEffect } from 'react';

const LandingPage = () => {
  useEffect(() => {
    // Redirect to the static landing page
    window.location.href = '/landing.html';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #fff5f3 0%, #ffecd2 50%, #fff5f3 100%)'
    }}>
      <p style={{ color: '#888', fontSize: '1.1rem' }}>Đang tải...</p>
    </div>
  );
};

export default LandingPage;
