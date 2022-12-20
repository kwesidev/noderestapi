const jwt = require('jsonwebtoken');
const checkAuth = (req, res, next) => {
    const accessToken = req.headers['token'];
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
        req.userId = decoded.userId;
        if (err) {
            res.status(403).json({ message: 'Invalid Token' });
        
        } else {
            next();
        }
    });
}
module.exports = {checkAuth};