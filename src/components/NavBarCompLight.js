import React, { Component } from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'
import logo from "../logo-inverted.png"
import "../styles.css"
import JellyCanvas from './JellyCanvas'
import CyclicLogo from './CyclicLogo'

export default class NavbarCompLight extends Component {
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
        <JellyCanvas isLightMode={true} expanded={this.state.expanded} />
        <Navbar
          expand="lg"
          className="Top-Nav-Light jelly-mode"
          style={{ background: 'transparent', boxShadow: 'none', border: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          onToggle={this.handleToggle}
        >
          <Container>
            <Navbar.Brand href="#home"><NavLink to="/Products" activeStyle={{ color: "#4cffa0" }}><a href="www.mapso.co/products" className="Logo"><CyclicLogo mainLogo={logo} alt="logo" style={{ display: 'flex', alignItems: 'left', height: '7vh', onLoad: 'fadeIn' }} onClick={() => window.location.href = '/'} /></a></NavLink></Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-dark" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto px-5">
                {/* <NavDropdown title="Explore" id="basic-nav-dropdown" className="Nav px-4">
          <NavDropdown.Item href="#action/3.1">All</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.2">Tops</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.3">Outterwear</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/3.4">Archive</NavDropdown.Item>
        </NavDropdown> */}
                <Nav.Link className="Nav px-5" href="#Products"><NavLink to="/products" className="Nav-Link-Light" activeStyle={{ color: "#4cffa0" }}>Products</NavLink></Nav.Link>
                {/* <Nav.Link className="Nav px-5" href="#Explore"><NavLink to="/explore" className="Nav-Link-Light" activeStyle={{color: "#4cffa0"}}>Explore</NavLink></Nav.Link> */}
                <Nav.Link className="Nav px-5" href="#Blog"><NavLink to="/blog" className="Nav-Link-Light" activeStyle={{ color: "#4cffa0" }}>Blog</NavLink></Nav.Link>
                <Nav.Link className="Nav px-5" href="#Contact"><NavLink to="/contact" className="Nav-Link-Light" activeStyle={{ color: "#4cffa0" }}>Contact</NavLink></Nav.Link>
                {/* <button class="my-account-light px-5 snipcart-customer-signin">Account</button> */}
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
