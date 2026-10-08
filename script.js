// API Configuration
const API_BASE_URL = "http://localhost:5192/api/Employees";

// Global frontend state holding employees fetched from the backend API
let employees = [];

// ==========================================
// Reusable API Service Functions
// ==========================================

/**
 * Fetch all employees from the REST API (GET /api/Employees).
 */
async function getEmployees() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
        const errorMsg = await parseErrorMessage(response);
        throw new Error(errorMsg);
    }
    return await response.json();
}

/**
 * Fetch a single employee by ID from the REST API (GET /api/Employees/{id}).
 */
async function getEmployeeById(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
        const errorMsg = await parseErrorMessage(response);
        throw new Error(errorMsg);
    }
    return await response.json();
}

/**
 * Create a new employee via POST request (POST /api/Employees).
 */
async function createEmployee(employeeData) {
    const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
        const errorMsg = await parseErrorMessage(response);
        throw new Error(errorMsg);
    }

    return await response.json();
}

/**
 * Update an existing employee via PUT request (PUT /api/Employees/{id}).
 */
async function updateEmployee(id, employeeData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
        const errorMsg = await parseErrorMessage(response);
        throw new Error(errorMsg);
    }

    if (response.status === 204) {
        return null;
    }

    return await response.json();
}

/**
 * Delete an employee record via DELETE request (DELETE /api/Employees/{id}).
 */
async function deleteEmployeeApi(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const errorMsg = await parseErrorMessage(response);
        throw new Error(errorMsg);
    }

    return true;
}

// ==========================================
// Helper Utility Functions
// ==========================================

/**
 * Extract user-friendly error message from API response.
 */
async function parseErrorMessage(response) {
    try {
        const text = await response.text();
        if (!text) return `Server returned status ${response.status} (${response.statusText})`;
        
        try {
            const data = JSON.parse(text);
            if (data.message) return data.message;
            if (data.Message) return data.Message;
            if (data.title) return data.title;
            if (data.errors) {
                const messages = [];
                for (const key in data.errors) {
                    if (Array.isArray(data.errors[key])) {
                        messages.push(...data.errors[key]);
                    } else {
                        messages.push(data.errors[key]);
                    }
                }
                if (messages.length > 0) return messages.join(" ");
            }
        } catch {
            return text;
        }

        return `Server returned status ${response.status}`;
    } catch {
        return `Server error (${response.status}: ${response.statusText})`;
    }
}

/**
 * Display top-level success or error alert banner.
 */
function showAlert(message, type = "success") {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) return;

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <span class="alert-close" onclick="this.parentElement.remove()">&times;</span>
    `;

    alertContainer.appendChild(alertDiv);

    // Automatically remove alert after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Escape HTML characters to prevent XSS.
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// Data Rendering & UI Logic
// ==========================================

/**
 * Load employee list from backend API and populate table.
 */
async function loadAndDisplayEmployees() {
    const tableBody = document.getElementById("employeeTableBody");
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">Loading employees...</td></tr>`;

    try {
        employees = await getEmployees();
        applySearchAndDisplay();
    } catch (error) {
        console.error("Error loading employees from API:", error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #dc2626;">Failed to load employees. Please check if backend API is running.</td></tr>`;
        
        let userMsg = error.message;
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            userMsg = `Unable to connect to API at ${API_BASE_URL}. Ensure the backend server is running and CORS is configured.`;
        }
        showAlert(userMsg, "error");
    }
}

/**
 * Apply current search input filter and display filtered employees.
 */
function applySearchAndDisplay() {
    const searchInput = document.getElementById("searchInput");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (!searchText) {
        displayEmployees(employees);
        return;
    }

    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.toLowerCase();
        const email = (employee.email || "").toLowerCase();
        const department = (employee.department || "").toLowerCase();
        const designation = (employee.designation || "").toLowerCase();

        return (
            fullName.includes(searchText) ||
            email.includes(searchText) ||
            department.includes(searchText) ||
            designation.includes(searchText)
        );
    });

    displayEmployees(filteredEmployees);
}

/**
 * Render given list of employees into the DOM table.
 */
