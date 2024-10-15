import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqE7hRr5WWffIWvewbqjaSIa13xICwYXk",
  authDomain: "life-project-id.firebaseapp.com",
  projectId: "life-project-id",
  storageBucket: "life-project-id.appspot.com",
  messagingSenderId: "130068015450",
  appId: "1:130068015450:web:708fc3f159bb1211f82b63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  
  return `${day}-${month}-${year}`;
}

// Set default start date and ETA to today and 2 days from today respectively
const startDateInput = document.getElementById("startDate");
const today = new Date().toISOString().split('T')[0];
startDateInput.value = today;

const etaInput = document.getElementById("taskETA");
const FiveDaysFromNow = new Date();
FiveDaysFromNow.setDate(FiveDaysFromNow.getDate() + 7);
etaInput.value = FiveDaysFromNow.toISOString().split('T')[0];

document.getElementById("priority").addEventListener("change", (e) => {
  const selectedPriority = e.target.value;
  let newETA = new Date();
  
  switch (selectedPriority) {
    case "Critical":
      newETA.setDate(newETA.getDate() + 2);
      break;
    case "High":
      newETA.setDate(newETA.getDate() + 5);
      break;
    case "Medium":
      newETA.setDate(newETA.getDate() + 7);
      break;
    case "Low":
      newETA.setDate(newETA.getDate() + 10);
      break;
    default:
      newETA.setDate(newETA.getDate() + 7); // Default to 7 days if none selected
      break;
  }

  document.getElementById("taskETA").value = newETA.toISOString().split('T')[0];
});



// Form submission handling
document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const taskCategory = document.getElementById("taskCategory").value;
  const taskName = document.getElementById("taskName").value;
  const priority = document.getElementById("priority").value;
  const startDate = document.getElementById("startDate").value;
  const taskETA = document.getElementById("taskETA").value;

  try {
    // Save the task to Firestore or your database
    await addDoc(collection(db, "tasks"), {
      category: taskCategory,
      name: taskName,
      priority: priority,
      startDate: startDate,
      eta: taskETA
    });

    alert(`Task "${taskName}" added successfully!`);

    // Reset the form fields after saving the task
    document.getElementById("task-form").reset();

    // Reset the dropdown to their default values
    document.getElementById("taskCategory").selectedIndex = 0; // <Select Category>
    document.getElementById("priority").value = "Medium"; // Default priority to Medium

    // Keep the Start Date and ETA as default values
    startDateInput.value = today;
    etaInput.value = FiveDaysFromNow.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error saving task: ", error);
  }
});

// Show tasks button handling
document.getElementById("show-tasks-button").addEventListener("click", () => {
  const taskSections = document.getElementById("task-list");
  taskSections.style.display = "block";
  document.getElementById("show-tasks-button").style.display = "none";
  document.getElementById("hide-tasks-button").style.display = "inline";
});

// Hide tasks button handling
document.getElementById("hide-tasks-button").addEventListener("click", () => {
  const taskSections = document.getElementById("task-list");
  taskSections.style.display = "none";
  document.getElementById("show-tasks-button").style.display = "inline";
  document.getElementById("hide-tasks-button").style.display = "none";
});

// Show/Hide Completed Task List
document.getElementById("show-completed-button").addEventListener("click", () => {
  document.getElementById("completed-task-list").style.display = "block";
  document.getElementById("show-completed-button").style.display = "none";
  document.getElementById("hide-completed-button").style.display = "inline";
  loadCompletedTasks(); // Load completed tasks when the button is clicked
});

