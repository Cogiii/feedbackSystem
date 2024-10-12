// To run: type 'npm start' in the command or terminal
// Go to http://localhost:3000/ || {host}/feedback

const { networkInterfaces } = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const app = express();
const PORT = process.env.PORT || 3000;

// database
let db = new sqlite3.Database('./feedback.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the feedback database.');
});

const createFeedbackTableSql = `
    CREATE TABLE IF NOT EXISTS Feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        rating TEXT NOT NULL,
        comment TEXT,
        date TEXT NOT NULL
    )`;

db.run(createFeedbackTableSql, function (err) {
    if (err) {
        return console.error('Error creating table:', err.message);
    }
    console.log('Table created successfully');
});

app.use(bodyParser.json());
app.use(`/`, express.static('./public/'));

// Route to handle the form submission (POST request)
app.post('/submit-rating', body('comment').trim().escape(), (req, res) => {
    const rating = req.body.rating;
    const comment = req.body.comment;
    const user = req.body.user;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.send({ errors: result.array() });
    }

    // Log the received rating to the console
    console.log(`Received rating: ${rating}`);
    console.log(`Received comment: ${comment}`);
    console.log(`Received user: ${user}`);
    var date = new Date().toISOString();

    let sql = `INSERT INTO Feedback(user, rating, comment, date) VALUES('${user}', '${rating}', '${comment}', '${date.split('T')[0]}')`;
    console.log(sql);

    db.run(sql, function (err) {
        if (err) {
            return console.error('Error inserting feedback:', err.message);
        }
        console.log('Feedback inserted successfully');
    });

    // Send a response back to the client
    res.json({ message: `Received rating: ${rating}\nReceived comment: ${comment}` });
});

app.get('/getfeedbacks', async (req, res) => {
    let sql = `SELECT * FROM Feedback`;
    var stri = new Array();
    stri.push("id, user, rating, comment, date");

    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            let string = `${row.id}, ${row.user}, ${row.rating}, ${row.comment}, ${row.date}`;
            stri.push(string);
        });
        res.send(`<p>${stri.join("<br>")}</p>`);
    });
});

// 404 handler: keep this at the end, so it only catches requests that don’t match any defined routes
app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404: Resource not found</h1>`);
});

// Start server
app.listen(PORT, () => {
    console.log("Server is running on these interfaces:");
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                console.log(`${name}: http://${net.address}:${PORT}/`);
            }
        }
    }
    console.log("");
});