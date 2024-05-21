const userModel = require("../../models/user")
const pagination = require("../../../common/pagination")

const index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = page*limit - limit;
    const total = await userModel.find()
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;
    const users = await userModel.find({
        role: "Member"
    })
    .sort({_id:-1})
    .skip(skip)
    .limit(limit)
    const userRemove = await userModel.countWithDeleted({
        deleted: true
    });
    res.render("admin/users/user", {
        users, 
        userRemove,
        page,
        next,
        hasNext,
        prev,
        hasPrev,
        pages: pagination(page, totalPages)
    })
}

const trash = async (req, res) => {
    const users = await userModel.findWithDeleted({
        deleted: true
    })
    .sort({_id:-1});
    res.render("admin/users/trash", {users})
}

const restore = async (req, res) => {
    const id = req.params.id;
    await userModel.restore({_id: id});
    req.flash('success', 'Khôi phục thành công !');
    res.redirect("/admin/user/trash")
}

const remove = async (req, res) => {
    const id = req.params.id;
    await userModel.delete({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/user")
}

const force = async (req, res) => {
    const id = req.params.id;
    await userModel.deleteOne({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/user/trash")
}

const lockAccount = async(req, res) => {
    const id = req.params.id;
    const user = await userModel.findById(id);
    user.isLocked = true;
    await user.save();
    req.flash('success', 'Đã khóa tài khoản !');
    res.redirect('/admin/user');
}

const unlockAccount = async(req, res) => {
    const id = req.params.id;
    const user = await userModel.findById(id);
    user.isLocked = false;
    await user.save();
    req.flash('success', 'Mở khóa tài khoản thành công !');
    res.redirect('/admin/user');
}

const search = async (req, res) => {
    const keyword = req.query.keyword || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = page*limit - limit;
    const total = await userModel.find({
        $or: [
            { fullName: { $regex: new RegExp(keyword, 'i') } },
            { email: { $regex: new RegExp(keyword, 'i') } },
            { role: { $regex: new RegExp(keyword, 'i') } },
        ],
    })
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;
    const searchUsers = await userModel.find({
        $or: [
            { fullName: { $regex: new RegExp(keyword, 'i') } },
            { email: { $regex: new RegExp(keyword, 'i') } },
            { role: { $regex: new RegExp(keyword, 'i') } },
        ],
    }).skip(skip).limit(limit)
    const userRemove = await userModel.countWithDeleted({
        deleted: true
    });
    res.render("admin/users/search-user", {
        searchUsers, 
        userRemove,
        keyword,
        page,
        next,
        hasNext,
        prev,
        hasPrev,
        pages: pagination(page, totalPages)
    })
}

module.exports = {
    index,
    trash,
    restore,
    remove,
    force,
    lockAccount,
    unlockAccount,
    search
}