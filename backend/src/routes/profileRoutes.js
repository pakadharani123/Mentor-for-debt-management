const express = require('express');
const { createProfile, getProfile, updateProfile } = require('../controllers/profileController');
const { profileValidator } = require('../validators/profileValidator');
const { validate } = require('../middleware/validatorMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All profile routes are protected

router.post('/', profileValidator, validate, createProfile);
router.get('/', getProfile);
router.put('/', profileValidator, validate, updateProfile);

module.exports = router;
