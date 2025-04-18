const express = require('express');
const admin = require("firebase-admin");
const cors = require("cors");

const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_CONFIG_BASE64, 'base64').toString('utf-8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore();
const app = express();
app.use(cors());
const port = process.env.PORT;

//middleware to parse JSON requests
app.use(express.json());

let reports = []; //temp storage

app.post('/reports', async (req, res) => {
    console.log('Attempting to add report...');
    try{
        const { latitude, longitude, description } = req.body;

        if (!latitude || !longitude || !description) {
            console.log('All fields are required');
            //print what field was missing
            if (!latitude) {
                console.log('Missing latitude');
            }
            if (!longitude) {
                console.log('Missing longitude');
            }
            if (!description) {
                console.log('Missing description');
            }
            return res.status(400).json({ error: 'All fields are required' });
        
        }

        const newReport = {
        id: reports.length + 1,
        latitude,
        longitude,
        description,
        image,
        timestamp: new Date(),
        };

        reports.push(newReport);

        const docRef = await db.collection('reports').add(newReport);
        res.status(201).json({ id: docRef.id, ...newReport}); 
        console.log('Report added successfully: ', newReport);
    } catch (error) {
        res.status(500).json({ error: "failed to add report" });
        console.error("Error adding report: ", error);
    }

    
});

app.get('/reports', async (req, res) => {

    console.log('Fetching reports...');
    try {
        const snapshot = await db.collection('reports').get();
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(reports);
        console.log('Reports fetched successfully');
    } catch(error) {
        if(!res.headersSent) {
            res.status(500).json({ error: "failed to fetch reports" });
        }
        console.error("Error fetching reports: ", error);
    }

});

//Start server
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});