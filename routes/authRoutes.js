const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/login", (req, res) => res.render("login", { title: "Login | VanBooking" }));
router.get("/register", (req, res) => res.render("register", { title: "Create account | VanBooking" }));

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;
    if (!fullName || !email || !phone || !password) throw new Error("Please complete all required fields.");
    if (password.length < 6) throw new Error("Password must contain at least 6 characters.");
    if (password !== confirmPassword) throw new Error("Passwords do not match.");
    if (await User.findOne({ email: email.toLowerCase() })) throw new Error("An account with this email already exists.");
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ fullName, email, phone, password: hash });
    req.session.user = { id: user._id, fullName: user.fullName, email: user.email, role: user.role };
    req.session.notice = { type: "success", text: "Your passenger account has been created." };
    res.redirect("/trips");
  } catch (err) {
    req.session.notice = { type: "error", text: err.message };
    res.redirect("/register");
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: (req.body.email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) throw new Error("Invalid email or password.");
    req.session.user = { id: user._id, fullName: user.fullName, email: user.email, role: user.role };
    res.redirect(user.role === "admin" ? "/admin" : "/trips");
  } catch (err) {
    req.session.notice = { type: "error", text: err.message };
    res.redirect("/login");
  }
});
router.post("/logout", requireAuth, (req, res) => req.session.destroy(() => res.redirect("/")));
router.get("/profile", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render("profile", { title: "My Profile", user });
});
router.post("/profile", requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.session.user.id, { fullName: req.body.fullName, phone: req.body.phone });
    req.session.user.fullName = req.body.fullName;
    req.session.notice = { type: "success", text: "Profile updated successfully." };
  } catch (e) { req.session.notice = { type: "error", text: e.message }; }
  res.redirect("/profile");
});
module.exports = router;
