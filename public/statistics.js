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

// Data for Evaluators Chart
const evaluatorsLabels = ["Employee", "Student"];
const evaluatorsData = [155, 149, 0, 299]; // Employee, student, {starting from 0}, {get the max which is the count of the users}
const evaluatorsColors = ["red", "blue"];
createChart("evaluators-chart", "bar", evaluatorsLabels, evaluatorsData, evaluatorsColors, "Evaluators (Users)");

// Data for Ratings Chart
const ratingsLabels = ["Bad", "Average", "Good"];
const ratingsData = [55, 49, 144];

// Calculate the total and convert to percentages
const totalRatings = ratingsData.reduce((a, b) => a + b, 0);
const ratingsPercentages = ratingsData.map(value => ((value / totalRatings) * 100).toFixed(2)); // toFixed(2) for 2 decimal places

// Create new labels with percentages
const ratingsLabelsWithPercentages = ratingsLabels.map((label, index) => `${label} (${ratingsPercentages[index]}%)`);

const ratingsColors = ["#b91d47", "#00aba9", "#2b5797"];
createChart("ratings-chart", "pie", ratingsLabelsWithPercentages, ratingsData, ratingsColors, "Ratings");
