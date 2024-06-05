const commentModel = require("../../models/comment");

const comment = async(req, res) => {
    const prd_id = req.params.id;
    const slug = req.params.slug;
    const {content} = req.body;
    const userSiteId = req.session.userSiteId;
    const emailSite = req.session.emailSite;
    const fullNameSite = req.session.fullNameSite;
    const comment = {
        prd_id,
        slug,
        userSiteId,
        emailSite,
        fullNameSite,
        content
    }
    await commentModel.create(comment);
    res.redirect(req.path);
}

const editComment = async(req, res) => {
    const commentId = req.params.id;
    const comment = await commentModel.findById(commentId)
    res.render("site/product/editComment", {comment})
}

const updateComment = async(req, res) => {
    const commentId = req.params.id;
    const {updateContent} = req.body;
    const comment = await commentModel.findByIdAndUpdate(commentId, { content: updateContent });
    res.redirect(`/product-${comment.slug}.${comment.prd_id}`);
}

const removeComment = async(req, res) => {
    const id = req.params.id;
    const comment = await commentModel.findById(id);
    await comment.remove();
    res.redirect(`/product-${comment.slug}.${comment.prd_id}`)
}

module.exports = {
    comment,
    editComment,
    updateComment,
    removeComment
}