const express = require('express');

const app = express();
const port = 3000;

//middleware to parse JSON requests
app.use(express.json());

let reports = []; //temp storage

app.post('/reports', (req, res) => {
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

    reports.push(newReport);
    res.status(201).json(newReport);
    console.log('New report added:', newReport);
});

app.get('/reports', (req, res) => {
    res.json(reports);
    console.log('All report(s) sent');
    console.log('Number of reports sent: ', reports.length);

});

//Start server
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});