document.getElementById("hide-completed-button").addEventListener("click", () => {
  document.getElementById("completed-task-list").style.display = "none";
  document.getElementById("show-completed-button").style.display = "inline";
  document.getElementById("hide-completed-button").style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  // Show/Hide Completed Task List
  document.getElementById("show-completed-button").addEventListener("click", () => {
    document.getElementById("completed-task-section").style.display = "block";
    document.getElementById("show-completed-button").style.display = "none";
    document.getElementById("hide-completed-button").style.display = "inline";
    loadCompletedTasks(); // Load completed tasks when the button is clicked
  });

  document.getElementById("hide-completed-button").addEventListener("click", () => {
    document.getElementById("completed-task-section").style.display = "none";
    document.getElementById("show-completed-button").style.display = "inline";
    document.getElementById("hide-completed-button").style.display = "none";
  });

  // Show/Hide Summary Section
  document.getElementById("show-summary-button").addEventListener("click", () => {
    document.getElementById("summary-section").style.display = "block";
    document.getElementById("show-summary-button").style.display = "none";
    document.getElementById("hide-summary-button").style.display = "inline";
    updateSummary(); // Call this function when the summary is shown
  });

  document.getElementById("hide-summary-button").addEventListener("click", () => {
    document.getElementById("summary-section").style.display = "none";
    document.getElementById("show-summary-button").style.display = "inline";
    document.getElementById("hide-summary-button").style.display = "none";
  });

  // Load completed tasks on page load
  loadCompletedTasks();
});

// Display saved tasks by category with sorting by ETA
onSnapshot(collection(db, "tasks"), (snapshot) => {
  const taskSections = document.getElementById("task-list");
  taskSections.innerHTML = "";

  const categories = [
    "Finance", "Travel & Adventure", "Relationships",
    "Home & Living", "Personal Projects", "Learning & Curiosity",
    "Health & Fitness", "Entertainment", "Spiritual Growth"
  ];

  // Group tasks by category and sort by ETA within each category
  const tasksByCategory = {};
  snapshot.forEach((doc) => {
    const task = doc.data();
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = [];
    }
    tasksByCategory[task.category].push({ id: doc.id, ...task });
  });

  // Sort categories by nearest ETA task
  categories.sort((a, b) => {
    const tasksA = tasksByCategory[a] || [];
    const tasksB = tasksByCategory[b] || [];
    const etaA = tasksA.length ? new Date(tasksA.reduce((min, t) => new Date(t.eta) < new Date(min.eta) ? t : min).eta) : Infinity;
    const etaB = tasksB.length ? new Date(tasksB.reduce((min, t) => new Date(t.eta) < new Date(min.eta) ? t : min).eta) : Infinity;
    return etaA - etaB;
  });

  // Sort tasks within each category by ETA
  categories.forEach((category) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("task-section");
    sectionDiv.innerHTML = `<h3>${category}</h3><table class="task-table"><thead><tr><th>Task Name</th><th>Priority</th><th>Days Left</th><th>Start Date</th><th>End Date</th><th>Action</th></tr></thead><tbody id="${category}-tasks"></tbody></table>`;
    taskSections.appendChild(sectionDiv);

    const tasks = tasksByCategory[category] || [];
    tasks.sort((a, b) => new Date(a.eta) - new Date(b.eta));

    tasks.forEach((task) => {
      const tbody = document.getElementById(`${category}-tasks`);
      if (tbody) {
        const etaDate = new Date(task.eta);
        const todayDate = new Date();
        const daysLeft = Math.ceil((etaDate - todayDate) / (1000 * 60 * 60 * 24));
        const tr = document.createElement("tr");
        // Optional: Add a class based on category as well
        if (task.category === "Finance") {
          tr.classList.add("task-category-finance");
        } else if (task.category === "Health & Fitness") {
          tr.classList.add("task-category-health-and-fitness");
        } else if (task.category === "Travel & Adventure") {
          tr.classList.add("task-category-travel-and-adventure");
        } else if (task.category === "Relationships") {
          tr.classList.add("task-category-relationships");
        } else if (task.category === "Home & Living") {
          tr.classList.add("task-category-home-and-living");
        } else if (task.category === "Personal Projects") {
          tr.classList.add("task-category-personal-projects");
        } else if (task.category === "Learning & Curiosity") {
          tr.classList.add("task-category-learning-and-curiosity");
        } else if (task.category === "Entertainment") {
          tr.classList.add("task-category-entertainment");
        } else if (task.category === "Spiritual Growth") {
          tr.classList.add("task-category-spiritual-growth");
        }
        // Determine if the task name should be highlighted
        const highlightClass = daysLeft <= 3 ? "task-name-highlight" : "";
        tr.innerHTML = `<td data-category="${task.category}" class="task-name ${highlightClass}">${task.name}</td>
        <td><select class="edit-priority" data-id="${task.id}">
            <option value="Critical" ${task.priority === "Critical" ? "selected" : ""}>Critical</option>
            <option value="High" ${task.priority === "High" ? "selected" : ""}>High</option>
            <option value="Medium" ${task.priority === "Medium" ? "selected" : ""}>Medium</option>
            <option value="Low" ${task.priority === "Low" ? "selected" : ""}>Low</option>
        </select></td>
        <td class="days-left">${daysLeft} days</td>
        <td>${formatDate(task.startDate)}</td> 
        <td><input type="date" value="${task.eta}" data-id="${task.id}" class="edit-eta"></td>
        <td><button class="mark-complete" data-id="${task.id}">Completed!</button> <button class="delete-task" data-id="${task.id}">Delete</button></td>`;

        tbody.appendChild(tr);
      }
    });
  });

  // Add event listeners to mark tasks as complete
  document.querySelectorAll(".mark-complete").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const taskId = e.target.getAttribute("data-id");
      const taskName = e.target.closest("tr").querySelector("td:nth-child(1)").textContent;
      const taskCategory = e.target.closest("tr").querySelector("td:nth-child(1)").dataset.category;
      const confirmation = confirm(`Confirm completing task "${taskName}"?`);
      if (!confirmation) return;
      moveTaskToCompleted(taskId, taskName, taskCategory);
    });
  });

  // Add event listeners to update ETA and update Days Left accordingly
  document.querySelectorAll(".edit-eta").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const taskId = e.target.getAttribute("data-id");
      const newETA = e.target.value;
      const confirmation = confirm(`Are you sure you want to change the End Date to ${newETA}?`);
      if (!confirmation) return;
      try {
        await updateDoc(doc(db, "tasks", taskId), {
          eta: newETA
        });
        console.log("End Date updated successfully!");

        // Update the Days Left dynamically
        const tr = e.target.closest("tr");
        const startDate = tr.querySelector("td:nth-child(4)").textContent;
        const etaDate = new Date(newETA);
        const startDateDate = new Date(startDate);
        const daysLeft = Math.ceil((etaDate - startDateDate) / (1000 * 60 * 60 * 24));
        tr.querySelector(".days-left").textContent = `${daysLeft} days`;
      } catch (error) {
        console.error("Error updating End Date: ", error);
      }
    });
  });

  // Add event listeners to update priority
  document.querySelectorAll(".edit-priority").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const taskId = e.target.getAttribute("data-id");
      const newPriority = e.target.value;
      const confirmation = confirm(`Are you sure you want to update the priority to ${newPriority}?`);
      if (!confirmation) return;
      try {
        await updateDoc(doc(db, "tasks", taskId), {
          priority: newPriority
        });
        console.log("Priority updated successfully!");
      } catch (error) {
        console.error("Error updating priority: ", error);
      }
    });
  });

  // Add event listeners to delete tasks
  document.querySelectorAll(".delete-task").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const taskId = e.target.getAttribute("data-id");
      const confirmation = confirm("Are you sure you want to delete this task?");
      if (!confirmation) return;
      try {
        await deleteDoc(doc(db, "tasks", taskId));
        console.log("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task: ", error);
      }
    });
  });
});

