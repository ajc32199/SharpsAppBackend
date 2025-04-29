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
app.patch('/reports/:id', async (req, res) => {
  const { image, reportStatus } = req.body;
  const updates = {};

  if (image         !== undefined) updates.image        = image;
  if (reportStatus  !== undefined) updates.reportStatus = reportStatus;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ error: 'No valid fields provided to update' });
  }

  try {
    const reportRef = db.collection('reports').doc(req.params.id);

    // ... (you can still check existence if you like)

    await reportRef.update(updates);

    const updated = await reportRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

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

app.patch('/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { photoUrl, status } = req.body; 
    
    console.log(`Updating report ${id}...`);
  
    try {
      const reportRef = db.collection('reports').doc(id);
  
      const reportSnapshot = await reportRef.get();
      if (!reportSnapshot.exists) {
        if (!res.headersSent) {
          res.status(404).json({ error: 'Report not found' });
        }
        console.error(`Report ${id} not found`);
        return;
      }
  
      await reportRef.update({
        ...(photoUrl && { photoUrl }),
        ...(status && { status })
      });
  
      const updatedSnapshot = await reportRef.get();
      const updatedReport = { id: updatedSnapshot.id, ...updatedSnapshot.data() };
  
      res.json(updatedReport);
      console.log(`Report ${id} updated successfully`);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to update report' });
      }
      console.error(`Error updating report ${id}:`, error);
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
