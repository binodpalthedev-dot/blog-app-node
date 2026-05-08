// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

exports.authenticate = async (req, res, next) => {
    const adminToken = req.cookies?.adminToken;
    const userToken = req.cookies?.userToken;
    
    const token = adminToken || userToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized!"
        });
    }

    try {
        let verifiedUser;
        
        if (adminToken) {
            verifiedUser = jwt.verify(adminToken, process.env.JWT_SECRET);
            req.admin = verifiedUser;
        } else if (userToken) {
            verifiedUser = jwt.verify(userToken, process.env.JWT_SECRET);
            req.user = verifiedUser;
        }

        if (!verifiedUser) {
            return res.status(401).json({
                success: false,
                message: "Token Mismatched!"
            });
        }

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token!"
        });
    }
};