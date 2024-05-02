const mongoose = require("../../common/database")();
const mongooseDelete = require("mongoose-delete");

const purchaseHistorySchema = mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number },
});

const productSchema = mongoose.Schema(
  {
    thumbnail: {
      type: String,
    },

    name: {
      type: String,
    },

    author: {
      type: String,
    },

    translator: {
      type: String,
    },

    description: {
      type: String,
    },

    slug: {
      type: String,
    },

    price: {
      type: Number,
    },

    sale: {
      type: Number,
      default: 0,
    },

    salePrice: {
      type: Number,
    },

    cat_id: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },

    promotion: {
      type: String,
    },

    details: {
      type: String,
    },

    quantity: {
      type: Number,
      default: 0
    },
    purchaseHistory: [purchaseHistorySchema],
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const productModel = mongoose.model("Product", productSchema, "products");
module.exports = productModel;
