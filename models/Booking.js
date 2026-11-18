const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, unique: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
  seats: [{ type: Number, required: true }],
  total: { type: Number, required: true },
  status: { type: String, enum: ["Confirmed", "Cancelled"], default: "Confirmed" }
}, { timestamps: true });
bookingSchema.pre("save", function(next) {
  if (!this.bookingNumber) this.bookingNumber = "VBK-" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
  next();
});
module.exports = mongoose.model("Booking", bookingSchema);
