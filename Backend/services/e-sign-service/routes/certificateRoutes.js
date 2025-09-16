const express = require("express");
const { issueCertController } = require("../controllers/certificateController");

const router = express.Router();

// POST /api/certificates/issue
router.post("/certificates/issue", issueCertController);

module.exports = router;
