// index.js
require('dotenv').config();            // only needed if you run locally with a .env file
const express = require('express');
const admin   = require('firebase-admin');
const cors    = require('cors');

// 1) Guard against missing env var
if (!process.env.FIREBASE_CONFIG_BASE64) {
  console.error('❌  Missing FIREBASE_CONFIG_BASE64 environment variable!');
  process.exit(1);
}

// 2) Decode & parse the service account JSON
let serviceAccount;
try {
  const raw = Buffer
    .from(process.env.FIREBASE_CONFIG_BASE64, 'base64')
    .toString('utf-8');
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error('❌  Invalid FIREBASE_CONFIG_BASE64:', err.message);
  process.exit(1);
}

// 3) Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db  = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

let reports = []; // in-memory cache

app.post('/reports', async (req, res) => {
  console.log('Attempting to add report…');
  try {
    const { latitude, longitude, description, image, reportStatus } = req.body;

    if (!latitude || !longitude || !description) {
      console.log('All fields are required');
      if (!latitude)   console.log('Missing latitude');
      if (!longitude)  console.log('Missing longitude');
      if (!description)console.log('Missing description');
      return res.status(400).json({ error: 'latitude, longitude, description are required' });
    }

    const newReport = {
      id:            reports.length + 1,
      latitude,
      longitude,
      description,
      image:         image || null,
      reportStatus:  reportStatus || 'pending',
      timestamp:     new Date(),
    };

    reports.push(newReport);
    const docRef = await db.collection('reports').add(newReport);

    console.log('Report added successfully:', newReport);
    res.status(201).json({ id: docRef.id, ...newReport });
  } catch (error) {
    console.error('Error adding report:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'failed to add report' });
    }
  }
});

app.get('/reports', async (req, res) => {
  console.log('Fetching reports…');
  try {
    const snapshot = await db.collection('reports').get();
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Reports fetched successfully');
    res.json(all);
  } catch (error) {
    console.error('Error fetching reports:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'failed to fetch reports' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