// Function to move task to the completed tasks section
async function moveTaskToCompleted(taskId, taskName, taskCategory) {
  try {
    // Get the task data
    const taskDoc = await getDoc(doc(db, "tasks", taskId));
    const taskData = taskDoc.data();

    // Add the task to completed tasks collection
    await addDoc(collection(db, "completedTasks"), {
      ...taskData,
      completedDate: new Date().toISOString(),  // Adding the completed date
      category: taskCategory  // Keep the category info
    });

    // Delete from active tasks
    await deleteDoc(doc(db, "tasks", taskId));
    console.log(`Task "${taskName}" moved to Completed Tasks History!`);

    // Refresh the UI
    loadCompletedTasks();
  } catch (error) {
    console.error("Error moving task to completed tasks: ", error);
  }
}

// Function to load and display completed tasks
function loadCompletedTasks() {
  const completedTaskSections = document.getElementById("completed-task-list");
  completedTaskSections.innerHTML = ""; // Clear the section

  // Fetch and display the completed tasks
  onSnapshot(collection(db, "completedTasks"), (snapshot) => {
    const completedTasks = [];
    snapshot.forEach((doc) => {
      const task = doc.data();
      completedTasks.push({ id: doc.id, ...task });
    });

    // Create the table structure for completed tasks without % Completed and ETA
    if (completedTasks.length > 0) {
      let table = `<table class="task-table">
                     <thead>
                       <tr><th>Task Name</th><th>Category</th><th>Priority</th><th>Start Date</th><th>Completed Date</th></tr>
                     </thead><tbody>`;

      completedTasks.forEach((task) => {
        // Format the completed date using toLocaleDateString()
        const formattedCompletedDate = new Date(task.completedDate).toLocaleDateString();
        const formattedStartDate = formatDate(task.startDate);

        // Determine category class
        let categoryClass = "";
        switch (task.category) {
          case "Finance":
            categoryClass = "task-category-finance";
            break;
          case "Health & Fitness":
            categoryClass = "task-category-health-and-fitness";
            break;
          case "Travel & Adventure":
            categoryClass = "task-category-travel-and-adventure";
            break;
          case "Relationships":
            categoryClass = "task-category-relationships";
            break;
          case "Home & Living":
            categoryClass = "task-category-home-and-living";
            break;
          case "Personal Projects":
            categoryClass = "task-category-personal-projects";
            break;
          case "Learning & Curiosity":
            categoryClass = "task-category-learning-and-curiosity";
            break;
          case "Entertainment":
            categoryClass = "task-category-entertainment";
            break;
          case "Spiritual Growth":
            categoryClass = "task-category-spiritual-growth";
            break;
        }

        // Apply the category class to the row
        table += `<tr class="${categoryClass}">
                    <td>${task.name}</td>
                    <td>${task.category}</td>
                    <td>${task.priority}</td>
                    <td>${formattedStartDate}</td>
                    <td>${formattedCompletedDate}</td>
                  </tr>`;
      });

      table += "</tbody></table>";
      completedTaskSections.innerHTML = table;
    } else {
      completedTaskSections.innerHTML = "<p>No completed tasks yet.</p>";
    }
  });
}


