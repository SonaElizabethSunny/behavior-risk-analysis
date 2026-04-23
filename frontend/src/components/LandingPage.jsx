import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    const features = [
        {
            icon: '🎯',
            title: 'AI-Powered Detection',
            description: 'Advanced deep learning models detect violent behavior with 95%+ accuracy, analyzing thousands of frames per second.',
            highlight: '95% Accuracy'
        },
        {
            icon: '⚡',
            title: 'Real-Time Analysis',
            description: 'Lightning-fast processing delivers threat alerts in under 2 seconds, enabling immediate response.',
            highlight: '<2s Response'
        },
        {
            icon: '🚨',
            title: 'Smart Alerts',
            description: 'Multi-channel notifications via email, SMS, and push notifications with customizable severity levels.',
            highlight: 'Multi-Channel'
        },
        {
            icon: '📊',
            title: 'Analytics Dashboard',
            description: 'Comprehensive insights with heat maps, trend analysis, and predictive risk assessment.',
            highlight: 'Predictive AI'
        },
        {
            icon: '🌐',
            title: 'Cloud Infrastructure',
            description: 'Enterprise-grade cloud storage with 99.9% uptime and automatic failover protection.',
            highlight: '99.9% Uptime'
        },
        {
            icon: '🔒',
            title: 'Military-Grade Security',
            description: 'AES-256 encryption, SOC 2 compliance, and multi-factor authentication protect your data.',
            highlight: 'SOC 2 Certified'
        }
    ];

    const services = [
        {
            title: 'Violence Detection',
            description: 'Identify physical altercations, weapon detection, and aggressive behavior patterns in real-time with context-aware AI.',
            image: '🥊',
            features: ['Weapon Detection', 'Fight Recognition', 'Aggression Analysis']
        },
        {
            title: 'Behavioral Analysis',
            description: 'Advanced pattern recognition identifies suspicious activities, loitering, and unusual crowd behavior before incidents escalate.',
            image: '🧠',
            features: ['Pattern Recognition', 'Anomaly Detection', 'Crowd Analysis']
        },
        {
            title: 'Incident Management',
            description: 'Automated recording, evidence preservation, and chain-of-custody documentation for legal compliance.',
            image: '🎬',
            features: ['Auto Recording', 'Evidence Chain', 'Legal Reports']
        }
    ];

    const stats = [
        { number: '10+', label: 'Active Installations', icon: '🏢' },
        { number: '30+', label: 'Threats Detected', icon: '🛡️' },
        { number: '99.9%', label: 'System Uptime', icon: '⚡' },
        { number: '24/7', label: 'Expert Support', icon: '💬' }
    ];

    const testimonials = [
        {
            quote: "Sentinel AI has transformed our security operations. The real-time alerts have prevented multiple incidents.",
            author: "John Smith",
            role: "Security Director",
            company: "Metro Shopping Complex"
        },
        {
            quote: "The accuracy is incredible. We've reduced false alarms by 80% while catching actual threats faster than ever.",
            author: "Sarah Johnson",
            role: "Chief of Security",
            company: "University Campus"
        },
        {
            quote: "Best investment we've made. The ROI was evident within the first month of deployment.",
            author: "Michael Chen",
            role: "Operations Manager",
            company: "Industrial Park"
        }
    ];

    const techStack = [
        { name: 'YOLOv8', description: 'Object Detection' },
        { name: 'CNN', description: 'Behavior Analysis' },
        { name: 'Temporal AI', description: 'Pattern Recognition' },
        { name: 'Cloud ML', description: 'Scalable Processing' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-particles"></div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-icon">🏆</span>
                        <span>Industry-Leading AI Security Platform</span>
                    </div>
                    <h1 className="hero-title">
                        Sentinel AI
                        <span className="hero-subtitle">Intelligent Security, Simplified</span>
                    </h1>
                    <p className="hero-description">
                        Transform your CCTV infrastructure into an intelligent security system.
                        Detect threats in real-time, prevent incidents before they escalate,
                        and protect what matters most with cutting-edge AI technology.
                    </p>
                    <div className="hero-stats">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <div className="stat-icon">{stat.icon}</div>
                                <div className="stat-content">
                                    <div className="stat-number">{stat.number}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="hero-trust">
                        <p>Trusted by leading organizations worldwide</p>
                        <div className="trust-badges">
                            <span className="trust-badge">🏛️ Government</span>
                            <span className="trust-badge">🏫 Education</span>
                            <span className="trust-badge">🏢 Enterprise</span>
                            <span className="trust-badge">🏪 Retail</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <span className="section-badge">Features</span>
                    <h2 className="section-title">Why Industry Leaders Choose Sentinel AI</h2>
                    <p className="section-description">
                        Enterprise-grade security powered by state-of-the-art artificial intelligence
                    </p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card" data-index={index}>
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">{feature.icon}</div>
                                <div className="feature-highlight">{feature.highlight}</div>
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                            <div className="feature-footer">
                                <button className="feature-link" onClick={() => navigate('/services')}>
                                    Learn More →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Services Section */}
            <section className="services-section">
                <div className="section-header">
                    <span className="section-badge">Solutions</span>
                    <h2 className="section-title">Comprehensive Security Solutions</h2>
                    <p className="section-description">
                        End-to-end protection powered by advanced AI and machine learning
                    </p>
                </div>
                <div className="services-grid">
                    {services.map((service, index) => (
                        <div key={index} className="service-card">
                            <div className="service-image">{service.image}</div>
                            <div className="service-content">
                                <h3 className="service-title">{service.title}</h3>
                                <p className="service-description">{service.description}</p>
                                <ul className="service-features">
                                    {service.features.map((feat, idx) => (
                                        <li key={idx}>
                                            <span className="check-icon">✓</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <button className="service-link" onClick={() => navigate('/services')}>
                                    Explore Solution →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Technology Section */}
            <section className="technology-section">
                <div className="tech-content">
                    <div className="tech-text">
                        <span className="section-badge">Technology</span>
                        <h2 className="tech-title">Powered by Cutting-Edge AI</h2>
                        <p className="tech-description">
                            Our proprietary AI engine combines multiple deep learning models to deliver
                            unparalleled accuracy and speed. Built on proven technologies and enhanced
                            with our custom algorithms, Sentinel AI sets the industry standard.
                        </p>
                        <div className="tech-stack">
                            {techStack.map((tech, index) => (
                                <div key={index} className="tech-item">
                                    <div className="tech-name">{tech.name}</div>
                                    <div className="tech-desc">{tech.description}</div>
                                </div>
                            ))}
                        </div>
                        <ul className="tech-features">
                            <li><span className="check-icon">✓</span> Real-time processing at 60+ FPS</li>
                            <li><span className="check-icon">✓</span> 95%+ detection accuracy</li>
                            <li><span className="check-icon">✓</span> Sub-2-second response time</li>
                            <li><span className="check-icon">✓</span> Continuous learning & improvement</li>
                        </ul>
                        <button className="btn-primary" onClick={() => navigate('/about')}>
                            Learn About Our Technology
                        </button>
                    </div>
                    <div className="tech-visual">
                        <div className="tech-graphic">
                            <div className="tech-circle pulse"></div>
                            <div className="tech-circle-2"></div>
                            <div className="tech-text-overlay">AI POWERED</div>
                            <div className="tech-stats-overlay">
                                <div className="tech-stat">95% Accuracy</div>
                                <div className="tech-stat">&lt;2s Response</div>
                                <div className="tech-stat">24/7 Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
                <div className="section-header">
                    <span className="section-badge">Testimonials</span>
                    <h2 className="section-title">Trusted by Security Professionals</h2>
                    <p className="section-description">
                        See what industry leaders say about Sentinel AI
                    </p>
                </div>
                <div className="testimonials-container">
                    <div className="testimonial-card">
                        <div className="quote-icon">"</div>
                        <p className="testimonial-quote">{testimonials[activeTestimonial].quote}</p>
                        <div className="testimonial-author">
                            <div className="author-avatar">
                                {testimonials[activeTestimonial].author.charAt(0)}
                            </div>
                            <div className="author-info">
                                <div className="author-name">{testimonials[activeTestimonial].author}</div>
                                <div className="author-role">{testimonials[activeTestimonial].role}</div>
                                <div className="author-company">{testimonials[activeTestimonial].company}</div>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial-dots">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                className={`dot ${index === activeTestimonial ? 'active' : ''}`}
                                onClick={() => setActiveTestimonial(index)}
                            />
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
