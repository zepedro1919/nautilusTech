const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // Get token from HttpOnly cookie

    if (!token) {
        return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden - Invalid token" });
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;