import React, { useState } from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import logo from "../logo.png"
import "../styles.css"
import JellyCanvas from './JellyCanvas'
import CyclicLogo from './CyclicLogo'

const NavbarComp = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggle = (expandedStatus) => {
    setExpanded(expandedStatus);
  }

  const handleLogoClick = () => {
    // Prevent navigation if already on the products page
    if (location.pathname !== '/products' && location.pathname !== '/products/') {
      navigate('/products');
    }
  };

  return (
    <div>
      <JellyCanvas expanded={expanded} />
      <Navbar
        expand="lg"
        className="Top-Nav jelly-mode"
        style={{ background: 'transparent', boxShadow: 'none', border: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        onToggle={handleToggle}
      >
        <Container>
          <Navbar.Brand>
            <div className="Logo" style={{ cursor: 'pointer' }}>
              <CyclicLogo
                mainLogo={logo}
                alt="logo"
                style={{ display: 'flex', alignItems: 'left', height: '60px', onLoad: 'fadeIn' }}
                onClick={handleLogoClick}
              />
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto px-5">
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/products" className="Nav-Link" activeStyle={{ color: "#4cffa0" }}>Products</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/blog" className="Nav-Link" activeStyle={{ color: "#4cffa0" }}>Blog</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/contact" className="Nav-Link" activeStyle={{ color: "#4cffa0" }}>Contact</NavLink></Nav.Link>
            </Nav>
            <div className="cart-button">
              <button className="snipcart-checkout"> Cart <span className="snipcart-items-count"></span></button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  )
}

export default NavbarComp;
