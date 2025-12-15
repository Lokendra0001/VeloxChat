const { Router } = require('express')
const checkAuthentication = require('../middleware/auth');
const upload = require('../config/cloudinary');
const { handleUserSignIn, handleUserSignUp, handleUserSignOut, handleGetCurrentUser, handleGetAllFriends, handleUpdateProfile, handleAddFriend, handleGetAllUsers } = require('../controllers/user');
const router = Router();


router.post('/signup', handleUserSignUp)

router.post('/signin', handleUserSignIn)

router.get('/signout', handleUserSignOut)

router.get("/getAllUsers", handleGetAllUsers)

router.get('/getCurrentUser', checkAuthentication, handleGetCurrentUser)

router.patch('/addFriend', checkAuthentication, handleAddFriend);


router.get("/getAllFriends", checkAuthentication, handleGetAllFriends)


router.patch('/updateProfilePic', checkAuthentication, upload.single("profilePic"), handleUpdateProfile)


module.exports = router;