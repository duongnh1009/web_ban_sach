const mongoose = require("../../common/database")();
const mongooseDelete = require("mongoose-delete");
const orderSchema = mongoose.Schema({
    userSiteId: {
        type: String
    },

    emailSite: {
        type: String
    },

    fullNameSite: {
        type: String
    },

    name: {
        type: String,
        text: true
    },

    phone: {
        type: String,
    },

    mail: {
        type: String,
    },

    address: {
        type: String
    },

    status: {
        type: String,
        default: "Đang chuẩn bị",
    },

    totalPrice: {
        type: Number
    },

    items: {
        type: Object
    },
}, {
    timestamps: true
})

orderSchema.plugin(mongooseDelete, { 
    deletedAt : true,
    overrideMethods: 'all' 
});

const orderModel = mongoose.model("Order", orderSchema, "order");
module.exports = orderModel;