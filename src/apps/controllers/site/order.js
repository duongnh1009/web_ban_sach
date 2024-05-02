const moment = require("moment");
const orderModel = require("../../models/order");
const productModel = require("../../models/product");

const order = (req, res) => {
  res.render("site/order/order");
};

const orderBuy = async (req, res) => {
  const { name, phone, mail, address } = req.body;
  const items = req.session.cart;
  const totalPrice = items.reduce((total, item) => {
    if(item.salePrice>0) {
        return total + item.salePrice*item.qty
    } else {
        return total + item.price*item.qty
    }
  }, 0) 
  const orderList = {
    name,
    phone,
    mail,
    address,
    totalPrice,
    userSiteId: req.session.userSiteId,
    emailSite: req.session.emailSite,
    fullNameSite: req.session.fullNameSite,
    items,
  };

  for (const item of items) {
    const product = await productModel.findById(item.id);
    if (product) {
      product.quantity -= item.qty;
      await product.save();
    }
  }
  
  new orderModel(orderList).save();
  req.session.cart = [];
  res.redirect("/success");
};

const orderUser = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel.find({
    userSiteId,
    status: "Đang chuẩn bị",
  }).sort({_id: -1});
  res.render("site/order/orderUser", { orders, moment });
};

const orderTransport = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel.find({
    userSiteId,
    status: "Đang giao",
  }).sort({_id: -1});
  res.render("site/order/orderTransport", { orders, moment });
};

const orderDelivered = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel.find({
    userSiteId,
    status: "Đã giao",
  }).sort({_id: -1});
  res.render("site/order/orderDelivered", { orders, moment });
};

const orderTrash = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel.findWithDeleted({
    userSiteId,
    deleted: true
  }).sort({_id: -1})
  res.render("site/order/orderTrash", { orders, moment });
};

const orderDetail = async (req, res) => {
  const order = await orderModel.findById(req.params.id);
  res.render("site/order/orderDetail", {order});
}

const remove = async (req, res) => {
  const id = req.params.id;
  const order = await orderModel.findById(id);

  //cap nhat lai so luong khi nguoi dung xoa don hang
  for (const item of order.items) {
    const product = await productModel.findById(item.id);
    if (product) {
      product.quantity += item.qty;
      await product.save();
    }
  }
  await orderModel.delete({_id: id});
  req.flash('success', 'Xóa thành công !');
  res.redirect("/orderUser")
}

const restore = async (req, res) => {
  const id = req.params.id;
  await orderModel.restore({_id: id});
  req.flash('success', 'Mua lại thành công !');
  res.redirect("/orderTrash")
}

const force = async (req, res) => {
  const id = req.params.id;
  await orderModel.deleteOne({_id: id});
  req.flash('success', 'Xóa thành công !');
  res.redirect("/orderTrash")
}

module.exports = {
  order,
  orderBuy,
  orderUser,
  orderTransport,
  orderDelivered,
  orderTrash,
  orderDetail,
  remove,
  restore,
  force
};
