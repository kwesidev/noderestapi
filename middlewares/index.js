const jwt = require('jsonwebtoken');
const UserService = require('../services/UserService');
/**
 * Function to check if User is logged In
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
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
/**
 * Function to check Admin access
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const hasAdminAccess = async (req, res, next) => {
    let result = await UserService.get(req.userId);
    if (result.roleType == 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({ success: false, message: "You don't have permission to access this resource" });
    }
}
module.exports = { checkAuth, hasAdminAccess };