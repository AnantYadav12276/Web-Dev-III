require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Global middleware ----
app.use(express.json({ limit: '100kb' }));

// ---- Routes ----
app.get('/', (req, res) => {
  res.json({ message: 'Inventory API is running' });
});

app.use('/api/products', productRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

// ---- Process-level safety nets ----
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
