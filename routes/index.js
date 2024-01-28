var express = require("express");
var router = express.Router();
const passport = require("passport");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Post = require("../models/post");

/* GET home page. */
router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    const posts = await Post.find().populate("username");
    res.render("index", { title: "Home", user: req.user, posts: posts });
  })
);

router.get(
  "/post/:id/delete",
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    res.render("post_delete", {
      title: "Delete Post",
      user: req.user,
      post: post,
    });
  })
);

router.post(
  "/post/:id/delete",
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (post === null) {
      const error = new Error("post not found");
      res.statusCode = 404;
      return next(error);
    }
    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/");
  })
);

router.get("/posts/create", (req, res, next) => {
  res.render("post_create", { title: "Create Post", user: req.user });
});

router.post("/posts/create", [
  body("title", "Title must at least have 4 characters")
    .trim()
    .isLength({ min: 4 })
    .escape(),

  body("message", "message must at least have 7 characters")
    .trim()
    .isLength({ min: 7 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    if (!req.user) return res.redirect("/");
    const errors = validationResult(req);
    console.log(req.user);
    const post = new Post({
      title: req.body.title,
      timestamp: new Date(),
      username: req.user._id,
      text: req.body.message,
    });

    if (!errors.isEmpty()) {
      res.render("post_create", {
        title: "Create Post",
        user: req.user,
        post: post,
        errors: errors.array(),
      });
      return;
    }
    await post.save();
    res.redirect("/");
  }),
]);

router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
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
    (value, { req }) => value === req.body.password
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
  })
);

router.post("/join_club", [
  body("passcode").trim(),

  asyncHandler(async (req, res, next) => {
    if (req.user === undefined) return res.redirect("/");
    const user = await User.findById(req.user._id);

    if (req.body.passcode !== process.env.PASSCODE) {
      res.render("join_club", { title: "Join Club", error: "Wrong code!", user: req.user });
      return;
    }
    await User.findByIdAndUpdate(req.user._id, { $set: { status: "active" } });
    res.redirect("/");
  }),
]);

router.get(
  "/get_admin",
  asyncHandler(async (req, res, next) => {
    res.render("get_admin", { title: "Join Club", user: req.user });
  })
);

router.post("/get_admin", [
  body("admin_code").trim(),

  asyncHandler(async (req, res, next) => {
    if (req.user === undefined) return res.redirect("/");
    const user = await User.findById(req.user._id);

    if (req.body.admin_pass !== process.env.ADMIN_PASS) {
      res.render("get_admin", { title: "Get Admin", error: "Wrong code!" });
      return;
    }
    await User.findByIdAndUpdate(req.user._id, { $set: { admin: "true" } });
    res.redirect("/");
  }),
]);
module.exports = router;
