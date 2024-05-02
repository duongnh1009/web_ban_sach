const moment = require("moment")
const productModel = require("../../models/product")
const commentModel = require("../../models/comment")

const product = async (req, res) => {
    const id = req.params.id;
    const productById = await productModel.findById(id);
    const comments = await commentModel.find({prd_id: id}).sort({_id: -1});

    //hien thi san pham cung danh muc
    const products = await productModel.find({
        quantity: { $gt: 0 },
        cat_id: productById.cat_id,
        _id: {
            $ne: productById.id
        }
    }).limit(8)

    //hien thi san pham cung tac gia
    const authors = await productModel.find({
      quantity: { $gt: 0 },
      author: productById.author,
      _id: {
        $ne: productById.id,
      },
    });
    res.render("site/product/product", {productById, comments, products, authors, moment})
}

module.exports = {
    product
}