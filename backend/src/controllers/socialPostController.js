const socialPostModel = require('../models/socialPostModel');
const { generateText } = require('../utils/geminiClient');
const { AppError } = require('../middleware/errorHandler');

async function createPost(req, res, next) {
  try {
    const { platform, content, status, scheduledAt } = req.body;
    if (!platform || !content) throw new AppError('platform and content are required', 400);
    if (!socialPostModel.PLATFORMS.includes(platform)) {
      throw new AppError(`Invalid platform. Must be one of: ${socialPostModel.PLATFORMS.join(', ')}`, 400);
    }
    const post = await socialPostModel.create({ userId: req.user.id, platform, content, status, scheduledAt });
    res.status(201).json({ success: true, post });
  } catch (err) { next(err); }
}

async function listPosts(req, res, next) {
  try {
    const posts = await socialPostModel.findAllByUser(req.user.id);
    res.json({ success: true, posts });
  } catch (err) { next(err); }
}

async function updatePost(req, res, next) {
  try {
    const { platform, content, status, scheduledAt } = req.body;
    const updates = { platform, content, status, scheduledAt };
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    const post = await socialPostModel.updateById(req.params.id, req.user.id, updates);
    if (!post) throw new AppError('Post not found', 404);
    res.json({ success: true, post });
  } catch (err) { next(err); }
}

async function deletePost(req, res, next) {
  try {
    const deleted = await socialPostModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Post not found', 404);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
}

async function generatePostContent(req, res, next) {
  try {
    const { platform, topic } = req.body;
    if (!platform || !topic) throw new AppError('platform and topic are required', 400);

    const platformGuides = {
      facebook: 'conversational, can be longer, encourage comments',
      instagram: 'visual-first caption style, use relevant hashtags at the end, punchy',
      x: 'under 280 characters, punchy and direct',
      linkedin: 'professional tone, thought-leadership style, no excessive emojis',
    };

    const content = await generateText({
      systemInstruction: `You are a social media copywriter. Write a single ${platform} post. Style: ${platformGuides[platform] || 'engaging and clear'}. Return only the post text, no explanations, no quotation marks around it.`,
      prompt: `Write a ${platform} post about: ${topic}`,
      temperature: 0.85,
    });

    res.json({ success: true, content });
  } catch (err) { next(err); }
}

module.exports = { createPost, listPosts, updatePost, deletePost, generatePostContent };
