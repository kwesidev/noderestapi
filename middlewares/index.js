const jwt = require('jsonwebtoken');
const checkAuth = (req, res, next) => {
    const accessToken = req.headers['token'];
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
      
        if (err) {
            res.status(403).json({ message: 'Invalid Token' });
        
        } else {
            req.userId = decoded.userId;
            next();
        }
    });
}
module.exports = {checkAuth};