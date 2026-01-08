const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/projectsdb';

// MongoDB Project Schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Project Service' });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.status(200).json({
    service: 'Project Service',
    pod: process.env.HOSTNAME || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// GET /projects - Returns all projects from MongoDB
app.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /projects - Save new project to MongoDB
app.post('/projects', async (req, res) => {
  try {
    const newProject = new Project(req.body);
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Project Service running on port ${PORT}`);
});
