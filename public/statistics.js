const socket = io();

// Function to set today's date as the default value
function setTodayDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD

    // Set the value for both date inputs
    document.getElementById('start-date').value = formattedDate;
    document.getElementById('end-date').value = formattedDate;
}

setTodayDate();

const chartInstances = new Map();

// Function to create a chart
function createChart(chartId, chartType, labels, dataValues, backgroundColors, title) {
    const canvas = document.getElementById(chartId);
    
    // Destroy existing chart if it exists
    if (chartInstances.has(chartId)) {
        chartInstances.get(chartId).destroy();
    }

    // Create new chart
    const newChart = new Chart(canvas, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                backgroundColor: backgroundColors,
                data: dataValues
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: { display: chartType === 'bar' ? false : true },
            title: {
                display: true,
                text: title,
                fontSize: 24
            }
        }
    });

    // Store the chart instance
    chartInstances.set(chartId, newChart);
    
    return newChart;
}

// Function to update table with feedback data
function updateFeedbackTable(data) {
    const table = document.querySelector('.comments-section table');
    // Clear existing rows except header
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    data.feedback_items.forEach(feedback => {
        if (feedback.comment && feedback.comment.trim() !== '') {
            const row = table.insertRow();
            const userCell = row.insertCell(0);
            const commentCell = row.insertCell(1);
            userCell.textContent = (feedback.user == "ntp")? feedback.user.toUpperCase() : feedback.user.charAt(0).toUpperCase() + feedback.user.slice(1); // Capitalize first letter
            commentCell.innerHTML = feedback.comment;
        }
    });
}

// Function to fetch and display feedback stats
function getFeedbackStats() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const department = document.getElementById('department-input').value;

    let url = `/getfeedbacks?department=${department}`;

    if (!startDate || !endDate) {
        alert('Error: Both start and end dates must be provided.');
        setTodayDate();
    } else if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        alert('Error: Invalid date format. Please enter a valid date.');
        setTodayDate();
    } else if (new Date(startDate) > new Date(endDate)) {
        alert('Error: Start date cannot be later than end date.');
        setTodayDate();
    } else {
        url += `&start=${startDate}&end=${endDate}`;
    }
    

    // console.log(url)

    fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log(data)
        // Count users by type
        const ntpCount = data.ntp_feedback_count;
        const facultyCount = data.faculty_feedback_count;
        const studentCount = data.student_feedback_count;
        const visitorCount = data.visitor_feedback_count;
        const totalUsers = ntpCount + studentCount + visitorCount + facultyCount;

        // Create Evaluators Chart
        const evaluatorsLabels = ["NTP", "Faculty", "Student", "Visitor"];
        const evaluatorsData = [ntpCount, facultyCount, studentCount, visitorCount, 0, totalUsers];
        const evaluatorsColors = ["red", "blue", "green", "yellow"];
        createChart("evaluators-chart", "bar", evaluatorsLabels, evaluatorsData, evaluatorsColors, "Evaluators (Users)");

        // Create Ratings Chart
        const ratingsLabels = ["Needs Improvement", "Average", "Good"];
        const ratingsData = [data.bad_count, data.average_count, data.good_count];

        // Calculate percentages
        const totalRatings = ratingsData.reduce((a, b) => a + b, 0);
        const ratingsPercentages = ratingsData.map(value => 
            ((value / totalRatings) * 100).toFixed(2)
        );

        // Create labels with percentages
        const ratingsLabelsWithPercentages = ratingsLabels.map((label, index) => 
            `${label} (${ratingsPercentages[index]}%)`
        );

        const ratingsColors = ["#b91d47", "#00aba9", "#2b5797"];
        createChart("ratings-chart", "pie", ratingsLabelsWithPercentages, ratingsData, ratingsColors, "Ratings");

        // Update the feedback table
        updateFeedbackTable(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load feedback data');
    });
}

function downloadExcel() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const department = document.getElementById('department-input').value;

    let url = `/download-excel?department=${department}`;
    if (startDate && endDate) {
        url += `&start=${startDate}&end=${endDate}`;
    }

    window.location.href = url;
}

document.addEventListener('DOMContentLoaded', function() {
    getFeedbackStats();

    // Add date filter listeners
    document.getElementById('start-date').addEventListener('change', getFeedbackStats);
    document.getElementById('end-date').addEventListener('change', getFeedbackStats);

    // Add department listener
    document.getElementById('department-input').addEventListener('change', getFeedbackStats);

    // Download csv button
    document.querySelector('.download').addEventListener('click', downloadExcel);
});

socket.on('submit-rating', (arg) => {
    getFeedbackStats();
});
