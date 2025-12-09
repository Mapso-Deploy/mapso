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
            <div className="Logo" style={{ cursor: 'pointer' }}>
              <CyclicLogo
                mainLogo={logo}
                alt="logo"
                style={{ display: 'flex', alignItems: 'left', height: '60px', onLoad: 'fadeIn' }}
                onClick={handleLogoClick}
                invertImages={true}
              />
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-dark" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto px-5">
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/matter" className="Nav-Link-Light" style={({ isActive }) => isActive ? { color: "#4cffa0" } : undefined}>Matter</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/channel" className="Nav-Link-Light" style={({ isActive }) => isActive ? { color: "#4cffa0" } : undefined}>Channel</NavLink></Nav.Link>
              <Nav.Link className="Nav px-5" as="div"><NavLink to="/reach" className="Nav-Link-Light" style={({ isActive }) => isActive ? { color: "#4cffa0" } : undefined}>Reach</NavLink></Nav.Link>
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
