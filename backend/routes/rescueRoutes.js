const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getRescues,
  getRescue,
  createRescue,
  updateRescue,
  deleteRescue
} = require('../controllers/rescueController');

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.route('/')
  .get(getRescues)
  .post(upload.single('image'), createRescue);

router.route('/:id')
  .get(getRescue)
  .put(upload.single('image'), updateRescue)
  .delete(deleteRescue);

module.exports = router;
