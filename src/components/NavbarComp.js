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
    // Prevent navigation if already on the matter page
    if (location.pathname !== '/matter' && location.pathname !== '/matter/') {
      navigate('/matter');
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
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/matter" className="Nav-Link" style={({ isActive }) => isActive ? { textShadow: "0 0 10px rgba(76, 255, 160, 0.8), 0 0 20px rgba(76, 255, 160, 0.6), 0 0 30px rgba(76, 255, 160, 0.4)" } : undefined}>Matter</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/channel" className="Nav-Link" style={({ isActive }) => isActive ? { textShadow: "0 0 10px rgba(76, 255, 160, 0.8), 0 0 20px rgba(76, 255, 160, 0.6), 0 0 30px rgba(76, 255, 160, 0.4)" } : undefined}>Channel</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/signal" className="Nav-Link" style={({ isActive }) => isActive ? { textShadow: "0 0 10px rgba(76, 255, 160, 0.8), 0 0 20px rgba(76, 255, 160, 0.6), 0 0 30px rgba(76, 255, 160, 0.4)" } : undefined}>Signal</NavLink></Nav.Link>
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
