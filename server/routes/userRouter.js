const Users = require('../models/user-model');
const { Router } = require('express')
const { generateTokenAndSetCookie } = require('../utils/auth');
const checkAuthentication = require('../middleware/auth');
const upload = require('../config/cloudinary')
const router = Router();


router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const isUser = await Users.findOne({ email });
        if (isUser) return res.status(409).json({ message: "User Already there. please Login!" })

        const user = await Users.create({ username, email, password });

        if (user) generateTokenAndSetCookie(res, user);
        const { password: _, ...userWithoutPassword } = user._doc


        return res.status(201).json({ message: "User Created Successfully!", user: userWithoutPassword })
    } catch (error) {
        return res.status(500).send(`Something Went Wrong :  ${error.message}`)
    }
})

router.post('/signin', async (req, res) => {
    try {
        const { loginEmail, loginPassword } = req.body;
        const user = await Users.findOne({ email: loginEmail });
        if (!user) return res.status(409).json({ message: "Something went wrong. Try other Email!" });

        const isMatchedPassword = await user.comparePassword(loginPassword);
        if (!isMatchedPassword) return res.status(401).json({ message: "Invalid Password." });

        res.cookie('z_tk_rj_91RkXz', {
            httpOnly: true,      // ✅ protect from client-side JS
            secure: false,       // ❌ don't enforce HTTPS in dev
            sameSite: "lax",     // ✅ allows form submissions & most CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        generateTokenAndSetCookie(res, user);

        const { password: _, ...userWithoutPassword } = user._doc

        return res.status(200).json({ message: "Login Successfully!", user: userWithoutPassword })

    } catch (error) {
        return res.status(500).send(`Something Went Wrong :  ${error.message}`)

    }
})

router.get('/signout', async (req, res) => {
    try {

        res.clearCookie("z_tk_rj_91RkXz", {
            httpOnly: true,      // ✅ protect from client-side JS
            secure: false,       // ❌ don't enforce HTTPS in dev
            sameSite: "lax",     // ✅ allows form submissions & most CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        res.status(200).json("Logout Successfully!")
    } catch (error) {
        res.status(500).json(error.message)
    }
})

router.get("/getAllUsers", async (req, res) => {
    try {
        const users = await Users.find({})
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/getCurrentUser', checkAuthentication, async (req, res) => {
    console.log(req.user)
    try {
        const userPayload = req.user;
        const user = await Users.findOne({ email: userPayload.email });
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message })

    }
})

router.patch('/addFriend', checkAuthentication, async (req, res) => {
    try {
        const { friendId } = req.body;
        const user = await Users.findOne({ email: req.user.email });
        const friend = await Users.findById(friendId);

        if (!user.friends.includes(friendId)) {
            user.friends.push(friendId);
            await user.save();
        }

        if (!friend.friends.includes(user._id)) {
            friend.friends.push(user._id);
            await friend.save();
        }

        return res.status(200).json({ message: "Friend added successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get("/getAllFriends", checkAuthentication, async (req, res) => {
    try {
        const friends = await Users.findOne({ email: req.user.email }).populate('friends')
        res.status(200).json(friends)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})


router.patch('/updateProfilePic', checkAuthentication, upload.single("profilePic"), async (req, res) => {
    try {
        const user = await Users.findOneAndUpdate({ email: req.user.email }, { profilePic: req.file.path })
        console.log(user)
        res.status(200).json("Profile Updated")
    } catch (error) {
        res.status(500).json(error.message)
    }
})


module.exports = router;