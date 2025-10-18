// server.js
import cors from 'cors';

require('dotenv').config(); // Load .env variables

const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(
  cors({
    origin: ['*'],
    credentials: true,
  })
);

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from the Node.js backend!');
});

// Example API endpoint
app.get('/api/users', (req, res) => {
  res.json([{ name: 'Kay' }, { name: 'Alex' }]);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
