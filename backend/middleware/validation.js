const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// Validation rules for user registration
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),

    validate
];

// Validation rules for login
const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    validate
];

// Validation rules for alert creation
const validateAlertCreation = [
    body('videoName')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Video name must be less than 200 characters'),

    body('behavior')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Behavior description must be less than 500 characters'),

    body('riskLevel')
        .optional()
        .isIn(['Low', 'Medium', 'High'])
        .withMessage('Risk level must be Low, Medium, or High'),

    body('location.lat')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),

    body('location.lon')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),

    validate
];

// Validation rules for alert status update
const validateAlertUpdate = [
    param('id')
        .trim()
        .notEmpty()
        .withMessage('Alert ID is required'),

    body('status')
        .isIn(['Pending', 'Investigating', 'Verified', 'Reported', 'Resolved', 'False Alarm'])
        .withMessage('Invalid status value'),

    validate
];

// Validation rules for adding notes
const validateAddNote = [
    param('id')
        .trim()
        .notEmpty()
        .withMessage('Alert ID is required'),

    body('note')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Note must be between 1 and 1000 characters'),

    body('user')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('User name must be less than 100 characters'),

    validate
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateAlertUpdate,
    validateAddNote,
    validate
};
