const mongoose = require("../../common/database")();
const mongooseDelete = require("mongoose-delete");
const userSchema = mongoose.Schema({
    email: {
        type: String,
    },

    password: {
        type: String,
    },

    fullName: {
        type: String,
    },

    role: {
        type: String,
        default: "Member"
    },

    resetPasswordToken: {
        type: String
    },

    resetPasswordExpires: {
        type: Date
    },

    isLocked: { 
        type: Boolean, 
        default: false 
    },    
}, {
    timestamps: true
});

userSchema.plugin(mongooseDelete, { 
    deletedAt : true,
    overrideMethods: 'all' 
});

const userModel = mongoose.model("Users", userSchema, "users");
module.exports = userModel
