// To run: type 'npm start' in the command or terminal
// Go to http://localhost:3000/ || {host}/feedback

const { networkInterfaces } = require('os');
const { body, validationResult } = require('express-validator');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const { exec, execSync } = require('child_process');

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const util = require('util');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5000;

// Convert exec to Promise-based function
const execPromise = util.promisify(exec);

// Function to check Python and required packages
async function checkPythonDependencies() {
    console.log("Checking Python installation and dependencies...");
    
    try {
        // Check if Python is installed
        try {
            execSync('python --version', { stdio: 'pipe' });
            console.log("Python is installed.");
        } catch (pythonError) {
            try {
                execSync('py -3 --version', { stdio: 'pipe' });
                console.log("Python 3 is installed (using py launcher).");
            } catch (py3Error) {
                console.error("Error: Python is not installed or not in PATH.");
                console.error("Please install Python 3 and try again.");
                process.exit(1);
            }
        }
        
        // Check if required packages are installed
        const requiredPackages = ['pandas', 'openpyxl'];
        const missingPackages = [];
        
        for (const pkg of requiredPackages) {
            try {
                // Use a Python command to check if the package is installed
                const pythonCmd = process.platform === 'win32' ? 'py -3' : 'python';
                execSync(`${pythonCmd} -c "import ${pkg}"`, { stdio: 'pipe' });
                console.log(`Package ${pkg} is installed.`);
            } catch (error) {
                console.log(`Package ${pkg} is missing.`);
                missingPackages.push(pkg);
            }
        }
        
        // If there are missing packages, install them
        if (missingPackages.length > 0) {
            console.log(`Installing missing packages: ${missingPackages.join(', ')}`);
            
            const pythonCmd = process.platform === 'win32' ? 'py -3' : 'python';
            await execPromise(`${pythonCmd} -m pip install ${missingPackages.join(' ')}`);
            
            console.log("All required Python packages are now installed.");
        } else {
            console.log("All required Python packages are already installed.");
        }
        
        return true;
    } catch (error) {
        console.error("Error checking Python dependencies:", error.message);
        process.exit(1);
    }
}

