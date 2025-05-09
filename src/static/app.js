document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Add delete functionality for participants
  function addDeleteFunctionality() {
    document.querySelectorAll(".delete-participant").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const participantEmail = event.target.dataset.email;
        const activityName = event.target.dataset.activity;

        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participantEmail)}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok) {
            event.target.parentElement.remove();
          } else {
            console.error("Failed to unregister participant");
          }
        } catch (error) {
          console.error("Error unregistering participant:", error);
        }
      });
    });
  }

  // Function to update the participant list dynamically
  function updateParticipantList(activityName, participants) {
    const activityCard = document.querySelector(`.activity-card h4:contains('${activityName}')`).parentElement;
    const participantsList = participants
      .map(
        (participant) =>
          `<li>${participant} <button class='delete-participant' data-email='${participant}' data-activity='${activityName}'>❌</button></li>`
      )
      .join("");

    const participantsContainer = activityCard.querySelector(".participants ul");
    participantsContainer.innerHTML = participantsList || "<li>No participants yet</li>";
    addDeleteFunctionality();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsList = details.participants
          .map(
            (participant) =>
              `<li>${participant} <button class='delete-participant' data-email='${participant}' data-activity='${name}'>❌</button></li>`
          )
          .join("");

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <ul>${participantsList || "<li>No participants yet</li>"}</ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      addDeleteFunctionality();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Modify the signup form submission to update the participant list dynamically
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const activityName = formData.get("activity");
    const email = formData.get("email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const updatedActivity = await response.json();
        updateParticipantList(activityName, updatedActivity.participants);
        messageDiv.textContent = "Successfully registered!";
        messageDiv.className = "message success";
      } else {
        messageDiv.textContent = "Failed to register.";
        messageDiv.className = "message error";
      }
    } catch (error) {
      console.error("Error registering participant:", error);
      messageDiv.textContent = "An error occurred.";
      messageDiv.className = "message error";
    }
  });

  // Initialize app
  fetchActivities();
});
