exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.notice = { type: "error", text: "Please log in to continue." };
    return res.redirect("/login");
  }
  next();
};
exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    req.session.notice = { type: "error", text: "Administrator access is required." };
    return res.redirect("/login");
  }
  next();
};