// Function to update the summary table with pending tasks count
function updateSummary() {
  onSnapshot(collection(db, "tasks"), (snapshot) => {
    const tasksByCategory = {};
    snapshot.forEach((doc) => {
      const task = doc.data();
      if (!tasksByCategory[task.category]) {
        tasksByCategory[task.category] = 0;
      }
      tasksByCategory[task.category]++;
    });

    // Sort categories by the number of tasks (most to least)
    const sortedCategories = Object.keys(tasksByCategory).sort((a, b) => tasksByCategory[b] - tasksByCategory[a]);

    // Update the summary table
    const summaryBody = document.getElementById("summary-body");
    summaryBody.innerHTML = ""; // Clear previous summary

    sortedCategories.forEach((category) => {
      const tr = document.createElement("tr");

      // Determine category class
      let categoryClass = "";
      switch (category) {
        case "Finance":
          categoryClass = "task-category-finance";
          break;
        case "Health & Fitness":
          categoryClass = "task-category-health-and-fitness";
          break;
        case "Travel & Adventure":
          categoryClass = "task-category-travel-and-adventure";
          break;
        case "Relationships":
          categoryClass = "task-category-relationships";
          break;
        case "Home & Living":
          categoryClass = "task-category-home-and-living";
          break;
        case "Personal Projects":
          categoryClass = "task-category-personal-projects";
          break;
        case "Learning & Curiosity":
          categoryClass = "task-category-learning-and-curiosity";
          break;
        case "Entertainment":
          categoryClass = "task-category-entertainment";
          break;
        case "Spiritual Growth":
          categoryClass = "task-category-spiritual-growth";
          break;
      }

      // Apply the category class to the row
      tr.classList.add(categoryClass);

      tr.innerHTML = `<td>${category}</td><td style="text-align: center;">${tasksByCategory[category]}</td>`;
      summaryBody.appendChild(tr);
    });

    // Ensure the summary table uses the new class
    const summaryTable = document.getElementById("summary-table");
    summaryTable.classList.add("summary-table");
  });
}
