// routes/interest.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/interest");
const { isLoggedIn } = require("../middleware/auth");
const interestController = require("../controllers/interestController");

router.get("/", interestController.getAll);

router.get("/", isLoggedIn, ctrl.getCategories);

// [GET] /api/interests/categories
router.get("/categories", isLoggedIn, ctrl.getCategories);

// [GET] /api/interests/list/:categoryCode
router.get("/list/:categoryCode", isLoggedIn, ctrl.getList);

// [GET] /api/interests/my
router.get("/my", isLoggedIn, ctrl.getMy);

// [GET] /api/interests/myInterests
router.get("/myInterests", isLoggedIn, ctrl.getMyInterests);

// [POST] /api/interests/my
router.post("/my", isLoggedIn, ctrl.saveMy);

module.exports = router;
