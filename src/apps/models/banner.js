const mongoose = require("../../common/database")();
const mongooseDelete = require("mongoose-delete");
const bannerSchema = mongoose.Schema({
    img_banner: {
        type: String,
    },

    featured: {
        type: Boolean,
        default: false  
    },

    category: {
        type: String,
        default: 'Slider'
    }

}, {
    timestamps: true
})

bannerSchema.plugin(mongooseDelete, { 
    deletedAt : true,
    overrideMethods: 'all' 
});

const bannerModel = mongoose.model("Banner", bannerSchema, "banner");
module.exports = bannerModel;