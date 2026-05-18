// routes/visionRoutes.js (신규)
const express = require("express");
const router = express.Router();
const visionController = require("../controllers/vision");
const visionController2 = require("../controllers/visionController");

router.get("/my", visionController.getMy); // ✅ [GET] /api/visions/my
router.get("/myVisions", visionController.getMyVisions);
router.get("/", visionController2.getAll);

module.exports = router;
