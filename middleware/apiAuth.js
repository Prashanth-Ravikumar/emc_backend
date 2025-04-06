const API_KEY = 'energy-management-2025'; // This should be in environment variables in production

const apiAuthMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    if (!apiKey || apiKey !== API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = apiAuthMiddleware;
