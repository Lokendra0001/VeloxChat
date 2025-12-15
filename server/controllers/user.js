const Users = require('../models/user-model');
const { generateTokenAndSetCookie } = require('../utils/auth');

const handleUserSignUp = async (req, res) => {
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
}


const handleUserSignIn = async (req, res) => {
    try {
        const { loginEmail, loginPassword } = req.body;
        const user = await Users.findOne({ email: loginEmail });
        if (!user) return res.status(409).json({ message: "Something went wrong. Try other Email!" });

        const isMatchedPassword = await user.comparePassword(loginPassword);
        if (!isMatchedPassword) return res.status(401).json({ message: "Invalid Password." });

        generateTokenAndSetCookie(res, user);

        const { password: _, ...userWithoutPassword } = user._doc

        return res.status(200).json({ message: "Login Successfully!", user: userWithoutPassword })

    } catch (error) {
        return res.status(500).send(`Something Went Wrong :  ${error.message}`)

    }
};


const handleUserSignOut = async (req, res) => {
    try {

        res.clearCookie("z_tk_rj_91RkXz", {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        res.status(200).json("Logout Successfully!")
    } catch (error) {
        res.status(500).json(error.message)
    }
}

const handleGetCurrentUser = async (req, res) => {
    console.log(req.user)
    try {
        const userPayload = req.user;
        const user = await Users.findOne({ email: userPayload.email });
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message })

    }
}

const handleGetAllFriends = async (req, res) => {
    try {
        const user = await Users
            .findOne({ email: req.user.email })
            .populate('friends');

        const aiUser = await Users.findOne({ email: "ai@veloxchat.com" });

        const friends = [...user.friends, aiUser];
        res.status(200).json(friends)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const handleUpdateProfile = async (req, res) => {
    try {
        const user = await Users.findOneAndUpdate({ email: req.user.email }, { profilePic: req.file.path }, { new: true })
        res.status(200).json({ user, message: "Profile Updated" })
    } catch (error) {
        res.status(500).json(error.message)
    }
}

const handleGetAllUsers = async (req, res) => {
    try {
        const users = await Users.find({})
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const handleAddFriend = async (req, res) => {
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
};

module.exports = {
    handleUserSignUp,
    handleUserSignIn,
    handleUserSignOut,
    handleGetCurrentUser,
    handleGetAllFriends,
    handleUpdateProfile,
    handleGetAllUsers,
    handleAddFriend
}