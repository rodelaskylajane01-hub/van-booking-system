const router = require("express").Router();
const { requireAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Route = require("../models/Route");
const Van = require("../models/Van");
const Driver = require("../models/Driver");
const Schedule = require("../models/Schedule");
const Booking = require("../models/Booking");

router.use(requireAdmin);
router.get("/", async (req, res) => {
  const [passengers, vans, routes, schedules, bookings, confirmed] = await Promise.all([
    User.countDocuments({ role: "passenger" }), Van.countDocuments(), Route.countDocuments(),
    Schedule.countDocuments(), Booking.countDocuments(), Booking.countDocuments({ status: "Confirmed" })
  ]);
  const recent = await Booking.find().populate("passenger schedule").sort("-createdAt").limit(8);
  for (const b of recent) if (b.schedule) await b.schedule.populate("route");
  res.render("admin/dashboard", { title: "Administrator Dashboard", stats: { passengers, vans, routes, schedules, bookings, confirmed }, recent });
});
router.get("/records", async (req,res) => {
  const [bookings, passengers, vans, schedules, available, occupied] = await Promise.all([
    Booking.countDocuments(), User.countDocuments({role:"passenger"}), Van.countDocuments(),
    Schedule.countDocuments(), Schedule.countDocuments({status:"Scheduled"}), Booking.countDocuments({status:"Confirmed"})
  ]);
  res.render("admin/records", { title:"Database Records", stats:{bookings,passengers,vans,schedules,available,occupied} });
});

router.get("/routes", async (req,res) => res.render("admin/routes", {title:"Manage Routes", items:await Route.find().sort("origin")}));
router.post("/routes", async (req,res) => { try { await Route.create({origin:req.body.origin,destination:req.body.destination,fare:Number(req.body.fare),distance:req.body.distance}); req.session.notice={type:"success",text:"Route added."}; } catch(e){req.session.notice={type:"error",text:e.message};} res.redirect("/admin/routes"); });
router.post("/routes/:id/update", async (req,res) => { await Route.findByIdAndUpdate(req.params.id,{origin:req.body.origin,destination:req.body.destination,fare:Number(req.body.fare),distance:req.body.distance,active:req.body.active==="on"}); req.session.notice={type:"success",text:"Route updated."}; res.redirect("/admin/routes"); });
router.post("/routes/:id/delete", async (req,res) => { await Route.findByIdAndDelete(req.params.id); req.session.notice={type:"success",text:"Route deleted."}; res.redirect("/admin/routes"); });

router.get("/vans", async (req,res) => res.render("admin/vans",{title:"Manage Vans",items:await Van.find().sort("name")}));
router.post("/vans", async (req,res) => { try{await Van.create({name:req.body.name,plateNumber:req.body.plateNumber,capacity:Number(req.body.capacity),status:req.body.status});req.session.notice={type:"success",text:"Van added."};}catch(e){req.session.notice={type:"error",text:e.message};}res.redirect("/admin/vans"); });
router.post("/vans/:id/update", async (req,res) => { await Van.findByIdAndUpdate(req.params.id,{name:req.body.name,plateNumber:req.body.plateNumber,capacity:Number(req.body.capacity),status:req.body.status}); req.session.notice={type:"success",text:"Van updated."};res.redirect("/admin/vans"); });
router.post("/vans/:id/delete", async (req,res) => { await Van.findByIdAndDelete(req.params.id);req.session.notice={type:"success",text:"Van deleted."};res.redirect("/admin/vans"); });

router.get("/drivers", async (req,res) => res.render("admin/drivers",{title:"Manage Drivers",items:await Driver.find().sort("fullName")}));
router.post("/drivers", async (req,res) => { try{await Driver.create({fullName:req.body.fullName,phone:req.body.phone,licenseNumber:req.body.licenseNumber,status:req.body.status});req.session.notice={type:"success",text:"Driver added."};}catch(e){req.session.notice={type:"error",text:e.message};}res.redirect("/admin/drivers"); });
router.post("/drivers/:id/update", async (req,res) => { await Driver.findByIdAndUpdate(req.params.id,{fullName:req.body.fullName,phone:req.body.phone,licenseNumber:req.body.licenseNumber,status:req.body.status});req.session.notice={type:"success",text:"Driver updated."};res.redirect("/admin/drivers"); });
router.post("/drivers/:id/delete", async (req,res) => { await Driver.findByIdAndDelete(req.params.id);req.session.notice={type:"success",text:"Driver deleted."};res.redirect("/admin/drivers"); });

router.get("/schedules", async (req,res) => {
  const [items,routes,vans,drivers] = await Promise.all([
    Schedule.find().populate("route van driver").sort("-departureAt"), Route.find({active:true}), Van.find({status:"Available"}), Driver.find({status:{$ne:"Inactive"}})
  ]);
  res.render("admin/schedules",{title:"Departure Schedules",items,routes,vans,drivers});
});
router.post("/schedules", async (req,res) => { try{await Schedule.create({route:req.body.route,van:req.body.van,driver:req.body.driver||undefined,departureAt:new Date(req.body.departureAt),arrivalAt:req.body.arrivalAt?new Date(req.body.arrivalAt):undefined,fare:Number(req.body.fare)});req.session.notice={type:"success",text:"Departure schedule created."};}catch(e){req.session.notice={type:"error",text:e.message};}res.redirect("/admin/schedules"); });
router.post("/schedules/:id/update", async (req,res) => { await Schedule.findByIdAndUpdate(req.params.id,{departureAt:new Date(req.body.departureAt),fare:Number(req.body.fare),status:req.body.status});req.session.notice={type:"success",text:"Schedule updated."};res.redirect("/admin/schedules"); });
router.post("/schedules/:id/delete", async (req,res) => { await Schedule.findByIdAndDelete(req.params.id);req.session.notice={type:"success",text:"Schedule deleted."};res.redirect("/admin/schedules"); });

router.get("/passengers", async (req,res) => res.render("admin/passengers",{title:"Passenger Records",items:await User.find({role:"passenger"}).sort("-createdAt")}));
router.get("/reports", async (req,res) => {
  const bookings=await Booking.find().populate("passenger schedule").sort("-createdAt");
  for(const b of bookings) if(b.schedule) await b.schedule.populate("route");
  const revenue=bookings.filter(b=>b.status==="Confirmed").reduce((sum,b)=>sum+b.total,0);
  res.render("admin/reports",{title:"Booking Reports",bookings,revenue});
});
router.get("/bookings", async (req,res) => {
  const bookings=await Booking.find().populate("passenger schedule").sort("-createdAt");
  for(const b of bookings) if(b.schedule) await b.schedule.populate("route van");
  res.render("bookings",{title:"All Passenger Bookings",bookings});
});
module.exports = router;
