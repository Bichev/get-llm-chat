import express from 'express';
import cors from 'cors';
const app = express();
const port = 3005;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Import our API handler (we'll need to transpile TypeScript first)
import parseConversation from './dist/parse-conversation.js';

// Create API route
app.post('/api/parse-conversation', (req, res) => {
  // Convert Express req/res to Vercel-like format
  const vercelReq = {
    ...req,
    body: req.body,
    method: req.method
  };
  
  const vercelRes = {
    status: (code) => ({
      json: (data) => res.status(code).json(data),
      end: () => res.status(code).end()
    }),
    setHeader: (key, value) => res.setHeader(key, value),
    json: (data) => res.json(data)
  };
  
  parseConversation(vercelReq, vercelRes);
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Local server working!', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Local API server running at http://localhost:${port}`);
  console.log(`Test: http://localhost:${port}/api/test`);
}); 