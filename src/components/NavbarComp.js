import React, { Component } from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'
import logo from "../logo.png"
import "../styles.css"
import JellyCanvas from './JellyCanvas'
import CyclicLogo from './CyclicLogo'

export default class NavbarComp extends Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }

  handleToggle = (expanded) => {
    this.setState({ expanded });
  }

  render() {
    return (
      <div>
        <JellyCanvas expanded={this.state.expanded} />
        <Navbar
          expand="lg"
          className="Top-Nav jelly-mode"
          style={{ background: 'transparent', boxShadow: 'none', border: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          onToggle={this.handleToggle}
        >
          <Container>
            {/* <Navbar.Brand href="#home"><NavLink to="/Products" activeStyle={{color: "#4cffa0"}}><a href="www.mapso.co/products" className="Logo"><img src="https://cdn.glitch.global/f341fe61-4868-4d79-bad9-1a5804bea407/mapso.gif?v=1713577323625" alt="logo" style={{display: 'flex', alignItems:'left', height: '10vh', onLoad: 'fadeIn'}} /></a></NavLink></Navbar.Brand> */}
            <Navbar.Brand href="#home"><NavLink to="/Products" activeStyle={{ color: "#4cffa0" }}><a href="www.mapso.co/products" className="Logo"><CyclicLogo mainLogo={logo} alt="logo" style={{ display: 'flex', alignItems: 'left', height: '7vh', onLoad: 'fadeIn' }} onClick={() => { if (window.location.pathname !== '/products' && window.location.pathname !== '/products/') window.location.href = '/products'; }} /></a></NavLink></Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto px-5">
                {/* <NavDropdown title="Products" id="basic-nav-dropdown" className="Nav px-4">
          <NavDropdown.Item href="#action/3.1">All</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.2">Tops</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.3">Outterwear</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/3.4">Archive</NavDropdown.Item>
        </NavDropdown> */}
                <Nav.Link className="Nav px-5" href="#Products"><NavLink to="/products" className="Nav-Link" activeStyle={{ color: "#4cffa0" }}>Products</NavLink></Nav.Link>
                {/* <Nav.Link className="Nav px-5" href="#Explore"><NavLink to="/explore" className="Nav-Link" activeStyle={{color: "#4cffa0"}}>Explore</NavLink></Nav.Link> */}
                <Nav.Link className="Nav px-5" href="#Blog"><NavLink to="/blog" className="Nav-Link" activeStyle={{ color: "#4cffa0" }}>Blog</NavLink></Nav.Link>
                <Nav.Link className="Nav px-5" href="#Contact"><NavLink to="/contact" className="Nav-Link" activeStyle={{ color: "#4cffa0" }}>Contact</NavLink></Nav.Link>
                {/* <button class="my-account px-5 snipcart-customer-signin">Account</button> */}
              </Nav>
              <div class="cart-button">
                <button class="snipcart-checkout"> Cart <span class="snipcart-items-count"></span></button>
              </div>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>
    )
  }
}
