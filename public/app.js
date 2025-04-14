const ratingsRequiringComment = ['Needs Improvement', 'Average'];
const ratings = document.querySelectorAll('.rating img');
const submitBtn = document.querySelector('.submit-btn');
const feedbackForm = document.querySelector('.feedback-form');
const feedbackRatings = document.querySelector('.feedback-ratings');
const finishForm = document.querySelector('.feedback-respond');
const feedbackComment = document.querySelector('.feedback-comment');
const highschoolBtn = document.getElementById('highschool-btn');
const collegeBtn = document.getElementById('college-btn');
const content = document.querySelector('.content-wrapper');
const divChooseDepartment = document.querySelector('.chooseDepartment');

const socket = io();

let selectedRating = '';
let comment = "";
let selectedUser = "";
let selectedDepartment = getSelectedDepartmentFromCookie() || "";

const userButtons = {
  ntp: document.getElementById("ntp-btn"),
  faculty: document.getElementById("faculty-btn"),
  student: document.getElementById("student-btn"),
  visitor: document.getElementById("visitor-btn")
};

// Function to update the time
function updateTime() {
  const now = new Date();
  
  // Get hours, minutes, seconds
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, '0') : '12';
  
  const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = months[now.getMonth()];
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  
  const dateString = `${month} ${day}, ${year}`;
  
  document.querySelector('.time p').innerText = `${dateString} ${timeString}`;
}

document.addEventListener('DOMContentLoaded', function() {
  if (selectedDepartment == "" || selectedDepartment == null) {
    content.style.display = "none";
    divChooseDepartment.style.display = "block";
  } else {
    content.style.display = "block";
    divChooseDepartment.style.display = "none";
  }
  document.getElementById("department").value = selectedDepartment;

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
    if (selectedRating !== '' && selectedUser !== '' && selectedDepartment !== '') {
      comment = feedbackComment.value;
      
      console.log(selectedUser);

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
        // console.log(data.message);

        feedbackForm.style.opacity = 0;
        finishForm.style.opacity = 1;
        finishForm.style.visibility = 'visible';
        submitBtn.disabled = true;

        // After 5 seconds, go back to feedback form
        setTimeout(() => {
          feedbackForm.style.opacity = 1;
          finishForm.style.opacity = 0;
          finishForm.style.visibility = 'hidden';
          submitBtn.disabled = false;
        }, 5000);
        // Handle server response 
        socket.emit('submit-rating', true);
      })
      .catch(error => {
        console.error('Error:', error)
        alert(`Error: ${error}`)
      });

      setTimeout(() => {
        reset()
      }, 4000);
    } else {
      // console.log('Please fill in all fields.');

      if(selectedRating == '') {
        feedbackRatings.classList.add('shake-fields');
      }

      if(selectedUser == '') {
        for (let key in userButtons) {
          if (userButtons.hasOwnProperty(key)) {
            userButtons[key].classList.add('shake-fields');
          }
        }
      }
      
      setTimeout(() => {
        for (let key in userButtons) {
          if (userButtons.hasOwnProperty(key)) {
            userButtons[key].classList.remove('shake-fields');
          }
        }
      }, 1000);
      
    }
  });

  updateTime();
  setInterval(updateTime, 1000);
});

function resetUser() {
  // Reset button states and divs
  for (let key in userButtons) {
    if (userButtons.hasOwnProperty(key)) {
      userButtons[key].classList.remove('user-active');
    }
  }
}

function chooseUser(user) {
  resetUser();

  // Set active button and display appropriate div
  userButtons[user].classList.add('user-active');

  selectedUser = user;
}

function chooseDepartment(department) {
  selectedDepartment = department;

  // Save selectedDepartment to a cookie
  document.cookie = "selectedDepartment=" + encodeURIComponent(department) + "; path=/; max-age=" + (60 * 60 * 24 * 30);

  content.style.display = "block";
  divChooseDepartment.style.display = "none";
}

function getSelectedDepartmentFromCookie() {
  const cookies = document.cookie.split("; ");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].split("=");
    if (cookie[0] === "selectedDepartment") {
      return decodeURIComponent(cookie[1]);
    }
  }
  return null; // Returns null if the cookie is not found
}


// Reset all inputs and ratings
function reset() {
  selectedRating = '';
  comment = '';
  selectedUser = '';
  feedbackComment.value = '';
  feedbackComment.style.display = 'none';
  ratings.forEach((img) => img.style.filter = 'none');
  resetUser();
}


