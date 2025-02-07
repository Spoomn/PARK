const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Load the appropriate environment file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const app = express();
const port = process.env.PORT || 8080;

async function initializeConfig() {
  if (process.env.NODE_ENV === 'production') {
    // Load secrets from GCP Secret Manager in production
    await loadSecrets();
  } else {
    // In development, local .env variables have been loaded
    console.log("Development environment detected, using local .env variables");
    console.log("✅ Loaded local variables:");
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD); // get rid of this later for security
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_PORT:", process.env.DB_PORT);
  }
}

async function loadSecrets() {
  process.env.DB_USER = await accessSecretVersion("projects/vision-447321/secrets/DB_USER/versions/latest");
  process.env.DB_PASSWORD = await accessSecretVersion("projects/vision-447321/secrets/DB_PASSWORD/versions/latest");
  process.env.DB_HOST = await accessSecretVersion("projects/vision-447321/secrets/DB_HOST/versions/latest");
  // process.env.DB_NAME = await accessSecretVersion("projects/vision-447321/secrets/DB_NAME/versions/latest");
  process.env.DB_NAME = process.env.DB_NAME;
  process.env.DB_PORT = await accessSecretVersion("projects/vision-447321/secrets/DB_PORT/versions/latest");

  console.log("✅ Loaded Secrets:");
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD); // get rid of this later for security
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("DB_PORT:", process.env.DB_PORT);
}

async function accessSecretVersion(secretName) {
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({ name: secretName });
  return version.payload.data.toString('utf8').trim();
}

async function startServer() {
  // Ensure configuration is loaded before starting the server
  await initializeConfig();

  const pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      // In production, use an SSL configuration; otherwise disable SSL
      ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : false,
  });

  app.use(cors());
  app.use(express.json());

  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
    } else {
      console.log('✅ Database connected successfully:', res.rows);
    }
  });

  // API route to get parking lot data
  app.get('/vision', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM parking_lots');
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error fetching parking lots:', error.message);
      res.status(500).send('Server error');
    }
  });

  app.get('/', (req, res) => {
    res.send('Hello from Parking Backend!');
    console.log('Hello from Parking Backend!');
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${port}`);
  });
}

startServer().catch(err => console.error("Initialization error:", err));