function displayEmployees(employeeList = employees) {
    const tableBody = document.getElementById("employeeTableBody");
    tableBody.innerHTML = "";

    if (!employeeList || employeeList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #777;">No employees found.</td></tr>`;
        return;
    }

    employeeList.forEach(employee => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(String(employee.employeeId))}</td>
            <td>${escapeHtml(employee.firstName)} ${escapeHtml(employee.lastName)}</td>
            <td>${escapeHtml(employee.email)}</td>
            <td>${escapeHtml(employee.department)}</td>
            <td>${escapeHtml(employee.designation)}</td>
            <td class="${employee.isActive ? "active" : "inactive"}">
                ${employee.isActive ? "Active" : "Inactive"}
            </td>
            <td>
                <button
                    class="edit-button"
                    onclick="editEmployee(${employee.employeeId})">
                    Edit
                </button>
                <button
                    class="delete-button"
                    onclick="deleteEmployee(${employee.employeeId})">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ==========================================
// Modal & Form Handlers
// ==========================================

/**
 * Open form modal for adding a new employee.
 */
function openEmployeeForm() {
    document.getElementById("employeeForm").reset();
    document.getElementById("employeeId").value = "";
    document.getElementById("isActive").checked = true;
    document.getElementById("formTitle").innerText = "Add Employee";
    document.getElementById("employeeModal").style.display = "block";
}

/**
 * Close form modal.
 */
function closeEmployeeForm() {
    document.getElementById("employeeModal").style.display = "none";
}

/**
 * Fetch employee details by ID and populate the Edit form.
 */
async function editEmployee(id) {
    try {
        const employee = await getEmployeeById(id);

        document.getElementById("employeeId").value = employee.employeeId;
        document.getElementById("firstName").value = employee.firstName || "";
        document.getElementById("lastName").value = employee.lastName || "";
        document.getElementById("email").value = employee.email || "";
        document.getElementById("phone").value = employee.phone || "";
        document.getElementById("department").value = employee.department || "";
        document.getElementById("designation").value = employee.designation || "";
        document.getElementById("salary").value = employee.salary !== null && employee.salary !== undefined ? employee.salary : "";

        // Format DateOnly/ISO string to YYYY-MM-DD for <input type="date">
        if (employee.joiningDate) {
            document.getElementById("joiningDate").value = employee.joiningDate.split("T")[0];
        } else {
            document.getElementById("joiningDate").value = "";
        }

        document.getElementById("isActive").checked = Boolean(employee.isActive);
        document.getElementById("formTitle").innerText = "Edit Employee";
        document.getElementById("employeeModal").style.display = "block";
    } catch (error) {
        console.error(`Error fetching employee ID ${id}:`, error);
        showAlert(`Failed to load employee details: ${error.message}`, "error");
    }
}

/**
 * Handle form submit for creating or updating an employee.
 */
document.getElementById("employeeForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const saveButton = this.querySelector(".save-button");
    const originalButtonText = saveButton.innerText;

    const employeeId = document.getElementById("employeeId").value;

    const payload = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        department: document.getElementById("department").value.trim(),
        designation: document.getElementById("designation").value.trim(),
        salary: Number(document.getElementById("salary").value) || 0,
        joiningDate: document.getElementById("joiningDate").value,
        isActive: document.getElementById("isActive").checked
    };

    // Disable button to prevent duplicate submissions
    saveButton.disabled = true;
    saveButton.innerText = "Saving...";

    try {
        if (employeeId) {
            // Update existing employee (PUT /api/Employees/{id})
            await updateEmployee(employeeId, payload);
            showAlert("Employee updated successfully!", "success");
        } else {
            // Create new employee (POST /api/Employees)
            await createEmployee(payload);
            showAlert("Employee added successfully!", "success");
        }

        // Close modal only upon successful operation
        closeEmployeeForm();

        // Refresh employee list from the backend API
        await loadAndDisplayEmployees();
    } catch (error) {
        console.error("Error saving employee:", error);
        showAlert(`Failed to save employee: ${error.message}`, "error");
    } finally {
        saveButton.disabled = false;
        saveButton.innerText = originalButtonText;
    }
});

/**
 * Delete an employee after user confirmation.
 */
async function deleteEmployee(id) {
    const employee = employees.find(e => e.employeeId === id);
    const employeeName = employee
        ? `${employee.firstName} ${employee.lastName}`
        : `Employee ID ${id}`;

    const confirmed = confirm(`Are you sure you want to delete ${employeeName}?`);
    if (!confirmed) {
        return;
    }

    try {
        await deleteEmployeeApi(id);
        showAlert(`Employee "${employeeName}" deleted successfully!`, "success");
        await loadAndDisplayEmployees();
    } catch (error) {
        console.error(`Error deleting employee ID ${id}:`, error);
        showAlert(`Failed to delete employee: ${error.message}`, "error");
    }
}

// ==========================================
// Search Event Handler & Initializer
// ==========================================

document.getElementById("searchInput").addEventListener("input", function() {
    applySearchAndDisplay();
});

// Load employee list from backend API on initial page load
if (document.readyState === "complete" || document.readyState === "interactive") {
    loadAndDisplayEmployees();
} else {
    document.addEventListener("DOMContentLoaded", loadAndDisplayEmployees);
}