const commentModel = require("../../models/comment");

const index = async(req, res) => {
    const comments = await commentModel.find().sort({_id:-1}).populate("prd_id")
    res.render("admin/comment/comment", {
        comments
    })
}

const remove = async (req, res) => {
    const id = req.params.id;
    await commentModel.deleteOne({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/comment")
}

module.exports = {
    index,
    remove
}