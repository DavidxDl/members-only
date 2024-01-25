var express = require("express");
var router = express.Router();
const passport = require("passport");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log(req.user?.status);
  res.render("index", { title: "Express", user: req.user });
});

router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  }),
);

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

router.get("/sign-up", (req, res, next) => {
  res.render("sign-up", { title: "Sign up" });
});

router.post("/sign-up", [
  body("username", "username must at least have 5 characters")
    .trim()
    .isLength({ min: 5 })
    .escape(),

  body("name", "username must at least have 2 characters")
    .trim()
    .isLength({ min: 2 })
    .escape(),

  body("last_name", "username must at least have 2 characters")
    .trim()
    .isLength({ min: 2 })
    .escape(),

  body("password", "password must at least have 8 characters")
    .trim()
    .isLength({ min: 8 })
    .escape(),

  body("confirm_password", "Passwords dont match").custom(
    (value, { req }) => value === req.body.password,
  ),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const userValues = {
      name: req.body.name,
      last_name: req.body.last_name,
      username: req.body.username,
      password: req.body.password,
      confirm_password: req.body.confirm_password,
      status: "inactive",
    };

    if (!errors.isEmpty()) {
      res.render("sign-up", {
        title: "Sign up",
        user: userValues,
        errors: errors.array(),
      });
      return;
    }
    try {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) throw err;
        const user = new User({ ...userValues, password: hashedPassword });
        await user.save();
        res.redirect("/");
      });
    } catch (err) {
      return next(err);
    }
  }),
]);

router.get(
  "/join_club",
  asyncHandler(async (req, res, next) => {
    res.render("join_club", { title: "Join Club", user: req.user });
  }),
);

router.post("/join_club", [
  body("passcode").trim(),

  asyncHandler(async (req, res, next) => {
    if (req.user === undefined) return res.redirect("/");
    const user = await User.findById(req.user._id);

    if (req.body.passcode !== process.env.PASSCODE) {
      res.render("join_club", { title: "Join Club", error: "Wrong code!" });
      return;
    }
    await User.findByIdAndUpdate(req.user._id, { $set: { status: "active" } });
    res.redirect("/");
  }),
]);

module.exports = router;
