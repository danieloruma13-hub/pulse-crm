const express = require('express');
app.set('trust proxy', 1);
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { clientUrl, nodeEnv } = require('./config/env');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (nodeEnv === 'development') app.use(morgan('dev'));
app.use(generalLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/deals', require('./routes/dealRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/calendar', require('./routes/eventRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/automations', require('./routes/automationRoutes'));
app.use('/api/social-posts', require('./routes/socialPostRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/chat-history', require('./routes/chatHistoryRoutes'));
// Next modules mount here: leads, deals, tasks, calendar, messages, notifications, analytics, ai, settings
// messages, notifications, analytics, ai, settings

app.use(notFound);
app.use(errorHandler);

module.exports = app;
