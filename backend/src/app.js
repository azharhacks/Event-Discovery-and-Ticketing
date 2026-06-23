require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const mpesaRoutes = require('./routes/mpesa.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const ticketRoutes = require('./routes/ticket.routes');
const userRoutes = require('./routes/user.routes');
const { seedCategories } = require('./utils/seed');

const app = express();

//global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Mombasa Tickets API is running 🎟️' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong. Please try again later.',
  });
});

//start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`✅  Server running on port ${PORT}`);
  await seedCategories();
});

module.exports = app;
