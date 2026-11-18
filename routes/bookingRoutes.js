const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Schedule = require("../models/Schedule");

router.post("/", requireAuth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.body.scheduleId).populate("van");
    if (!schedule || schedule.status !== "Scheduled" || !schedule.van || schedule.van.status !== "Available") throw new Error("This trip is no longer available.");
    const seats = [...new Set((Array.isArray(req.body.seats) ? req.body.seats : [req.body.seats]).filter(Boolean).map(Number))];
    if (!seats.length || seats.some(n => !Number.isInteger(n) || n < 1 || n > schedule.van.capacity)) throw new Error("Please select valid seat numbers.");
    const existing = await Booking.find({ schedule: schedule._id, status: "Confirmed" });
    const occupied = existing.flatMap(b => b.seats);
    if (seats.some(n => occupied.includes(n))) throw new Error("One or more selected seats have just been booked. Please choose again.");
    const booking = await Booking.create({
      passenger: req.session.user.id, schedule: schedule._id, seats,
      total: seats.length * schedule.fare
    });
    res.redirect(`/bookings/${booking._id}/confirmation`);
  } catch (err) {
    req.session.notice = { type: "error", text: err.message };
    res.redirect(req.body.scheduleId ? `/trips/${req.body.scheduleId}/seats` : "/trips");
  }
});
router.get("/", requireAuth, async (req, res) => {
  const query = req.session.user.role === "admin" ? {} : { passenger: req.session.user.id };
  const bookings = await Booking.find(query).populate("passenger schedule").sort("-createdAt");
  for (const b of bookings) if (b.schedule) await b.schedule.populate("route van");
  res.render("bookings", { title: "Booking Records", bookings });
});
router.get("/:id/confirmation", requireAuth, async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("passenger schedule");
  if (!booking || (req.session.user.role !== "admin" && String(booking.passenger._id) !== req.session.user.id)) return res.redirect("/bookings");
  await booking.schedule.populate("route van");
  res.render("confirmation", { title: "Booking Confirmed", booking });
});
router.post("/:id/cancel", requireAuth, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (booking && (req.session.user.role === "admin" || String(booking.passenger) === req.session.user.id)) {
    booking.status = "Cancelled"; await booking.save();
    req.session.notice = { type: "success", text: "Booking cancelled." };
  }
  res.redirect("/bookings");
});
module.exports = router;
