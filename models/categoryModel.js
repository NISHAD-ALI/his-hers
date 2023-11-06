const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  blocked: {
    type: Number,
    default: 0,
  },
});

const category = mongoose.model("category", categorySchema);
module.exports = category;
