const { genSalt, hash, compare, } = require('bcrypt');
const { Schema, model, default: mongoose } = require('mongoose');

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?w=740"
    },
    isAI: {
        type: Boolean,
        default: false
    },
    bio: {
        type: String,
        default: "Welcome to the VeloxChat here you can edit your chat!"
    },
    status: {
        type: String,
        default: "offline"
    },
    friends: [
        { type: mongoose.Schema.Types.ObjectId, ref: "users" }
    ]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const hashedPass = await hash(this.password, 10);
    this.password = hashedPass;
    next();
})

userSchema.methods.comparePassword = async function (inputPassword) {
    return compare(inputPassword, this.password);
}



const Users = model('users', userSchema);

module.exports = Users;