import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Landing from "./Landing";
import Products from "./Products";
import ProductsTest from "./ProductsTest"; // Three.js test implementation
import About from "./About";
import Contact from "./Contact";
import Explore from "./Explore";
import Blog from "./Blog";
import ProductDetail from "./components/ProductDetail";
import PasswordGate from "./components/PasswordGate"; // TEMPORARY - Remove when launching
import 'bootstrap/dist/css/bootstrap.min.css';
// import NavbarComp from "./components/NavbarComp.js";

// Component to handle route protection
function ProtectedRoutes() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated from localStorage
    const authStatus = localStorage.getItem('mapso_authenticated');
    setIsAuthenticated(authStatus === 'true');
    setIsLoading(false);
  }, []);

  const handleAuthentication = () => {
    setIsAuthenticated(true);
  };

  // Always show landing page
  if (location.pathname === '/') {
    return <Landing />;
  }

  // Show loading state briefly
  if (isLoading) {
    return null;
  }

  // Show password gate for protected routes if not authenticated
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={handleAuthentication} />;
  }

  // Render protected routes
  return (
    <Routes>
      <Route path="/products" element={<Products />} />
      <Route path="/products-test" element={<ProductsTest />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/products/:productId" element={<ProductDetail />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
    <div>
      {/* <NavbarComp/> */}
     <Routes>
      <Route path="/*" element={<ProtectedRoutes />} />
     </Routes>
    </div>
    </Router>
  );
}

export default App;
