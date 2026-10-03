const express = require('express');
const router = express.Router();
const socialPostController = require('../controllers/socialPostController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/generate', socialPostController.generatePostContent);
router.post('/', socialPostController.createPost);
router.get('/', socialPostController.listPosts);
router.patch('/:id', socialPostController.updatePost);
router.delete('/:id', socialPostController.deletePost);

module.exports = router;
