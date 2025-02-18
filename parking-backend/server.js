const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const isProduction = process.env.NODE_ENV === 'production';

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
  const client = new SecretManagerServiceClient();

  async function getSecret(secretName){
    try{
      const [version] = await client.accessSecretVersion({name: secretName});
      return version.payload.data.toString('utf8').trim();
    } catch (error) {
      console.error(`❌ Error fetching secret ${secretName}:`, error.message);
      return null;
    }
  }

  console.log("🔍 Loading secrets from GCP Secret Manager...");

  process.env.DB_USER = await getSecret("projects/vision-447321/secrets/DB_USER/versions/latest");
  process.env.DB_PASSWORD = await getSecret("projects/vision-447321/secrets/DB_PASSWORD/versions/latest");
  process.env.DB_HOST = await getSecret("projects/vision-447321/secrets/DB_HOST/versions/latest");
  process.env.DB_PORT = await getSecret("projects/vision-447321/secrets/DB_PORT/versions/latest");
  console.log("🔍 Using Database Name:", process.env.DB_NAME);

  console.log("✅ Loaded Secrets:");
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("DB_PORT:", process.env.DB_PORT);
}

let pool; 

async function startServer() {
  await initializeConfig();
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DB_CONNECTION_NAME) {
      console.error("❌ ERROR: DB_CONNECTION_NAME is not defined. Check your app.yaml.");
      process.exit(1);
    }
  }
    const dbSocketPath = `/cloudsql/${process.env.DB_CONNECTION_NAME}`;
  console.log(`🔗 Connecting to database at ${dbSocketPath}`);
  const useSSL = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false;

  pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: isProduction ? dbSocketPath : process.env.DB_HOST,
      port: isProduction ? null: Number(process.env.DB_PORT) || 5432,
      ssl: isProduction ? useSSL : false,
  });

  app.use(cors());
  app.use(express.json());

  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
    } else {
      console.log('✅ Database connected successfully:', res.rows[0].now);
    }
  });

  // API route to get parking lot data
  app.get('/vision', async (req, res) => {
    console.log("📩 Received request at /vision");
  
    try {
      const result = await pool.query('SELECT * FROM parking_lots');
      console.log(`✅ Retrieved ${result.rows.length} rows from parking_lots`);
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error fetching parking lots:', error);
      res.status(500).send('Server error');
    }
  });

  app.get('/', (req, res) => {
    res.send('Hello from Parking Backend!');
    console.log('Hello from Parking Backend!');
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${port} (or GCP App Engine)`);
  });
  
}

startServer().catch(err => console.error("Initialization error:", err));
