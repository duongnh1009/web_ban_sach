const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");
const productModel = require("../../models/product")

const home = async (req, res) => {
    const categories = await categoryModel.find();
    const productsByCategory = {};
    for (const category of categories) {
        const products = await productModel.find({ 
            quantity: { $gt: 0 },
            cat_id: category._id,
        }).limit(8).sort({_id: -1});

        // Chỉ thêm vào danh sách nếu danh mục có ít nhất một sản phẩm
        if (products.length > 0) {
          productsByCategory[category.title] = products;
        }
    }
    const orders = await orderModel.aggregate([
        {
          $match: {
            status: "Đã giao", // Chỉ lấy các đơn hàng đã giao
          },
        },
        {
          $unwind: "$items", // Tách mỗi mục hàng thành một document riêng biệt
        },
        {
          $group: {
            _id: {
              productName: "$items.name", // Nhóm theo tên sản phẩm1
            },
            totalQuantity: { $sum: "$items.qty" }, // Tính tổng số lượng đã bán
            productName: { $first: "$items.name" }, // Giữ lại tên sản phẩm
          },
        },
    ]);
    res.render("site/home/index", {productsByCategory, orders})
}

module.exports = {
    home
}