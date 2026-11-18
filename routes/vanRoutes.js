const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const Route = require("../models/Route");
const Schedule = require("../models/Schedule");
const Booking = require("../models/Booking");

router.get("/", requireAuth, async (req, res) => {
  const { from, to, date } = req.query;
  const filter = { status: "Scheduled", departureAt: { $gte: new Date() } };
  if (from) filter._id = { $exists: true };
  let schedules = await Schedule.find(filter).populate("route van driver").sort("departureAt");
  schedules = schedules.filter(s => s.route && s.van && s.route.active && s.van.status === "Available");
  if (from) schedules = schedules.filter(s => s.route.origin === from);
  if (to) schedules = schedules.filter(s => s.route.destination === to);
  if (date) schedules = schedules.filter(s => s.departureAt.toISOString().slice(0,10) === date);
  const routes = await Route.find({ active: true }).sort("origin destination");
  const bookingDocs = await Booking.find({ status: "Confirmed" });
  const bookedBySchedule = {};
  bookingDocs.forEach(b => {
    const key = String(b.schedule);
    bookedBySchedule[key] = (bookedBySchedule[key] || []).concat(b.seats);
  });
  res.render("trips", { title: "Search Van Trips", schedules, routes, bookedBySchedule, filters: { from, to, date } });
});
router.get("/:id/seats", requireAuth, async (req, res) => {
  const schedule = await Schedule.findById(req.params.id).populate("route van driver");
  if (!schedule) return res.redirect("/trips");
  const bookings = await Booking.find({ schedule: schedule._id, status: "Confirmed" });
  const occupied = bookings.flatMap(b => b.seats);
  res.render("seats", { title: "Select Seats", schedule, occupied });
});
module.exports = router;
