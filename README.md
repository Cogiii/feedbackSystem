# Feedback Rating System

## Project Overview

This is a simple **Feedback Rating System** built with **Node.js**, **Express**, **JavaScript**, **Sockets.io**, and **SQLite**. Users can submit feedback ratings (e.g., Bad, Average, Good) by clicking on rating images (emojis). The submitted rating is sent to the server, which logs the rating to the console and can store it in a SQLite database. The system is designed to be user-friendly and can later be extended with additional features.

### Features:
- Users can click on images (emojis) to submit feedback.
- Ratings are sent to the server via a **POST request**.
- The server logs the received rating and stores it in a SQLite database.
- The interface resets after submission, and users can submit multiple feedbacks.
- Users can display feedback statistics a through the /getfeedbacks route.

---

## Setup Instructions

### Using the prebuilt exe

1. Download the latest binary from this page's releases tab [here](https://github.com/Cogiii/feedbackSystem/releases).
2. Place it in a folder and run it.
3. **Access the Feedback Form**:
    Open your web browser and go to:
    http://localhost:3000/             <- for the main feedback UI
    http://localhost:3000/getfeedbacks <- for the statistics UI

### Building from source

#### Prerequisites

Ensure that you have the following installed on your machine:
- **Node.js** (version 14 or higher)
- **npm** (Node Package Manager, usually comes with Node.js)
- **SQLite**: Make sure SQLite is installed.

#### Steps to Setup the Project

1. **Download the project files**:
   Download the project files and place them in a directory on your machine.

2. **Install Dependencies**:
   Navigate to the project directory and install the required Node.js packages by running:
   ```bash
   npm install

3. **Run the Server**: 
    Start the server using the following command:
    ```bash
    npm start

This will start the Node.js server on port 3000 by default.
The SQLite database is saved in feedback.db.

4. **Access the Feedback Form**:
    Open your web browser and go to:
    http://localhost:3000/

---

## Project Structure

The main project files and directories are structured as follows:
```bash
feedbackSystem
│---.gitignore
│---package-lock.json
│---package.json
│---README.md
│---server.js
└───.github
    │
    └───workflows
        │---release.yml
│
└───public
    │---app.js
    │---getfeedbacks.html
    │---index.html
    │---manifest.json
    │---statistics.js
    │---style.css
    │
    └───images
        └───{Images Files}
```

---

## Technologies Used

- **Node.js**: JavaScript runtime used for building the server-side logic.
- **Express.js**: Web framework for Node.js used to create HTTP routes.
- **Vanilla JavaScript**: Client-side logic for handling user input.
- **SQLite**: Database system for storing user feedback ratings.
- **HTML/CSS**: Frontend structure and styling for the feedback form.
- **Body-parser**: Middleware to handle incoming JSON data in requests.

---

## Author Information
- Keian Mar - [GitHub](https://github.com/7kei)
- Kharl Devera - [GitHub](https://github.com/cogiii)