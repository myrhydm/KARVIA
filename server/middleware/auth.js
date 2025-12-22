/**
 * server/middleware/auth.js
 * JWT authentication middleware.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Ensure the JWT secret is provided via environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined.');
}

/**
 * Middleware to verify a JWT token from the Authorization header.
 *
 * This function checks for a token, verifies it using the JWT_SECRET,
 * and if valid, attaches the user's ID to the request object (`req.user`).
 * This allows protected routes to know which user is making the request.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function in the stack.
 */
module.exports = function(req, res, next) {
    // 1. Get the token from the 'Authorization' header
    const authHeader = req.header('Authorization');

    // 2. Check if the header exists and is correctly formatted (i.e., "Bearer <token>")
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // If not, send a 401 (Unauthorized) response.
        return res.status(401).json({ msg: 'No token or malformed header, authorization denied.' });
    }

    try {
        // 3. Extract the token from the header string
        const token = authHeader.split(' ')[1];

        // 4. Verify the token using the secret key from the environment
        // The `verify` function will throw an error if the token is invalid or expired.
        const decoded = jwt.verify(token, JWT_SECRET);

        // 5. If verification is successful, attach the user payload to the request object.
        // We'll attach a user object with ID so downstream routes can safely access `req.user.id`
        const userId = decoded.user?.id || decoded.userId || decoded.id || null;

        if (!userId) {
            return res.status(401).json({ msg: 'Token does not contain user ID.' });
        }

        // 5.5. Verify that the user actually exists in the database
        User.findById(userId).then(user => {
            if (!user) {
                console.error(`User with ID ${userId} not found in database`);
                return res.status(401).json({ 
                    msg: 'User not found. Please log in again.',
                    code: 'USER_NOT_FOUND'
                });
            }

            req.user = { id: userId, email: user.email };

            // 6. Pass control to the next middleware or the route handler.
            next();
        }).catch(err => {
            console.error('Database error during user validation:', err.message);
            return res.status(500).json({ msg: 'Internal server error during authentication.' });
        });

    } catch (err) {
        // 7. If jwt.verify throws an error, the token is not valid.
        console.error('Token verification failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid.' });
    }
};
