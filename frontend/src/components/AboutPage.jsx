import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
    const navigate = useNavigate();

    const team = [
        {
            name: 'Advanced AI Detection',
            role: 'Core Technology',
            description: 'YOLOv8 + CNN models for real-time threat detection'
        },
        {
            name: 'Cloud Infrastructure',
            role: 'Scalable Platform',
            description: 'Enterprise-grade security and 99.9% uptime'
        },
        {
            name: '24/7 Monitoring',
            role: 'Always Active',
            description: 'Round-the-clock automated surveillance'
        },
        {
            name: 'Expert Support',
            role: 'Customer Success',
            description: 'Dedicated team for implementation and support'
        }
    ];

    const values = [
        {
            icon: '🎯',
            title: 'Accuracy First',
            description: 'We prioritize precision to minimize false alarms while maximizing threat detection.'
        },
        {
            icon: '🚀',
            title: 'Innovation',
            description: 'Continuously improving our AI models with the latest research and technology.'
        },
        {
            icon: '🔒',
            title: 'Privacy & Security',
            description: 'Your data is encrypted and protected with enterprise-level security protocols.'
        },
        {
            icon: '🤝',
            title: 'Partnership',
            description: 'We work closely with clients to understand and meet their unique security needs.'
        }
    ];

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <h1 className="about-hero-title">About Sentinel AI</h1>
                    <p className="about-hero-description">
                        Revolutionizing security through artificial intelligence and behavioral analysis
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="mission-section">
                <div className="mission-content">
                    <div className="mission-text">
                        <h2 className="mission-title">Our Mission</h2>
                        <p className="mission-description">
                            At Sentinel AI, we're on a mission to make the world safer through intelligent
                            surveillance technology. By combining cutting-edge artificial intelligence with
                            behavioral analysis, we help organizations detect and prevent security threats
                            before they escalate.
                        </p>
                        <p className="mission-description">
                            Our advanced machine learning models analyze video feeds in real-time, identifying
                            violent behavior, suspicious activities, and potential threats with unprecedented
                            accuracy. We believe that proactive security is the key to creating safer
                            environments for everyone.
                        </p>
                    </div>
                    <div className="mission-stats">
                        <div className="mission-stat">
                            <div className="mission-stat-number">2026</div>
                            <div className="mission-stat-label">Founded</div>
                        </div>
                        <div className="mission-stat">
                            <div className="mission-stat-number">10+</div>
                            <div className="mission-stat-label">Installations</div>
                        </div>
                        <div className="mission-stat">
                            <div className="mission-stat-number">95%</div>
                            <div className="mission-stat-label">Accuracy Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <div className="section-header">
                    <h2 className="section-title">Our Core Values</h2>
                    <p className="section-description">
                        The principles that guide everything we do
                    </p>
                </div>
                <div className="values-grid">
                    {values.map((value, index) => (
                        <div key={index} className="value-card">
                            <div className="value-icon">{value.icon}</div>
                            <h3 className="value-title">{value.title}</h3>
                            <p className="value-description">{value.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Technology Section */}
            <section className="tech-overview-section">
                <div className="tech-overview-content">
                    <h2 className="tech-overview-title">Powered by Advanced AI</h2>
                    <div className="tech-features-grid">
                        <div className="tech-feature-item">
                            <h3>YOLOv8 Detection</h3>
                            <p>State-of-the-art object detection for identifying humans and tracking movement</p>
                        </div>
                        <div className="tech-feature-item">
                            <h3>CNN Behavioral Analysis</h3>
                            <p>Custom-trained neural networks for violence and aggression detection</p>
                        </div>
                        <div className="tech-feature-item">
                            <h3>Temporal Validation</h3>
                            <p>Multi-frame analysis to eliminate false positives and ensure accuracy</p>
                        </div>
                        <div className="tech-feature-item">
                            <h3>Context Awareness</h3>
                            <p>Spatial and velocity analysis for understanding behavioral context</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <div className="section-header">
                    <h2 className="section-title">What Powers Us</h2>
                    <p className="section-description">
                        The technology and expertise behind Sentinel AI
                    </p>
                </div>
                <div className="team-grid">
                    {team.map((member, index) => (
                        <div key={index} className="team-card">
                            <div className="team-avatar">
                                {member.name.charAt(0)}
                            </div>
                            <h3 className="team-name">{member.name}</h3>
                            <p className="team-role">{member.role}</p>
                            <p className="team-description">{member.description}</p>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default AboutPage;
