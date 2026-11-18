const mongoose = require("mongoose");
const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, unique: true, trim: true },
  status: { type: String, enum: ["Available", "Assigned", "Inactive"], default: "Available" }
}, { timestamps: true });
module.exports = mongoose.model("Driver", driverSchema);
