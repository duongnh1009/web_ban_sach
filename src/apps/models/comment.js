const mongoose = require("../../common/database")();
const commentSchema = mongoose.Schema({
    userSiteId: {
        type: String
    },

    emailSite: {
        type: String
    },

    fullNameSite: {
        type: String
    },

    prd_id: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
    },

    slug: {
        type: String
    },

    content: {
        type: String
    }
}, {
    timestamps: true
})

const commentModel = mongoose.model("Comment", commentSchema, "comments")
module.exports = commentModel;