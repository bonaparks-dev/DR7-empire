
const { getPool } = require('@netlify/neon');

// Helper to create a standard JSON response
const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
    body: JSON.stringify(body),
  };
};

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // Ensure we have the NETLIFY_DATABASE_URL set
  if (!process.env.NETLIFY_DATABASE_URL) {
    return createResponse(500, { error: 'Database URL not configured.' });
  }

  const { id } = event.queryStringParameters;

  // Validate the ID
  if (!id || isNaN(parseInt(id))) {
    return createResponse(400, { error: 'A valid post ID is required.' });
  }
  
  const postId = parseInt(id);

  try {
    const pool = getPool();
    // Note: You must create this table in your Neon database.
    // CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL);
    // INSERT INTO posts (title, content) VALUES ('My First Post', 'This is the content of my first post.'), ('Another Post', 'This is some more content.');
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);

    if (rows.length === 0) {
      return createResponse(404, { error: `Post with ID ${postId} not found.` });
    }

    return createResponse(200, rows[0]);
  } catch (error) {
    console.error('Database query error:', error);
    return createResponse(500, { error: 'Failed to fetch post from the database.' });
  }
};