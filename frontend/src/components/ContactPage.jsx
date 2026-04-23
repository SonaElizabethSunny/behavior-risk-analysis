import React, { useState } from 'react';
import './ContactPage.css';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        service: 'general'
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the form data to your backend
        console.log('Form submitted:', formData);
        setSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
            setSubmitted(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                message: '',
                service: 'general'
            });
        }, 3000);
    };

    const contactInfo = [
        {
            icon: '📧',
            title: 'Email',
            value: 'contact@sentinelai.com',
            link: 'mailto:contact@sentinelai.com'
        },
        {
            icon: '📞',
            title: 'Phone',
            value: '+1 (555) 123-4567',
            link: 'tel:+15551234567'
        },
        {
            icon: '📍',
            title: 'Address',
            value: '123 Security Blvd, Tech City, TC 12345',
            link: null
        },
        {
            icon: '🕐',
            title: 'Business Hours',
            value: 'Mon-Fri: 9AM - 6PM',
            link: null
        }
    ];

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="contact-hero-content">
                    <h1 className="contact-hero-title">Get In Touch</h1>
                    <p className="contact-hero-description">
                        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>
            </section>

            {/* Contact Form & Info Section */}
            <section className="contact-main-section">
                <div className="contact-container">
                    {/* Contact Form */}
                    <div className="contact-form-wrapper">
                        <h2 className="form-title">Send Us a Message</h2>
                        <p className="form-subtitle">Fill out the form below and we'll get back to you within 24 hours</p>

                        {submitted && (
                            <div className="success-message">
                                ✓ Thank you! Your message has been sent successfully.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="company">Company</label>
                                    <input
                                        type="text"
                                        id="company"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="Your Company"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="service">Service Interest</label>
                                <select
                                    id="service"
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                >
                                    <option value="general">General Inquiry</option>
                                    <option value="demo">Request a Demo</option>
                                    <option value="pricing">Pricing Information</option>
                                    <option value="support">Technical Support</option>
                                    <option value="partnership">Partnership Opportunities</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message *</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="6"
                                    placeholder="Tell us about your security needs..."
                                ></textarea>
                            </div>

                            <button type="submit" className="submit-btn">
                                Send Message
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="contact-info-wrapper">
                        <h2 className="info-title">Contact Information</h2>
                        <p className="info-subtitle">
                            Reach out to us through any of these channels
                        </p>

                        <div className="contact-info-list">
                            {contactInfo.map((info, index) => (
                                <div key={index} className="contact-info-item">
                                    <div className="info-icon">{info.icon}</div>
                                    <div className="info-content">
                                        <h3 className="info-label">{info.title}</h3>
                                        {info.link ? (
                                            <a href={info.link} className="info-value-link">
                                                {info.value}
                                            </a>
                                        ) : (
                                            <p className="info-value">{info.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="social-links">
                            <h3 className="social-title">Follow Us</h3>
                            <div className="social-icons">
                                <a href="#" className="social-icon">🔗 LinkedIn</a>
                                <a href="#" className="social-icon">🐦 Twitter</a>
                                <a href="#" className="social-icon">📘 Facebook</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section (Placeholder) */}
            <section className="map-section">
                <div className="map-placeholder">
                    <div className="map-overlay">
                        <h3>📍 Visit Our Office</h3>
                        <p>123 Security Blvd, Tech City, TC 12345</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
