const mongoose = require("mongoose");
const routeSchema = new mongoose.Schema({
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  fare: { type: Number, required: true, min: 0 },
  distance: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model("Route", routeSchema);
