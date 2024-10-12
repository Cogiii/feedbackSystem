// To run: type 'npm start' in the command or terminal
// Go to http://localhost:3000/feedback || {host}/feedback

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// const mysql = require('mysql');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(`/feedback`, express.static(path.join(__dirname, 'public')));

// Route to handle the form submission (POST request)
app.post('/submit-rating', (req, res) => {
    const rating = req.body.rating;
    
    // Log the received rating to the console
    console.log(`Received rating: ${rating}`);

    // Send a response back to the client
    res.json({ message: `Received rating: ${rating}` });
});

// 404 handler: keep this at the end, so it only catches requests that don’t match any defined routes
app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404: Resource not found</h1>`);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

