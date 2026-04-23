const bcrypt = require('bcryptjs');

const testHash = async () => {
    const hash1 = '$2b$10$k3W9BH9kBxZ4.hBBcrvCRu3aIeARpfso6cifsf9ea1dnCO7/iWDZW';
    const hash2 = '$2b$10$Szi43T1BqZoL4H9TwQKeMupPDqovrvO5W8UmrfYs42/CyJG.IhOFS';
    
    console.log('Testing STOREcam with hash1:', await bcrypt.compare('STOREcam', hash1));
    console.log('Testing admin123 with hash2:', await bcrypt.compare('admin123', hash2));
    console.log('Testing STOREcam with hash2:', await bcrypt.compare('STOREcam', hash2));
};

testHash();
