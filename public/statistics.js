// Function to set today's date as the default value
function setTodayDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD

    // Set the value for both date inputs
    document.getElementById('start-date').value = formattedDate;
    document.getElementById('end-date').value = formattedDate;
}

setTodayDate();

// Function to create a chart
function createChart(chartId, chartType, labels, dataValues, backgroundColors, title) {
    new Chart(chartId, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                backgroundColor: backgroundColors,
                data: dataValues
            }]
        },
        options: {
            responsive: true, // Make the chart responsive
            maintainAspectRatio: false, // Allow the height to change
            legend: { display: chartType === 'bar' ? false : true },
            title: {
                display: true,
                text: title,
                fontSize: 24
            }
        }
    });
}

// Function to update table with feedback data
function updateFeedbackTable(data) {
    const table = document.querySelector('.comments-section table');
    // Clear existing rows except header
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    data.employee_feedback.forEach(feedback => {
        if (feedback.comment && feedback.comment.trim() !== '') {
            const row = table.insertRow();
            const userCell = row.insertCell(0);
            const commentCell = row.insertCell(1);
            userCell.textContent = 'Employee';
            commentCell.textContent = feedback.comment;
        }
    });

    data.student_feedback.forEach(feedback => {
        if (feedback.comment && feedback.comment.trim() !== '') {
            const row = table.insertRow();
            const userCell = row.insertCell(0);
            const commentCell = row.insertCell(1);
            userCell.textContent = 'Student';
            commentCell.textContent = feedback.comment;
        }
    });
}

// Function to fetch and display feedback stats
function getFeedbackStats() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const department = document.getElementById('department-input').value;

    let url = `/getfeedbacks?department=${department}`;

    if (startDate && endDate) {
        url += `&start=${startDate}&end=${endDate}`;
    }

    console.log(url)

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
        // Count users by type
        const employeeCount = data.employee_feedback.length;
        const studentCount = data.student_feedback.length;
        const totalUsers = employeeCount + studentCount;

        // Create Evaluators Chart
        const evaluatorsLabels = ["Employee", "Student"];
        const evaluatorsData = [employeeCount, studentCount, 0, totalUsers];
        const evaluatorsColors = ["red", "blue"];
        createChart("evaluators-chart", "bar", evaluatorsLabels, evaluatorsData, evaluatorsColors, "Evaluators (Users)");

        // Create Ratings Chart
        const ratingsLabels = ["Bad", "Average", "Good"];
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

function downloadCSV() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let url = '/download-csv';
    if (startDate && endDate) {
        url += `?start=${startDate}&end=${endDate}`;
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
    document.querySelector('.download').addEventListener('click', downloadCSV);
});