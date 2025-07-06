const jwt = require('jsonwebtoken')

const secretKey = process.env.JWT_SECRET;

const generateTokenAndSetCookie = (res, user) => {
    const payload = {
        username: user.username,
        email: user.email,
    }
    const token = jwt.sign(payload, secretKey);

    res.cookie('z_tk_rj_91RkXz', token, {
        httpOnly: true,      // ✅ protect from client-side JS
        secure: false,       // ❌ don't enforce HTTPS in dev
        sameSite: "lax",     // ✅ allows form submissions & most CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
}

const getUser = (token) => {
    return jwt.verify(token, secretKey);
}

module.exports = {
    generateTokenAndSetCookie,
    getUser
}