const fs = require("fs");
const path = require("path")
const bannerModel = require("../../models/banner");
const pagination = require("../../../common/pagination");
const index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = page*limit - limit;
    const total = await bannerModel.find()
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;
    const banner = await bannerModel.find()
        .sort({_id: -1})
        .skip(skip)
        .limit(limit)
    const bannerRemove = await bannerModel.countWithDeleted({
        deleted: true
    });
    res.render("admin/banner/banner", {
        banner, 
        bannerRemove,
        page,
        next,
        hasNext,
        prev,
        hasPrev,
        pages: pagination(page, totalPages)
    })
}

const trash = async (req, res) => {
    const banner = await bannerModel.findWithDeleted({
        deleted: true
    }).sort({_id: -1})
    res.render("admin/banner/trash", {banner})
}

const create = (req, res) => {
    res.render("admin/banner/add_banner")
}

const store = (req, res) => {
    const {body, file} = req;
    const banner = {
        category: body.category,
        featured: body.featured=="on",
    }
    if(file) {
        const img_banner = "products/"+file.originalname;
        fs.renameSync(file.path, path.resolve("src/public/images", img_banner));
        banner["img_banner"] = img_banner;
        new bannerModel(banner).save();
        req.flash('success', 'Thêm thành công !');
        res.redirect("/admin/banner");
    }
}

const edit = async (req, res) => {
    const id = req.params.id;
    const banner = await bannerModel.findById(id);
    res.render("admin/banner/edit_banner", {banner})
}

const update = async (req, res) => {
    const id = req.params.id;
    const {body, file} = req;
    const banner = {
        category: body.category,
        featured: body.featured=="on",
    }
    if(file) {
        const img_banner = "products/"+file.originalname;
        fs.renameSync(file.path, path.resolve("src/public/images", img_banner));
        banner["img_banner"] = img_banner;
    }
    await bannerModel.updateOne({_id: id},{$set: banner})
    req.flash('success', 'Cập nhật thành công !');
    res.redirect("/admin/banner");
}

const restore = async (req, res) => {
    const id = req.params.id;
    await bannerModel.restore({_id: id});
    req.flash('success', 'Khôi phục thành công !');
    res.redirect("/admin/banner/trash")
}

const force = async (req, res) => {
    const id = req.params.id;
    await bannerModel.deleteOne({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/banner/trash")
}

const remove = async (req, res) => {
    await bannerModel.delete({_id: req.params.id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/banner")
}

module.exports = {
    index,
    trash,
    create,
    store,
    edit,
    update,
    restore,
    remove,
    force
}
