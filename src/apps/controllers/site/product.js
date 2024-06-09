const moment = require("moment")
const productModel = require("../../models/product")
const orderModel = require("../../models/order");
const commentModel = require("../../models/comment")

const product = async (req, res) => {
    const id = req.params.id;
    const productById = await productModel.findById(id);
    const comments = await commentModel.find({prd_id: id}).sort({_id: -1});

    //hien thi san pham cung danh muc
    const productByCatId = await productModel.find({
        quantity: { $gt: 0 },
        cat_id: productById.cat_id,
        _id: {
          $ne: productById.id
        }
    }).limit(8);

    //hien thi san pham cung tac gia
    const authors = await productModel.find({
      quantity: { $gt: 0 },
      author: productById.author,
      _id: {
        $ne: productById.id,
      },
    }).limit(8);
    
    //hien thi so luong ban cua san pham
    const orders = await orderModel.aggregate([
      {
        $match: {
          status: "Đã giao hàng", // Chỉ lấy các đơn hàng đã giao
        },
      },
      {
        $unwind: "$items", // Tách mỗi mục hàng thành một document riêng biệt
      },
      {
        $group: {
          _id: {
            productName: "$items.name", // Nhóm theo tên sản phẩm
          },
          totalQuantity: { $sum: "$items.qty" }, // Tính tổng số lượng đã bán
          productName: { $first: "$items.name" }, // Giữ lại tên sản phẩm
        },
      },
    ]);
    res.render("site/product/product", {productById, comments, productByCatId, authors, orders, moment});
}

module.exports = {
    product
}