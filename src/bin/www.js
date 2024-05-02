const dotenv = require("dotenv");
const app = require('../apps/app');

dotenv.config();
const {PORT} = process.env;

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})