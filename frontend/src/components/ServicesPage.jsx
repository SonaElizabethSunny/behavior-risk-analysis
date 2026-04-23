import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ServicesPage.css';

const ServicesPage = () => {
    const navigate = useNavigate();

    const mainServices = [
        {
            icon: '🎯',
            title: 'Real-Time Violence Detection',
            description: 'Our advanced AI system analyzes video feeds in real-time to detect fighting, assault, and aggressive behavior with 95%+ accuracy.',
            features: [
                'YOLOv8 human detection',
                'CNN behavioral analysis',
                'Temporal validation',
                'Context-aware processing',
                'Instant threat alerts'
            ],
            price: 'Custom Pricing'
        },
        {
            icon: '🚨',
            title: 'Automated Alert System',
            description: 'Receive instant notifications via email, SMS, and push notifications when threats are detected.',
            features: [
                'Email alerts',
                'SMS notifications',
                'Push notifications',
                'Custom alert rules',
                'Escalation protocols'
            ],
            price: 'Included'
        },
        {
            icon: '📊',
            title: 'Analytics & Reporting',
            description: 'Comprehensive analytics dashboard with incident tracking, pattern analysis, and detailed reports.',
            features: [
                'Incident timeline',
                'Behavior patterns',
                'Custom reports',
                'Export capabilities',
                'Historical data analysis'
            ],
            price: 'Premium'
        },
        {
            icon: '🎬',
            title: 'Incident Recording',
            description: 'Automatically record and save video clips of detected incidents for evidence and review.',
            features: [
                'Auto-recording on detection',
                '5-second incident clips',
                'Cloud storage',
                'Easy download',
                'Secure encryption'
            ],
            price: 'Standard'
        },
        
    ];

    const addons = [
        {
            title: 'GPS Location Tracking',
            description: 'Automatic location tagging for all incidents',
            icon: '📍'
        },
        {
            title: 'Custom AI Training',
            description: 'Train models on your specific use cases',
            icon: '🧠'
        },
        {
            title: 'API Access',
            description: 'Integrate with your existing systems',
            icon: '🔌'
        },
        {
            title: 'Priority Support',
            description: '24/7 dedicated support team',
            icon: '🎧'
        }
    ];

    return (
        <div className="services-page">
            {/* Hero Section */}
            <section className="services-hero">
                <div className="services-hero-content">
                    <h1 className="services-hero-title">Our Services</h1>
                    <p className="services-hero-description">
                        Comprehensive AI-powered security solutions tailored to your needs
                    </p>
                </div>
            </section>

            {/* Main Services Section */}
            <section className="main-services-section">
                <div className="section-header">
                    <h2 className="section-title">Core Services</h2>
                    <p className="section-description">
                        Everything you need for intelligent surveillance and threat detection
                    </p>
                </div>
                <div className="main-services-grid">
                    {mainServices.map((service, index) => (
                        <div key={index} className="service-detail-card">
                            <div className="service-detail-header">
                                <div className="service-detail-icon">{service.icon}</div>
                                <div className="service-detail-price">{service.price}</div>
                            </div>
                            <h3 className="service-detail-title">{service.title}</h3>
                            <p className="service-detail-description">{service.description}</p>
                            <ul className="service-features-list">
                                {service.features.map((feature, idx) => (
                                    <li key={idx}>
                                        <span className="feature-check">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className="service-cta-btn"
                                onClick={() => navigate('/contact')}
                            >
                                Get Started
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Add-ons Section */}
            <section className="addons-section">
                <div className="section-header">
                    <h2 className="section-title">Premium Add-ons</h2>
                    <p className="section-description">
                        Enhance your security system with additional features
                    </p>
                </div>
                <div className="addons-grid">
                    {addons.map((addon, index) => (
                        <div key={index} className="addon-card">
                            <div className="addon-icon">{addon.icon}</div>
                            <h3 className="addon-title">{addon.title}</h3>
                            <p className="addon-description">{addon.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section">
                <div className="section-header">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-description">
                        Simple setup, powerful protection
                    </p>
                </div>
                <div className="steps-container">
                    <div className="step-item">
                        <div className="step-number">1</div>
                        <h3 className="step-title">Connect Cameras</h3>
                        <p className="step-description">
                            Connect your existing CCTV cameras or use webcams for live monitoring
                        </p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-item">
                        <div className="step-number">2</div>
                        <h3 className="step-title">AI Analysis</h3>
                        <p className="step-description">
                            Our AI continuously analyzes video feeds for behavioral threats
                        </p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-item">
                        <div className="step-number">3</div>
                        <h3 className="step-title">Instant Alerts</h3>
                        <p className="step-description">
                            Receive immediate notifications when threats are detected
                        </p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-item">
                        <div className="step-number">4</div>
                        <h3 className="step-title">Take Action</h3>
                        <p className="step-description">
                            Review incidents, download evidence, and respond appropriately
                        </p>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default ServicesPage;
