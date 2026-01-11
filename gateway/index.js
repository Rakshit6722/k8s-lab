const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const POD_NAME = process.env.HOSTNAME || 'gateway-local';

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] [${POD_NAME}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'API Gateway' });
});

// Flow endpoint aggregates downstream info
app.get('/api/flow', async (req, res) => {
  try {
    const [userInfo, projectInfo] = await Promise.all([
      axios.get('http://user-service:3001/info'),
      axios.get('http://project-service:3002/info')
    ]);

    res.status(200).json({
      gateway: {
        service: 'API Gateway',
        pod: process.env.HOSTNAME || 'unknown',
        timestamp: new Date().toISOString()
      },
      downstream: [userInfo.data, projectInfo.data]
    });
  } catch (error) {
    console.error('Error in /flow aggregation:', error.message);
    res.status(500).json({ error: 'Failed to fetch downstream service info' });
  }
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.status(200).json({
    service: 'API Gateway',
    pod: process.env.HOSTNAME || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Proxy /api/users to User Service
app.get('/api/users', async (req, res) => {
  try {
    const response = await axios.get('http://user-service:3001/users');
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling user-service:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const response = await axios.post('http://user-service:3001/users', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling user-service:', error.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Proxy /api/projects to Project Service
app.get('/api/projects', async (req, res) => {
  try {
    const response = await axios.get('http://project-service:3002/projects');
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling project-service:', error.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const response = await axios.post('http://project-service:3002/projects', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling project-service:', error.message);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
