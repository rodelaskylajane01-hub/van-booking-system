const mongoose = require("mongoose");
const vanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  capacity: { type: Number, required: true, min: 1, default: 14 },
  status: { type: String, enum: ["Available", "Maintenance", "Inactive"], default: "Available" }
}, { timestamps: true });
module.exports = mongoose.model("Van", vanSchema);
