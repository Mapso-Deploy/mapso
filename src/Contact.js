import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import NavbarComp from "./components/NavbarComp.js";

function Contact() {
  const [state, handleSubmit] = useForm("xbjpvdnl");
  if (state.succeeded) {
    return <p>Thanks for your inquiry!</p>;
  }
  return (
    <>
      <NavbarComp />
      <div className="contact-display-wrapper">
        <form onSubmit={handleSubmit} className="formspree" style={{ zIndex: '0' }}>
          <h2 style={{ display: 'flex', alignText: 'middle', marginLeft: 'auto', marginRight: 'auto' }}>Inquires E-Form</h2>
          <label htmlFor="firstname">
            First Name:
          </label>
          <input
            id="firstname"
            type="firstname"
            name="firstname"
            required
          />
          <label htmlFor="lastname">
            Last Name:
          </label>
          <input
            id="lastname"
            type="lastname"
            name="lastname"
            required
          />
          <label htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
          />
          <ValidationError
            prefix="Email"
            field="email"
            errors={state.errors}
          />
          <label htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
          />
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
          />
          <button type="submit" disabled={state.submitting}>
            Submit
          </button>
        </form>
      </div>
    </>
  );
}
export default Contact;

