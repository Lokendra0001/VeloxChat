const { Router } = require('express');
const router = Router();
const checkAuthentication = require('../middleware/auth');
const Group = require('../models/group-model');
const upload = require('../config/cloudinary');

router.post('/createGroup', checkAuthentication, upload.single("groupProfilePic"), async (req, res) => {
    try {
        const { groupName, selectedFriends } = req.body;
        const groupMembers = JSON.parse(selectedFriends); // safely parse

        await Group.create({
            groupName,
            groupProfileImg: req.file.path,
            groupMember: groupMembers,
            createdBy: req.user._id
        });

        res.status(201).json("Group Is Created!")
    } catch (error) {
        res.status(500).json(error.message)
    }
})


router.get('/getAllGroups', checkAuthentication, async (req, res) => {
    try {

        const groups = await Group.find({ groupMember: req.user._id });

        res.status(201).json(groups)
    } catch (error) {
        res.status(500).json(error.message)
    }
})
router.get('/getGroup', async (req, res) => {
    try {
        const groupId = req.headers.groupid;

        const group = await Group.findById(groupId).populate('groupMember');

        const members = group.groupMember.map((member) => ({
            username: member.username,
            profilePic: member.profilePic,
        }));

        console.log("Group ID:", groupId);
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json(error.message);
    }
});


module.exports = router;
