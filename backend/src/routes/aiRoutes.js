const express = require('express');
const {
  getAIAdvice,
  getHistory,
  getHistoryById,
  renameHistory,
  deleteHistoryById,
  clearHistory
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');


const router = express.Router();

// AI Advice
router.post('/advice', protect, getAIAdvice);

// Conversation History
router.get('/history', protect, getHistory);
router.delete('/history', protect, clearHistory);
router.get('/history/:id', protect, getHistoryById);
router.put('/history/:id', protect, renameHistory);
router.delete('/history/:id', protect, deleteHistoryById);

module.exports = router;
