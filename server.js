// To run: type 'npm start' in the command or terminal
// Go to http://localhost:3000/ || {host}/feedback

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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
app.use(`/`, express.static(path.join(__dirname, 'public')));

// Route to handle the form submission (POST request)
app.post('/submit-rating', (req, res) => {
    const rating = req.body.rating;
    const comment = req.body.comment;

    // Log the received rating to the console
    console.log(`Received rating: ${rating}`);
    console.log(`Received comment: ${comment}`);
    var date = new Date().toISOString();

    let sql = 'INSERT INTO Feedback(rating, comment, date) VALUES(\''+rating+'\', \''+comment+'\', \''+date+'\')';
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
    stri.push("rating,comment,date");

    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            let string = `${row.rating}, ${row.comment}, ${row.date}`;
            stri.push(string);
        });

        console.log(stri);
        const csvData = stri.join('\n');
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="feedbacks.csv"');
        res.send(csvData);
    });
});

// 404 handler: keep this at the end, so it only catches requests that don’t match any defined routes
app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404: Resource not found</h1>`);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});

