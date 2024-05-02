const userModel = require("../../models/user");
const productModel = require("../../models/product");

const index = async (req, res) => {
    const users = (await userModel.find({
        role: "Member"
    })).length;
    const products = (await productModel.find()).length;
    res.render("admin/dashboard", {users, products})
}
module.exports = {
    index
}