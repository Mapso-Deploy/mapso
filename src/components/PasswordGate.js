import React, { useState, useEffect } from 'react';

const PasswordGate = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // TEMPORARY DEV PASSWORD - Remove before production launch
  const CORRECT_PASSWORD = 'mapso2024';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem('mapso_authenticated', 'true');
      onAuthenticated();
    } else {
      setPassword('');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url("../src/clear-pale-cement-stucco-pattern.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        fontFamily: 'PragmaticaW01-ExtendedBook'
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: isMobile ? 'calc(100vw - 60px)' : 'calc(100vw - 30px)',
          maxWidth: '400px',
          height: '60px',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
        }}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter password"
          autoFocus
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#333',
            fontSize: '16px',
            fontFamily: 'PragmaticaW01-ExtendedBook',
            textAlign: 'center'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
};

export default PasswordGate; 