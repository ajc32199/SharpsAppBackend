const express = require('express');
const admin = require("firebase-admin");
const cors = require("cors");


admin.initializeApp({
    credential: admin.credential.applicationDefault()
})

const db = admin.firestore();
const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

//middleware to parse JSON requests
app.use(express.json());

let reports = []; //temp storage

app.post('/reports', async (req, res) => {
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
        timestamp: new Date(),
        };

        const docRef = await db.collection('reports').add(newReport);
        res.status(201).json({ id: docRef.id, ...newReport}); 
    } catch (error) {
        res.status(500).json({ error: "failed to add report" });
        console.error("Error adding report: ", error);
    }

    
});

app.get('/reports', async (req, res) => {

    res.send('Fetching reports...');
    try {
        const snapshot = await db.collection('reports').get();
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(reports);
        console.log('reports fetched successfully');
    } catch(error) {
        console.error("Error fetching reports: ", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }

});

//Start server
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});