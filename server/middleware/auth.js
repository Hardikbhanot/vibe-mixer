import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

export const authenticateToken = (req, res, next) => {
    let token = req.cookies.auth_token;

    // Check Authorization Header (Bearer Token)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, email }
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
