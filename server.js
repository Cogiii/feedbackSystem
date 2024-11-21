// To run: type 'npm start' in the command or terminal
// Go to http://localhost:3000/ || {host}/feedback

const { networkInterfaces } = require('os');
const { body, validationResult } = require('express-validator');
const { Server } = require('socket.io');
const { createServer } = require('node:http');

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = createServer(app);
const io = new Server(server);
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
        department TEXT NOT NULL,
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

function unescapeHTML(str) {
    const htmlEntities = {
        nbsp: ' ',
        cent: '¢',
        pound: '£',
        yen: '¥',
        euro: '€',
        copy: '©',
        reg: '®',
        lt: '<',
        gt: '>',
        quot: '"',
        amp: '&',
        apos: '\''
    };

    str = str.replace(/\&([^;]+);/g, function (entity, entityCode) {
        var match;

        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });

    return str.replace(/,/g, '[comma]');
};

async function getFeedbackStats(req, res) {
    const getRows = () => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT user,department,rating,comment,date FROM Feedback`;

            if (req.query.start && req.query.end) {
                sql += ` WHERE date BETWEEN '${req.query.start}' AND '${req.query.end}'`
            }

            if (req.query.department === 'highschool') {
                sql += ` AND department = 'highschool'`;
            } else if (req.query.department === 'college') {
                sql += ` AND department = 'college'`;
            }

            sql += " ORDER BY id DESC";

            console.log(sql)

            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

    try {
        const rows = await getRows();

        let badCount = 0;
        let averageCount = 0;
        let goodCount = 0;
        let employeeFeedback = [];
        let studentFeedback = [];

        rows.forEach((row) => {
            switch (row.rating) {
                case 'Bad':
                    badCount++;
                    break;
                case 'Average':
                    averageCount++;
                    break;
                case 'Good':
                    goodCount++;
                    break;
            }

            const feedbackItem = {
                rating: row.rating,
                comment: row.comment
            };

            if (row.user === 'student') {
                studentFeedback.push(feedbackItem);
            } else if (row.user === 'employee') {
                employeeFeedback.push(feedbackItem);
            }
        });

        // Set Content-Type to 'application/json' for JSON response
        res.setHeader('Content-Type', 'application/json');

        // Send JSON response
        res.json({
            employee_feedback: employeeFeedback,
            student_feedback: studentFeedback,
            bad_count: badCount,
            average_count: averageCount,
            good_count: goodCount
        });
    } catch (err) {
        // Set Content-Type to 'application/json' for error response
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'An error occurred while fetching feedbacks.' });
    }
}

app.use(bodyParser.json());
app.use(`/`, express.static(path.join(__dirname, 'public/')));

// Route to handle the form submission (POST request)
app.post('/submit-rating', body('comment').trim().escape(), (req, res) => {
    const rating = req.body.rating;
    const comment = req.body.comment;
    const user = req.body.user;
    const department = req.body.department;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.send({ errors: result.array() });
    }

    // Log the received rating to the console
    // console.log(`Received user: ${user}`);
    // console.log(`Recieved department: ${department}`);
    // console.log(`Received rating: ${rating}`);
    // console.log(`Received comment: ${comment}`);
    var date = new Date().toISOString();

    let sql = `INSERT INTO Feedback(user, department, rating, comment, date) VALUES('${user}', '${department}', '${rating}', '${comment}', '${date.split('T')[0]}')`;
    console.log(sql);

    db.run(sql, function (err) {
        if (err) {
            return console.error('Error inserting feedback:', err.message);
        }
        console.log('Feedback inserted successfully');
    });

    // Send a response back to the client
    res.json({ message: `Received user: ${user}\nRecieved department: ${department}\nReceived rating: ${rating}\nReceived comment: ${comment}` });
});

app.get('/getfeedbacks', async (req, res) => {
    // Check if the 'Accept' header is set to 'application/json'
    const isJsonRequested = req.get('Content-Type') === 'application/json';

    // If JSON is requested, handle the JSON response
    if (isJsonRequested) {
        return getFeedbackStats(req, res);
    }

    // If JSON is not requested, send the HTML page
    return res.sendFile(path.join(__dirname, 'public/getfeedbacks.html'));
});

io.on('connection', (socket) => {
   socket.on('submit-rating', (arg) => {
    io.emit('submit-rating', true);
   });
});

app.get('/download-csv', async (req, res) => {
    let sql = `SELECT user,department,rating,comment,date FROM Feedback`;

    if (req.query.start && req.query.end) {
        sql += ` WHERE date BETWEEN '${req.query.start}' AND '${req.query.end}'`
    }

    if (req.query.department === 'highschool') {
        sql += ` AND department = 'highschool'`;
    } else if (req.query.department === 'college') {
        sql += ` AND department = 'college'`;
    }

    var stri = new Array();
    stri.push("user,department,rating,comment,date");
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            let string = `${row.user}, ${row.department}, ${row.rating}, ${unescapeHTML(row.comment)}, ${row.date}`;
            stri.push(string);
        });
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
server.listen(PORT, () => {
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