// database
let db = new sqlite3.Database('./feedback.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    // console.log('Connected to the feedback database.');
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

const alterBadToNeedsImprovementSql = `
    UPDATE Feedback
    SET rating = 'Needs Improvement'
    WHERE rating = 'Bad'
    `;

const alterEmployeeToFacultyImprovementSql = `
    UPDATE Feedback
    SET user = 'faculty'
    WHERE user = 'employee'
    `;

db.run(createFeedbackTableSql, function (err) {
    if (err) {
        return console.error('Error creating table:', err.message);
    }
    // console.log('Table created successfully');
});

db.run(alterBadToNeedsImprovementSql, function (err) {
    if (err) {
        return console.error('Error altering table bad to needs improvement:', err.message);
    }
});

db.run(alterEmployeeToFacultyImprovementSql, function (err) {
    if (err) {
        return console.error('Error altering table employee to faculty:', err.message);
    }
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

            // console.log(sql)

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
        let ntpFeedbackCount = 0;
        let facultyFeedbackCount = 0;
        let studentFeedbackCount = 0;
        let visitorFeedbackCount = 0;
        let feedbackItems = [];

        rows.forEach((row) => {
            switch (row.rating) {
                case 'Bad':
                    badCount++;
                    break;
                case 'Needs Improvement':
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
                comment: row.comment,
                user: row.user
            };

            if (row.user === "student") {
                studentFeedbackCount += 1;
            } else if (row.user === "ntp") {
                ntpFeedbackCount += 1;
            } else if (row.user === "faculty" || row.user === "employee") {
                facultyFeedbackCount += 1;
            } else if (row.user === "visitor") {
                visitorFeedbackCount += 1;
            }

            feedbackItems.push(feedbackItem)
        });

        // Set Content-Type to 'application/json' for JSON response
        res.setHeader('Content-Type', 'application/json');

        // Send JSON response
        res.json({
            feedback_items: feedbackItems,
            ntp_feedback_count: ntpFeedbackCount,
            faculty_feedback_count: facultyFeedbackCount,
            visitor_feedback_count: visitorFeedbackCount,
            student_feedback_count: studentFeedbackCount,
            bad_count: badCount, // Needs Improvement or Bad
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
    // console.log(sql);

    db.run(sql, function (err) {
        if (err) {
            return console.error('Error inserting feedback:', err.message);
        }
        // console.log('Feedback inserted successfully');
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

function generateCsvFromSql(params) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT user,department,rating,comment,date FROM Feedback`;
        let conditions = [];
        
        if (params.start && params.end) {
            conditions.push(`date BETWEEN '${params.start}' AND '${params.end}'`);
        }
        
        if (params.department === 'highschool') {
            conditions.push(`department = 'highschool'`);
        } else if (params.department === 'college') {
            conditions.push(`department = 'college'`);
        }
        
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            
            const csvRows = ["user,department,rating,comment,date"];
            
            rows.forEach((row) => {
                let rowString = `${row.user},${row.department},${row.rating},${unescapeHTML(row.comment)},${row.date}`;
                csvRows.push(rowString);
            });
            
            const csvData = csvRows.join('\n');
            resolve(csvData);
        });
    });
}

app.get('/download-csv', async (req, res) => {
    try {
        const csvData = await generateCsvFromSql(req.query);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="feedbacks.csv"');
        res.send(csvData);
    } catch (err) {
        console.error('Error generating CSV:', err);
        res.status(500).send('Error generating CSV file');
    }
});

app.get('/download-excel', async (req, res) => {
    const scriptFilePath = path.join(process.cwd(), 'csv_to_xlsx.py');
    const csvFilePath = path.join(process.cwd(), 'temp_csv_data.csv');
    const excelFilePath = path.join(process.cwd(), 'final_xlsx_data.xlsx');
    
    try {
        // Generate CSV data
        const csvData = await generateCsvFromSql(req.query);
        
        // Save CSV data to a temporary file
        await fs.promises.writeFile(csvFilePath, csvData);
        
        // Execute Python script and wait for it to finish
        const pythonCmd = process.platform === 'win32' ? 'py -3' : 'python';
        await execPromise(`${pythonCmd} ${scriptFilePath}`);

        var date = new Date();
        var dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
                            .toISOString()
                            .split("T")[0];
        
        // Check if Excel file was created
        if (fs.existsSync(excelFilePath)) {
            // Send the Excel file to the user
            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.header('Content-Disposition', `attachment; filename="feedbacks-${dateString}.xlsx"`);
            
            // Stream the file to the response
            const fileStream = fs.createReadStream(excelFilePath);
            fileStream.pipe(res);
            
            // Clean up files after response is sent
            fileStream.on('end', () => {
                cleanupFiles(csvFilePath, excelFilePath);
            });
        } else {
            throw new Error('Excel file was not created');
        }
    } catch (err) {
        console.error('Error generating Excel file:', err);
        
        // Clean up any temporary files
        cleanupFiles(csvFilePath, excelFilePath);
        
        res.status(500).send('Error generating Excel file');
    }
});

// Helper function to clean up temporary files
function cleanupFiles(csvPath, excelPath) {
    // Delete CSV file if it exists
    if (fs.existsSync(csvPath)) {
        fs.unlink(csvPath, (err) => {
            if (err) console.error('Error deleting CSV file:', err);
        });
    }
    
    // Delete Excel file if it exists
    if (fs.existsSync(excelPath)) {
        fs.unlink(excelPath, (err) => {
            if (err) console.error('Error deleting Excel file:', err);
        });
    }
}

// 404 handler: keep this at the end, so it only catches requests that don't match any defined routes
app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404: Resource not found</h1>`);
});

// Check Python dependencies before starting the server
async function startServer() {
    try {
        await checkPythonDependencies();
        
		console.log("");
		
        // Start server only after dependencies are checked
        server.listen(PORT, () => {
            console.log("Server is running on these interfaces:");
            const nets = networkInterfaces();
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
                    if (net.family === familyV4Value && !net.internal) {
                        console.log(`${name}: http://${net.address}:${PORT}/`);
                        console.log(`${name}: http://${net.address}:${PORT}/getfeedbacks`);
                    }
                }
            }
            console.log("");
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

// Start the server with dependency checking
startServer();