const { getUser } = require("../utils/auth");

const checkAuthentication = (req, res, next) => {
    req.user = null;

    const token = req.cookies['z_tk_rj_91RkXz'];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    const user = getUser(token);
    if (!user) {
        return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
};

module.exports = checkAuthentication;
