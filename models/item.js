const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    original_url: {
        type: String,
        required: true,
    },
    short_url: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
