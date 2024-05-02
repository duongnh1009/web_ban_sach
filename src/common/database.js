const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
module.exports = () => {
    mongoose.connect(process.env.DB);
    return mongoose;
}