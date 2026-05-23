const express = require('express');
const router = express.Router();
const { createGroup, getGroups, getGroupById, deleteGroup, updateGroup, getGroupCollectionSheet } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createGroup)
  .get(protect, getGroups);

router.route('/:id')
  .get(protect, getGroupById)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);

router.get('/:id/collection-sheet', protect, getGroupCollectionSheet);

module.exports = router;
