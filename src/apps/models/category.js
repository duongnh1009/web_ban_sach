const mongoose = require("../../common/database")();
const mongooseDelete = require("mongoose-delete");
const categorySchema = mongoose.Schema({
    title: {
        type: String,
    },

    slug: {
        type: String,
    },
}, {
    timestamps: true 
})

categorySchema.plugin(mongooseDelete, { 
    deletedAt : true,
    overrideMethods: 'all' 
});

const categoryModel = mongoose.model("Category", categorySchema, "categories");
module.exports = categoryModel;
