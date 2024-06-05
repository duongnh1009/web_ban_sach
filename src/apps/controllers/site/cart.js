const productModel = require("../../models/product");

const addToCart = async (req, res) => {
  const { id, qty} = req.body;
  let cart = req.session.cart;
  let isProduct = false;
  cart.map((item) => {
    if (item.id === id) {
      item.qty += parseInt(qty);
      isProduct = true;
    }
    return item;
  });
  if (!isProduct) {
    const product = await productModel
      .findById(id)
      .populate({ path: "cat_id" });
    cart.push({
      id,
      name: product.name,
      author: product.author,
      cat_id: product.cat_id.title,
      price: product.price,
      salePrice: product.salePrice,
      img: product.thumbnail,
      qty: parseInt(qty),
      quantity: product.quantity - parseInt(qty),
    });
  }
  req.session.cart = cart;
  res.redirect("/cart");
};

const cart = (req, res) => {
  const cart = req.session.cart;
  res.render("site/cart/cart", { cart });
};

const updateCart = (req, res) => {
  const productId = req.params.productId;
  const newQuantity = parseInt(req.params.newQuantity);

  let updateCart = req.session.cart;
  // Tìm sản phẩm cần cập nhật số lượng
  const productIndex = updateCart.findIndex((item) => item.id === productId);

  updateCart[productIndex].qty = newQuantity;
  req.session.cart = updateCart;

  const totalPrice = updateCart.reduce((total, item) => {
    if (item.salePrice > 0) {
      return total + item.qty * item.salePrice;
    } else {
      return total + item.qty * item.price;
    }
  }, 0);
  res.json({ newQuantity, totalPrice });
};

const removeCart = (req, res) => {
  const { id } = req.params;
  let removeCart = req.session.cart;
  const newCart = removeCart.filter((item) => {
    return item.id != id;
  });
  req.session.cart = newCart;
  res.redirect("/cart");
};

module.exports = {
  addToCart,
  cart,
  updateCart,
  removeCart,
};
