require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Route = require("./models/Route");
const Van = require("./models/Van");
const Driver = require("./models/Driver");
const Schedule = require("./models/Schedule");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-session-secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/van_booking_sibuyan"
  }),
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.notice = req.session.notice || null;
  delete req.session.notice;
  next();
});

app.use("/", require("./routes/authRoutes"));
app.use("/trips", require("./routes/vanRoutes"));
app.use("/bookings", require("./routes/bookingRoutes"));
app.use("/admin", require("./routes/adminRoutes"));

app.get("/", (req, res) => {
  if (req.session.user) return res.redirect(req.session.user.role === "admin" ? "/admin" : "/trips");
  res.render("index", { title: "VanBooking | Travel Safe, Ride Together" });
});

app.use((req, res) => res.status(404).render("error", { title: "Page not found", message: "The page you requested does not exist." }));

async function seedDatabase() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@vanbooking.local").toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin12345!", 12);
    await User.create({
      fullName: process.env.ADMIN_NAME || "System Administrator",
      email: adminEmail, phone: "0000000000", password, role: "admin"
    });
    console.log(`Admin account created: ${adminEmail}`);
  }

  if (await Route.countDocuments() === 0) {
    await Route.insertMany([
      { origin: "Cajidiocan", destination: "San Andres", fare: 120, distance: "Local route", active: true },
      { origin: "Cajidiocan", destination: "Magdiwang", fare: 150, distance: "Local route", active: true },
      { origin: "Cajidiocan", destination: "San Fernando", fare: 180, distance: "Local route", active: true },
      { origin: "Cajidiocan", destination: "Azagra", fare: 100, distance: "Local route", active: true },
      { origin: "Magdiwang", destination: "San Fernando", fare: 130, distance: "Local route", active: true }
    ]);
  }
  if (await Van.countDocuments() === 0) {
    await Van.create({ plateNumber: "SIB-001", name: "Sibuyan Express", capacity: 24, status: "Available" });
    await Van.create({ plateNumber: "SIB-002", name: "Island Shuttle", capacity: 18, status: "Available" });
  }
}
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/van_booking_sibuyan")
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedDatabase();
    app.listen(PORT, () => console.log(`VanBooking running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Check that MongoDB is running and MONGODB_URI in .env is correct.");
    process.exit(1);
  });
