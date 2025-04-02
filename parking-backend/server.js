import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const version = process.env.VERSION || '1.0.0';
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const app = express();
const port = process.env.PORT || 8080;
console.log(`Starting server on port: ${port}`);

// Initialize GCS
const storageConfig = {};
if (process.env.NODE_ENV !== 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  storageConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
const storage = new Storage(storageConfig);


const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

async function initializeConfig() {
  if (process.env.NODE_ENV === 'production') {
    // Load secrets from GCP Secret Manager in production
    await loadSecrets();
  } else {
    // In development, local .env variables have been loaded
    console.log("Development environment detected, using local .env variables");
    console.log("✅ Loaded local variables:");
    console.log("DB_USER:", process.env.DB_USER);
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

  if (!isProduction) {
    // Development: allow all origins
    app.use(cors());
    console.log("🌱 CORS: Development mode - allowing all origins.");
  } else {
    
    // Production: restrict to specific frontend origin
    app.use(cors({
      origin: 'https://vision-447321.web.app',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));
    console.log("🔒 CORS: Production mode - allowing only official frontend.");
  }
  

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

  // API route to upload a photo to GCS
  app.post('/upload_photo', upload.single('image'), async (req, res) => {
    try {
      const lotName = req.body.lotName;
      if (!req.file || !lotName) {
        return res.status(400).json({ error: 'Missing image or lotName parameter' });
      }
  
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
      const gcsFilename = `${lotName}/${timestamp}_${req.file.originalname}`;
      const metadata = {
        contentType: req.file.mimetype,
        metadata: {
          "lot-name": lotName
        }
      };
            
      const bucket = storage.bucket(process.env.BUCKET_NAME);
      const blob = bucket.file(gcsFilename);
  
      const stream = blob.createWriteStream({
        metadata
      });
      
  
      stream.on('error', err => {
        console.error('GCS Stream Error:', err);
        if (!res.headersSent){
          res.status(500).json({ error: 'Failed to upload to GCS' });
        }
      });
  
      stream.on('finish', async () => {
        try {
          try {
            await blob.makePublic();
          } catch (err) {
            console.warn("⚠️ Warning: Could not make file public. Proceeding without error.");
          }
          
          if (!res.headersSent){
          res.status(200).json({
            message: 'Upload successful',
            url: `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${gcsFilename}`,
          });
        }
          res.end();
        } catch (err) {
          console.error("❌ Response Error:", err);
          if (!res.headersSent){
            res.status(500).json({ error: "Failed to finalize upload response." });
          }
        }
      });
      stream.end(req.file.buffer);
    } catch (error) {
      console.error('Upload Endpoint Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });
  
  app.get('/', (req, res) => {
    res.send(`Hello from Parking Backend version ${process.env.VERSION}`);
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${port} (or GCP App Engine)`);
  });
  
}

startServer().catch(err => console.error("Initialization error:", err));
