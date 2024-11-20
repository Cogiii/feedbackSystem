const ratingsRequiringComment = ['Bad', 'Average'];
const ratings = document.querySelectorAll('.rating img');
const submitBtn = document.querySelector('.submit-btn');
const feedbackForm = document.querySelector('.feedback-form');
const feedbackRatings = document.querySelector('.feedback-ratings');
const finishForm = document.querySelector('.feedback-respond');
const feedbackComment = document.querySelector('.feedback-comment');
const employeeBtn = document.getElementById('employee-btn');
const studentBtn = document.getElementById('student-btn');
const highschoolBtn = document.getElementById('highschool-btn');
const collegeBtn = document.getElementById('college-btn');

let selectedRating = '';
let comment = "";
let selectedUser = "";
let selectedDepartment = "";

document.addEventListener('DOMContentLoaded', function() {
  ratings.forEach((rating) => {
      rating.addEventListener('click', function() {
          // Reset all rating images to grayscale
          ratings.forEach((img) => img.style.filter = 'grayscale(100%)');
          
          // Remove grayscale filter of the clicked rating (highlight the clicked emoji)
          this.style.filter = 'none';
          
          // Get the rating stored in this variable
          selectedRating = this.name;

          if (ratingsRequiringComment.includes(selectedRating)) {
              feedbackComment.style.display = 'block';
          } else {
              feedbackComment.style.display = 'none';
          }

      });
  });
  
  submitBtn.addEventListener('click', function() {
    if (selectedRating !== '' && selectedUser !== '') {
      feedbackForm.style.opacity = 0;
      finishForm.style.opacity = 1;
      finishForm.style.visibility = 'visible';

      // After 5 seconds, go back to feedback form
      setTimeout(() => {
        feedbackForm.style.opacity = 1;
        finishForm.style.opacity = 0;
        finishForm.style.visibility = 'hidden';
      }, 5000);
      
      comment = feedbackComment.value;
      
      // console.log(selectedRating);

      // Send the data to the server
      fetch('/submit-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            rating: selectedRating, 
            comment: comment,
            user: selectedUser,
            department: selectedDepartment
          })
      })
      .then(response => response.json())
      .then(data => {
        console.log(data.message);
        // Handle server response 
      })
      .catch(error => console.error('Error:', error));

      setTimeout(() => {
        reset()
      }, 4000);
    } else {
      if(selectedRating == '') {
        feedbackRatings.classList.add('shake-fields');
      }

      if(selectedUser == '') {
        employeeBtn.classList.add('shake-fields');
      studentBtn.classList.add('shake-fields');
      }
      
      setTimeout(() => {
        feedbackRatings.classList.remove('shake-fields');
        employeeBtn.classList.remove('shake-fields');
        studentBtn.classList.remove('shake-fields');
      }, 1000);
      
    }
  });

});

function chooseUser(user) {
  if (user == "employee") {
    studentBtn.classList.remove('user-active');
    employeeBtn.classList.add('user-active');
    selectedUser = "employee";
  } else if (user == "student") {
    studentBtn.classList.add('user-active');
    employeeBtn.classList.remove('user-active');
    selectedUser = "student";
  }
}
function chooseDepartment(dept) {
  if (dept == "highschool") {
    collegeBtn.classList.remove('user-active');
    highschoolBtn.classList.add('user-active');
    selectedDepartment = "highschool";
  } else if (dept == "college") {
    collegeBtn.classList.add('user-active');
    highschoolBtn.classList.remove('user-active');
    selectedDepartment = "college";
  }
}

// Reset all inputs and ratings
function reset() {
  selectedRating = '';
  comment = '';
  selectedUser = '';
  selectedDepartment = '';
  feedbackComment.value = '';
  feedbackComment.style.display = 'none';
  ratings.forEach((img) => img.style.filter = 'none');
  studentBtn.classList.remove('user-active');
  employeeBtn.classList.remove('user-active');
  highschoolBtn.classList.remove('user-active');
  collegeBtn.classList.remove('user-active');
}