const mongoose = require("mongoose");
const scheduleSchema = new mongoose.Schema({
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  van: { type: mongoose.Schema.Types.ObjectId, ref: "Van", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  departureAt: { type: Date, required: true },
  arrivalAt: { type: Date },
  fare: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Scheduled", "Departed", "Completed", "Cancelled"], default: "Scheduled" }
}, { timestamps: true });
module.exports = mongoose.model("Schedule", scheduleSchema);
