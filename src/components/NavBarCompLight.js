import React, { useState } from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import logo from "../logo-inverted.png"
import "../styles.css"
import JellyCanvas from './JellyCanvas'
import CyclicLogo from './CyclicLogo'

const NavbarCompLight = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggle = (expandedStatus) => {
    setExpanded(expandedStatus);
  }

  const handleLogoClick = () => {
    if (location.pathname !== '/matter' && location.pathname !== '/matter/') {
      navigate('/matter');
    }
  };

  return (
    <div>
      <JellyCanvas isLightMode={true} expanded={expanded} />
      <Navbar
        expand="lg"
        className="Top-Nav-Light jelly-mode"
        style={{ background: 'transparent', boxShadow: 'none', border: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        onToggle={handleToggle}
      >
        <Container>
          <Navbar.Brand>
            <div className="Logo">
              <CyclicLogo
                mainLogo={logo}
                alt="logo"
                className="navbar-cycling-logo"
                onClick={handleLogoClick}
                invertImages={true}
              />
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-dark" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto px-5">
              <Nav.Link className="Nav px-5" as="div" style={{ cursor: 'none' }}><NavLink to="/matter" className="Nav-Link-Light" style={({ isActive }) => ({ cursor: 'none', ...(isActive ? { textShadow: "0 0 20px rgba(76, 255, 160, 0.9), 0 0 40px rgba(76, 255, 160, 0.6), 0 0 60px rgba(76, 255, 160, 0.4), 0 0 80px rgba(76, 255, 160, 0.2)" } : {}) })}>Matter</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div" style={{ cursor: 'none' }}><NavLink to="/channel" className="Nav-Link-Light" style={({ isActive }) => ({ cursor: 'none', ...(isActive ? { textShadow: "0 0 20px rgba(76, 255, 160, 0.9), 0 0 40px rgba(76, 255, 160, 0.6), 0 0 60px rgba(76, 255, 160, 0.4), 0 0 80px rgba(76, 255, 160, 0.2)" } : {}) })}>Channel</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div" style={{ cursor: 'none' }}><NavLink to="/signal" className="Nav-Link-Light" style={({ isActive }) => ({ cursor: 'none', ...(isActive ? { textShadow: "0 0 20px rgba(76, 255, 160, 0.9), 0 0 40px rgba(76, 255, 160, 0.6), 0 0 60px rgba(76, 255, 160, 0.4), 0 0 80px rgba(76, 255, 160, 0.2)" } : {}) })}>Signal</NavLink></Nav.Link>
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

export default NavbarCompLight;
