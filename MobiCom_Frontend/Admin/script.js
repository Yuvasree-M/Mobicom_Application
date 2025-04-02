function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT:", e);
        return null;
    }
}

function getToken() {
    return sessionStorage.getItem("jwtToken");
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        showToast("Please log in to access this page", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return false;
    }
    return true;
}

function showToast(message, type) {
    const toastContainer = document.getElementById("toastContainer") || document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "1050";
    document.body.appendChild(toastContainer);
    toastContainer.innerHTML = `
        <div class="toast show text-white bg-${type}" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    setTimeout(() => (toastContainer.innerHTML = ""), 3000);
}

document.addEventListener("DOMContentLoaded", function () {
    showPage("dashboard");
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const pageId = this.getAttribute("onclick").match(/'([^']+)'/)[1];
            showPage(pageId);
        });
    });
});

function showPage(pageId) {
    document.querySelectorAll(".content-section").forEach((section) => {
        section.style.display = "none";
    });

    const selectedSection = document.getElementById(pageId);
    if (selectedSection) {
        selectedSection.style.display = "block";
    }
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach((link) => {
        if (link.getAttribute("onclick")?.includes(pageId)) {
            link.classList.add("active");
        }
    });
}

// Scroll to Top
window.onscroll = function () {
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        scrollTopBtn.style.display = "block";
    } else {
        scrollTopBtn.style.display = "none";
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}
async function setAdminTooltip() {
        try {
            const response = await fetch(`http://localhost:8083/admin/profile`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch admin profile`);
            const data = await response.json();
            adminName = data.name || "Admin";
            sessionStorage.setItem("adminName", adminName); 
        } catch (error) {
            console.error("Error fetching admin profile:", error);
            adminName = "Admin"; 
        }

    const navbarAvatar = document.getElementById("navbarAvatar");
    if (navbarAvatar) {
        navbarAvatar.setAttribute("data-bs-title", adminName);
        const tooltip = new bootstrap.Tooltip(navbarAvatar);
    }
}
setAdminTooltip();
// Dashboard Management
async function notifyUser(name, phone, email, expiryDate) {
    try {
        const token = sessionStorage.getItem('jwtToken');
        if (!token) {
            console.error("No JWT token found. Please log in.");
            return;
        }

        if (!expiryDate || typeof expiryDate !== 'string') {
            throw new Error("Expiry date is missing or invalid");
        }

        let expiry;
        if (expiryDate.includes('-') && expiryDate.split('-').length === 3) {
            const parts = expiryDate.split('-');
            if (parts[0].length === 4) {
                expiry = new Date(expiryDate);
            } else {
                expiry = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        } else {
            expiry = new Date(expiryDate);
        }

        if (isNaN(expiry.getTime())) {
            throw new Error("Invalid expiry date provided");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        const timeDiff = expiry - today;
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        let plainMessage;
        let subject;
        if (daysRemaining > 3) {
            subject = "Mobi.Comm Subscription Update";
            plainMessage = `Dear ${name}, your subscription is still active and will expire in ${daysRemaining} days.`;
        } else if (daysRemaining === 3) {
            subject = "Mobi.Comm Subscription Reminder: 3 Days Remaining";
            plainMessage = `Dear ${name}, your subscription is nearing its expiry date. Only 3 days remaining! Please recharge soon.`;
        } else if (daysRemaining === 2) {
            subject = "Mobi.Comm Subscription Reminder: 2 Days Remaining";
            plainMessage = `Dear ${name}, your subscription expires in 2 days. Please recharge soon!`;
        } else if (daysRemaining === 1) {
            subject = "Mobi.Comm Subscription Reminder: Expiring Tomorrow";
            plainMessage = `Dear ${name}, your subscription expires tomorrow! Please recharge today to avoid interruption.`;
        } else if (daysRemaining === 0) {
            subject = "Mobi.Comm Subscription Reminder: Expiring Today";
            plainMessage = `Dear ${name}, your subscription expires today! Please recharge now to continue services.`;
        } else {
            subject = "Mobi.Comm Subscription Expired";
            plainMessage = `Dear ${name}, your subscription has expired. Please recharge to reactivate your plan.`;
        }

        const htmlMessage = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                    .header { background-color: #26A69A; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
                    .content { padding: 20px; color: #333333; line-height: 1.6; }
                    .content p { margin: 0 0 10px; }
                    .button { display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #26A69A; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777777; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Mobi.Comm Prepaid Service</h1>
                    </div>
                    <div class="content">
                        <p>${plainMessage}</p>
                        <p>Phone: ${phone}</p>
                        <p>Email: ${email || 'Not provided'}</p>
                        <p>Expiry Date: ${expiryDate}</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Mobi.Comm. All rights reserved.</p>
                        <p>Contact us at support@mobicomm.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const payload = { name, phone, email: email || 'Not provided', subject, message: plainMessage, htmlMessage };
        const response = await fetch('http://localhost:8083/admin/notify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send notification: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        const userNameElement = document.getElementById('notifyUserName');
        const userPhoneElement = document.getElementById('notifyUserPhone');
        const messageElement = document.getElementById('notifyMessage');
        const modalLabelElement = document.getElementById('notifyModalLabel');

        if (!userNameElement || !userPhoneElement || !messageElement || !modalLabelElement) {
            console.error("Modal elements not found in the DOM");
            throw new Error("Modal elements not found");
        }

        userNameElement.textContent = name;
        userPhoneElement.textContent = phone;
        messageElement.textContent = `User has been notified about their plan expiry. Email sent to ${email || 'Not provided'}.`;
        modalLabelElement.textContent = "Notification Sent";

        const notifyModal = new bootstrap.Modal(document.getElementById('notifyModal'), {
            keyboard: true
        });
        notifyModal.show();
    } catch (error) {
        console.error("Error sending notification:", error);

        const userNameElement = document.getElementById('notifyUserName');
        const userPhoneElement = document.getElementById('notifyUserPhone');
        const messageElement = document.getElementById('notifyMessage');
        const modalLabelElement = document.getElementById('notifyModalLabel');

        if (!userNameElement || !userPhoneElement || !messageElement || !modalLabelElement) {
            console.error("Modal elements not found in the DOM");
            throw new Error("Modal elements not found");
        }

        userNameElement.textContent = name;
        userPhoneElement.textContent = phone;
        messageElement.textContent = `Failed to send notification email: ${error.message}`;
        modalLabelElement.textContent = "Notification Failed";

        const notifyModal = new bootstrap.Modal(document.getElementById('notifyModal'), {
            keyboard: true
        });
        notifyModal.show();
    }
}
document.addEventListener("DOMContentLoaded", function () {
    let dashboardCurrentPage = 1;
    let dashboardRecordsPerPage = 5;
    let subscriberData = [];

    // Fetch dashboard data from the backend
    async function fetchDataAndUpdate() {
        try {
            const token = sessionStorage.getItem('jwtToken');
            if (!token) {
                console.error("No JWT token found in sessionStorage. Please log in.");
                return;
            }

            const response = await fetch('http://localhost:8083/admin/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            subscriberData = data.expiringSubscribers || [];
            updateDashboard(data);
            updateTable();
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    }

    // Update dashboard cards
    function updateDashboard(data) {
        document.getElementById("totalSubscribers").innerHTML = `<b>${data.totalSubscribers}</b>`;
        document.getElementById("activePlans").innerHTML = `<b>${data.activePlans}</b>`;
        document.getElementById("expiringPlans").innerHTML = `<b>${data.expiringSubscribersCount}</b>`;
        
        const currentMonth = new Date().toISOString().slice(0, 7);
        const revenue = data.monthlyRevenue[currentMonth] || 0;
        document.getElementById("totalRevenue").innerHTML = `<b>₹${revenue.toFixed(2)}</b>`;
    }

    // Update the expiring subscribers table with pagination
    function updateTable() {
        const tableBody = document.getElementById("expiringSubscribersTable");
        tableBody.innerHTML = "";
    
        let start = (dashboardCurrentPage - 1) * dashboardRecordsPerPage;
        let end = start + dashboardRecordsPerPage;
        let paginatedData = subscriberData.slice(start, end);
    
        paginatedData.forEach(subscriber => {
            console.log(`Subscriber Email: ${subscriber.email}`); // Debug log
            let row = `<tr>
                <td>${subscriber.name}</td>
                <td>${subscriber.phone}</td>
                <td>${subscriber.plan}</td>
                <td>${subscriber.price}</td>
                <td>${subscriber.validity}</td>
                <td>${subscriber.rechargeDate}</td>
                <td>${subscriber.expiryDate}</td>
                <td><button class="btn btn-warning" onclick="notifyUser('${subscriber.name}', '${subscriber.phone}', '${subscriber.email}', '${subscriber.expiryDate}')">Notify</button></td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    
        updatePaginationControls();
    }


    // Update pagination controls
    function updatePaginationControls() {
        const paginationContainer = document.getElementById("pagination");
        paginationContainer.innerHTML = "";

        let dashboardTotalPages = Math.ceil(subscriberData.length / dashboardRecordsPerPage);

        // Previous button
        const prevItem = document.createElement("li");
        prevItem.className = `page-item ${dashboardCurrentPage === 1 ? "disabled" : ""}`;
        const prevLink = document.createElement("a");
        prevLink.className = "page-link";
        prevLink.href = "#";
        prevLink.innerHTML = '<span aria-hidden="true">«</span>';
        prevLink.addEventListener("click", (e) => {
            e.preventDefault();
            changePage(dashboardCurrentPage - 1);
        });
        prevItem.appendChild(prevLink);
        paginationContainer.appendChild(prevItem);

        // Page numbers
        for (let i = 1; i <= dashboardTotalPages; i++) {
            const pageItem = document.createElement("li");
            pageItem.className = `page-item ${i === dashboardCurrentPage ? "active" : ""}`;
            const pageLink = document.createElement("a");
            pageLink.className = "page-link";
            pageLink.href = "#";
            pageLink.textContent = i;
            pageLink.addEventListener("click", (e) => {
                e.preventDefault();
                changePage(i);
            });
            pageItem.appendChild(pageLink);
            paginationContainer.appendChild(pageItem);
        }

        // Next button
        const nextItem = document.createElement("li");
        nextItem.className = `page-item ${dashboardCurrentPage === dashboardTotalPages ? "disabled" : ""}`;
        const nextLink = document.createElement("a");
        nextLink.className = "page-link";
        nextLink.href = "#";
        nextLink.innerHTML = '<span aria-hidden="true">»</span>';
        nextLink.addEventListener("click", (e) => {
            e.preventDefault();
            changePage(dashboardCurrentPage + 1);
        });
        nextItem.appendChild(nextLink);
        paginationContainer.appendChild(nextItem);
    }

    // Change page function
    function changePage(page) {
        const totalPages = Math.ceil(subscriberData.length / dashboardRecordsPerPage);
        if (page > 0 && page <= totalPages) {
            dashboardCurrentPage = page;
            updateTable();
        }
    }

    // Initial fetch and periodic update
    fetchDataAndUpdate();
    setInterval(fetchDataAndUpdate, 10000);
});

// Subscriber Management
document.addEventListener("DOMContentLoaded", function () {
    const BASE_URL = "http://localhost:8083/admin";
    let subscribers = [];
    let filteredSubscribers = [];
    const subscriberItemsPerPage = 5;
    let subscriberCurrentPage = 1;
    let subscriberTotalPages = 1;

    async function fetchSubscribers(page = 0, status = null) {
        if (!checkAuth()) return;

        try {
            const url = status
                ? `${BASE_URL}/getsubscribers?page=${page}&size=${subscriberItemsPerPage}&status=${status}`
                : `${BASE_URL}/getsubscribers?page=${page}&size=${subscriberItemsPerPage}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch subscribers");
            const data = await response.json();
            subscribers = data.content || [];
            filteredSubscribers = [...subscribers];
            subscriberTotalPages = data.totalPages || 1;
            displaySubscribers();
        } catch (error) {
            console.error("Error fetching subscribers:", error);
            showToast("Error fetching subscribers", "danger");
        }
    }

    async function fetchAllSubscribers(status = null) {
        if (!checkAuth()) return [];

        try {
            const url = status
                ? `${BASE_URL}/getsubscribers?size=10000&status=${status}`
                : `${BASE_URL}/getsubscribers?size=10000`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch all subscribers");
            const data = await response.json();
            return data.content || [];
        } catch (error) {
            console.error("Error fetching all subscribers:", error);
            showToast("Error fetching all subscribers", "danger");
            return [];
        }
    }

    function displaySubscribers() {
        const tbody = document.getElementById("subscriber-list");
        tbody.innerHTML = "";

        filteredSubscribers.forEach((subscriber) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${subscriber.name || "N/A"}</td>
                <td>${subscriber.email || "N/A"}</td>
                <td>${subscriber.phoneNumber || "N/A"}</td>
                <td><a href="${subscriber.aadhar_card || "#"}" target="_blank">View Aadhar</a></td>
                <td>
                    <img src="${subscriber.photo || "../assesst/Images/profile.jpeg"}" alt="Photo" class="img-thumbnail" width="60">
                </td>
                <td id="status-${subscriber.id}">${subscriber.status || "Pending"}</td>
                <td>
                    <button class="btn btn-success btn-sm approve-btn">Approve</button>
                    <button class="btn btn-danger btn-sm delete-btn">Deactivate</button>
                </td>
            `;

            const approveBtn = row.querySelector(".approve-btn");
            const deleteBtn = row.querySelector(".delete-btn");

            approveBtn.addEventListener("click", () => showConfirmationModal(subscriber.id, "approve"));
            deleteBtn.addEventListener("click", () => showConfirmationModal(subscriber.id, "delete"));

            tbody.appendChild(row);
        });

        const searchInput = document.getElementById("searchSubscribers").value;
        if (!searchInput) {
            generatePagination();
        } else {
            const pagination = document.getElementById("pagination0");
            pagination.innerHTML = "";
        }
    }

    function generatePagination() {
        const pagination = document.getElementById("pagination0");
        pagination.innerHTML = "";

        if (subscriberTotalPages <= 1) return;

        const prevItem = document.createElement("li");
        prevItem.className = `page-item ${subscriberCurrentPage === 1 ? "disabled" : ""}`;
        const prevButton = document.createElement("button");
        prevButton.className = "page-link";
        prevButton.textContent = "«";
        if (subscriberCurrentPage > 1) {
            prevButton.addEventListener("click", () => changeSubscriberPage(subscriberCurrentPage - 1));
        }
        prevItem.appendChild(prevButton);
        pagination.appendChild(prevItem);

        for (let i = 1; i <= subscriberTotalPages; i++) {
            const pageItem = document.createElement("li");
            pageItem.className = `page-item ${i === subscriberCurrentPage ? "active" : ""}`;
            const pageButton = document.createElement("button");
            pageButton.className = "page-link";
            pageButton.textContent = i;
            pageButton.addEventListener("click", () => changeSubscriberPage(i));
            pageItem.appendChild(pageButton);
            pagination.appendChild(pageItem);
        }

        const nextItem = document.createElement("li");
        nextItem.className = `page-item ${subscriberCurrentPage === subscriberTotalPages ? "disabled" : ""}`;
        const nextButton = document.createElement("button");
        nextButton.className = "page-link";
        nextButton.textContent = "»";
        if (subscriberCurrentPage < subscriberTotalPages) {
            nextButton.addEventListener("click", () => changeSubscriberPage(subscriberCurrentPage + 1));
        }
        nextItem.appendChild(nextButton);
        pagination.appendChild(nextItem);
    }

    function changeSubscriberPage(page) {
        if (page < 1 || page > subscriberTotalPages) return;
        subscriberCurrentPage = page;
        const status = document.getElementById("statusFilter").value || null;
        document.getElementById("searchSubscribers").value = "";
        fetchSubscribers(page - 1, status);
    }

    function showConfirmationModal(id, action) {
        const subscriber = subscribers.find((sub) => sub.id === id);
        if (!subscriber) return;

        const confirmText = document.getElementById("confirmText");
        const confirmActionBtn = document.getElementById("confirmActionBtn");
        const modalBody = document.getElementById("confirmModalBody");
        const deleteOptions = document.getElementById("deleteOptions");

        modalBody.innerHTML = `
            <p><strong>Name:</strong> ${subscriber.name}</p>
            <p><strong>Email:</strong> ${subscriber.email}</p>
            <p><strong>Mobile:</strong> ${subscriber.phoneNumber}</p>
            <p><strong>Aadhar Card:</strong> <a href="${subscriber.aadhar_card || "#"}" target="_blank">View Aadhar</a></p>
            <p><strong>Photo:</strong><br>
                <img src="${subscriber.photo || "../assesst/Images/default-avatar.jpg"}" class="img-thumbnail" width="100">
            </p>
        `;

        if (action === "approve") {
            confirmText.textContent = "Approve this subscriber?";
            confirmActionBtn.className = "btn btn-success";
            confirmActionBtn.textContent = "Approve";
            confirmActionBtn.style.display = "block";
            confirmActionBtn.onclick = () => updateSubscriberStatus(id, "ACTIVE");
            deleteOptions.innerHTML = "";
        } else if (action === "delete") {
            confirmText.textContent = "Deactivate this subscriber?";
            confirmActionBtn.className = "btn btn-danger";
            confirmActionBtn.textContent = "Deactivate";
            confirmActionBtn.style.display = "block";
            confirmActionBtn.onclick = () => deleteSubscriber(id);
            deleteOptions.innerHTML = "";
        }

        const modal = new bootstrap.Modal(document.getElementById("confirmationModal"));
        modal.show();
    }

    async function updateSubscriberStatus(id, newStatus) {
        if (!checkAuth()) return;

        try {
            const response = await fetch(`${BASE_URL}/verify-subscriber/${id}?status=${newStatus}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to update status");
            const result = await response.json();
            console.log("Update status response:", result);
            showToast(result.message, newStatus === "ACTIVE" ? "success" : "warning");
            const statusElement = document.getElementById(`status-${id}`);
            if (statusElement) {
                statusElement.textContent = newStatus;
            }
            const status = document.getElementById("statusFilter").value || null;
            fetchSubscribers(subscriberCurrentPage - 1, status);
        } catch (error) {
            showToast("Error updating status", "danger");
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById("confirmationModal"));
        modal.hide();
    }

    async function deleteSubscriber(id) {
        if (!checkAuth()) return;

        try {
            const response = await fetch(`${BASE_URL}/verify-subscriber/${id}?status=INACTIVE`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to deactivate subscriber");
            const result = await response.json();
            console.log("Deactivate response:", result);
            showToast(result.message, "warning");
            const statusElement = document.getElementById(`status-${id}`);
            if (statusElement) {
                statusElement.textContent = "INACTIVE";
            }
            const status = document.getElementById("statusFilter").value || null;
            fetchSubscribers(subscriberCurrentPage - 1, status);
        } catch (error) {
            showToast("Error deactivating subscriber", "danger");
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById("confirmationModal"));
        modal.hide();
    }

    async function filterSubscribers() {
        const searchInput = document.getElementById("searchSubscribers").value.toLowerCase();
        const status = document.getElementById("statusFilter").value || null;

        if (searchInput) {
            const allSubscribers = await fetchAllSubscribers(status);
            filteredSubscribers = allSubscribers.filter((subscriber) => {
                return (
                    (subscriber.name && subscriber.name.toLowerCase().includes(searchInput)) ||
                    (subscriber.phoneNumber && subscriber.phoneNumber.includes(searchInput)) ||
                    (subscriber.status && subscriber.status.toLowerCase().includes(searchInput))
                );
            });
        } else {
            filteredSubscribers = [...subscribers];
        }

        displaySubscribers();
    }

    function filterByStatus() {
        const status = document.getElementById("statusFilter").value;
        subscriberCurrentPage = 1;
        document.getElementById("searchSubscribers").value = "";
        fetchSubscribers(0, status || null);
    }

    document.getElementById("statusFilter").addEventListener("change", filterByStatus);
    document.getElementById("searchSubscribers").addEventListener("keyup", filterSubscribers);
    document.getElementById("exportCSV").addEventListener("click", async () => {
        const searchInput = document.getElementById("searchSubscribers").value;
        const status = document.getElementById("statusFilter").value || null;
        const data = searchInput ? filteredSubscribers : await fetchAllSubscribers(status);
        exportSubscribersToCSV(data, "subscribers.csv");
    });
    document.getElementById("exportPDF").addEventListener("click", async () => {
        const searchInput = document.getElementById("searchSubscribers").value;
        const status = document.getElementById("statusFilter").value || null;
        const data = searchInput ? filteredSubscribers : await fetchAllSubscribers(status);
        exportSubscribersToPDF(data, "subscribers.pdf");
    });

    function exportSubscribersToCSV(data, filename) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Name,Email,Mobile,Status\n";

        data.forEach((subscriber) => {
            const row = [
                subscriber.name || "N/A",
                subscriber.email || "N/A",
                subscriber.phoneNumber || "N/A",
                subscriber.status || "Pending",
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportSubscribersToPDF(data, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const headers = ["Name", "Email", "Mobile", "Status"];
        const rows = data.map((subscriber) => [
            subscriber.name || "N/A",
            subscriber.email || "N/A",
            subscriber.phoneNumber || "N/A",
            subscriber.status || "Pending",
        ]);

        doc.text("Subscriber List", 14, 10);
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 20,
        });

        doc.save(filename);
    }

    function getToken() {
        return sessionStorage.getItem('jwtToken');
    }

    function checkAuth() {
        const token = getToken();
        if (!token) {
            console.error("No JWT token found. Please log in.");
            return false;
        }
        return true;
    }

    function showToast(message, type) {
        console.log(`${type}: ${message}`);
    }

    fetchSubscribers(0, null);
});

// Transaction Management
document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'http://localhost:8083/admin';
    let allTransactions = [];
    let filteredTransactions = [];
    let currentPage = 1;
    const recordsPerPage = 5;
    let totalPages = 1;

    async function fetchWithAuth(url) {
        const token = sessionStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) };
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
    }

    async function loadAllTransactions() {
        allTransactions = await fetchWithAuth(`${apiBaseUrl}/transactions/all`);
        applyFiltersAndRender();
    }

    function applyFiltersAndRender() {
        const status = document.getElementById('filterStatus').value;
        const payment = document.getElementById('filterPayment').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        const searchTerm = document.getElementById('searchTransactions').value.trim().toLowerCase();

        filteredTransactions = allTransactions.filter(tx => {
            let match = true;
            if (status && tx.status !== status) match = false;
            if (payment && tx.paymentMethod !== payment) match = false;
            if (dateFrom && new Date(tx.rechargeDate) < new Date(dateFrom)) match = false;
            if (dateTo && new Date(tx.rechargeDate) > new Date(dateTo)) match = false;
            if (searchTerm && !(tx.subscriberName.toLowerCase().includes(searchTerm) || tx.subscriberNumber.includes(searchTerm))) match = false;
            return match;
        });

        totalPages = Math.ceil(filteredTransactions.length / recordsPerPage);
        renderTransactions();
        generatePagination();
    }

    function renderTransactions() {
        const tbody = document.getElementById('adminTransactionTable');
        tbody.innerHTML = '';

        if (filteredTransactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center">No transactions found</td></tr>`;
            return;
        }

        const start = (currentPage - 1) * recordsPerPage;
        const paginatedData = filteredTransactions.slice(start, start + recordsPerPage);

        paginatedData.forEach(tx => {
            tbody.innerHTML += `
                <tr>
                    <td>${tx.transactionId}</td>
                    <td>${tx.rechargeDate}</td>
                    <td>${tx.subscriberName}</td>
                    <td>${tx.subscriberNumber}</td>
                    <td>${tx.planName}</td>
                    <td>₹${tx.planPrice.toFixed(2)}</td>
                    <td>${tx.planValidity}</td>
                    <td>${tx.paymentMethod}</td>
                    <td>${tx.status}</td>
                    <td><button class="btn btn-primary btn-sm" onclick="downloadTransaction('${tx.transactionId}')">Download</button></td>
                </tr>`;
        });
    }

    function generatePagination() {
        const pagination = document.getElementById('pagination5');
        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        pagination.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage - 1})">&laquo;</button></li>`;

        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button></li>`;
        }

        pagination.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage + 1})">&raquo;</button></li>`;
    }

    window.changePage = function (page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderTransactions();
        generatePagination();
    };

    window.downloadTransaction = function (transactionId) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tx = allTransactions.find(t => t.transactionId === transactionId);
        if (!tx) return;

        doc.setFontSize(16);
        doc.text('Transaction Receipt', 20, 20);
        const content = [
            `Transaction ID: ${tx.transactionId}`,
            `Recharge Date: ${tx.rechargeDate}`,
            `Subscriber Name: ${tx.subscriberName}`,
            `Subscriber Number: ${tx.subscriberNumber}`,
            `Plan Name: ${tx.planName}`,
            `Plan Price: ₹${tx.planPrice.toFixed(2)}`,
            `Plan Validity: ${tx.planValidity}`,
            `Payment Method: ${tx.paymentMethod}`,
            `Status: ${tx.status}`
        ];
        let y = 40;
        content.forEach(line => { doc.text(line, 20, y); y += 10; });
        doc.save(`transaction_${transactionId}.pdf`);
    };

    document.getElementById('exportTransactionsToCSVBtn').addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,Transaction ID,Recharge Date,Subscriber Name,Subscriber Number,Plan Name,Plan Price,Plan Validity,Payment Method,Status\n";
        filteredTransactions.forEach(tx => {
            const row = [
                tx.transactionId, tx.rechargeDate, tx.subscriberName, tx.subscriberNumber,
                tx.planName, `₹${tx.planPrice.toFixed(2)}`, tx.planValidity,
                tx.paymentMethod, tx.status
            ].join(",");
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "transactions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('exportTransactionsToPDFBtn').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Transaction History", 14, 10);
        const headers = ["Transaction ID", "Recharge Date", "Subscriber Name", "Subscriber Number", "Plan Name", "Plan Price", "Plan Validity", "Payment Method", "Status"];
        const rows = filteredTransactions.map(tx => [
            tx.transactionId, tx.rechargeDate, tx.subscriberName, tx.subscriberNumber,
            tx.planName, `₹${tx.planPrice.toFixed(2)}`, tx.planValidity,
            tx.paymentMethod, tx.status
        ]);
        doc.autoTable({ head: [headers], body: rows, startY: 20 });
        doc.save("transactions.pdf");
    });

    // Filter Events
    ['filterStatus', 'filterPayment', 'filterDateFrom', 'filterDateTo', 'searchTransactions'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            currentPage = 1;
            applyFiltersAndRender();
        });
    });

    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterPayment').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        document.getElementById('searchTransactions').value = '';
        currentPage = 1;
        applyFiltersAndRender();
    });

    loadAllTransactions();
});




// Plan Management
document.addEventListener("DOMContentLoaded", function () {
    const BASE_URL = "http://localhost:8083/admin";
    let plans = [];
    let filteredPlans = [];
    let categories = [];
    let filteredCategories = [];
    const itemsPerPage = 10;
    let planPage = 0;
    let planTotalPages = 1;

    async function fetchCategories() {
        if (!checkAuth()) return;

        try {
            const response = await fetch(`${BASE_URL}/categories`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch categories");
            categories = await response.json();
            filteredCategories = [...categories];
            populateCategoryDropdowns();
            displayCategories();
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("Error fetching categories", "danger");
        }
    }

    async function fetchPlans() {
        if (!checkAuth()) return;

        const nameFilter = document.getElementById("search-plan-name").value;
        const priceFilter = document.getElementById("filter-price").value;
        const statusFilter = document.getElementById("filter-status").value;
        const categoryFilter = document.getElementById("filter-category").value;

        let sortDir = "asc";
        let sortBy = "price";
        if (priceFilter === "low-to-high") {
            sortDir = "asc";
        } else if (priceFilter === "high-to-low") {
            sortDir = "desc";
        }

        let url = `${BASE_URL}/plans?page=${planPage}&size=${itemsPerPage}&sortBy=${sortBy}&sortDir=${sortDir}`;
        if (nameFilter) url += `&name=${encodeURIComponent(nameFilter)}`;
        if (categoryFilter) {
            const category = categories.find(c => c.id === parseInt(categoryFilter));
            if (category) url += `&category=${encodeURIComponent(category.name)}`;
        }

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch plans");
            const data = await response.json();
            plans = data.content;
            filteredPlans = plans.filter(plan => !statusFilter || plan.status === statusFilter);
            planTotalPages = data.totalPages;
            displayPlans();
        } catch (error) {
            console.error("Error fetching plans:", error);
            showToast("Error fetching plans", "danger");
        }
    }

    function populateCategoryDropdowns() {
        const filterDropdown = document.getElementById("filter-category");
        const planModalDropdown = document.getElementById("plan-category");
        filterDropdown.innerHTML = '<option value="" selected>-- Select Category --</option>';
        planModalDropdown.innerHTML = '<option value="" selected>-- Select Category --</option>';
        categories.forEach(category => {
            filterDropdown.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            planModalDropdown.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });
    }

    function displayPlans() {
        const tbody = document.querySelector("#plans-table tbody");
        tbody.innerHTML = "";
        filteredPlans.forEach(plan => {
            const row = `
                <tr>
                    <td>${plan.name || "N/A"}</td>
                    <td>${plan.categoryName || "N/A"}</td>
                    <td>${plan.price || "N/A"}</td>
                    <td>${plan.validity || "N/A"}</td>
                    <td>${plan.dataLimit || "N/A"}</td>
                    <td>${plan.smsLimit || "N/A"}</td>
                    <td>${plan.callLimit || "N/A"}</td>
                    <td>${plan.status || "N/A"}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openEditPlanModal(${plan.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="openDeletePlanModal(${plan.id})">Delete</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        generatePlanPagination();
    }

    function displayCategories() {
        const tbody = document.querySelector("#categories-table tbody");
        tbody.innerHTML = "";
        filteredCategories.forEach(category => {
            const row = `
                <tr>
                    <td>${category.name || "N/A"}</td>
                    <td>${category.plans ? category.plans.length : 0}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openEditCategoryModal(${category.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="openDeleteCategoryModal(${category.id})">Delete</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        generateCategoryPagination();
    }

    function generatePlanPagination() {
        const pagination = document.getElementById("pagination-plans");
        pagination.innerHTML = "";
        if (planTotalPages <= 1) return;

        pagination.innerHTML += `
            <li class="page-item ${planPage === 0 ? "disabled" : ""}">
                <button class="page-link" onclick="changePlanPage(${planPage - 1})">«</button>
            </li>`;
        for (let i = 0; i < planTotalPages; i++) {
            pagination.innerHTML += `
                <li class="page-item ${i === planPage ? "active" : ""}">
                    <button class="page-link" onclick="changePlanPage(${i})">${i + 1}</button>
                </li>`;
        }
        pagination.innerHTML += `
            <li class="page-item ${planPage === planTotalPages - 1 ? "disabled" : ""}">
                <button class="page-link" onclick="changePlanPage(${planPage + 1})">»</button>
            </li>`;
    }

    function generateCategoryPagination() {
        document.getElementById("pagination-categories").innerHTML = "";
    }

    window.changePlanPage = function (page) {
        if (page < 0 || page >= planTotalPages) return;
        planPage = page;
        fetchPlans();
    };

    window.applyFilters = function () {
        planPage = 0;
        fetchPlans();
    };

    window.applyCategoryFilters = function () {
        const nameFilter = document.getElementById("search-category-name").value.toLowerCase();
        filteredCategories = categories.filter(category =>
            !nameFilter || category.name.toLowerCase().includes(nameFilter)
        );
        displayCategories();
    };

    window.clearFilters = function () {
        document.getElementById("search-plan-name").value = "";
        document.getElementById("filter-price").value = "";
        document.getElementById("filter-status").value = "";
        document.getElementById("filter-category").value = "";
        applyFilters();
    };

    window.clearCategoryFilters = function () {
        document.getElementById("search-category-name").value = "";
        applyCategoryFilters();
    };

    window.toggleView = function (section) {
        document.getElementById("plans").style.display = section === "plans" ? "block" : "none";
        document.getElementById("categories").style.display = section === "categories" ? "block" : "none";
    };

    window.openAddPlanModal = function () {
        document.getElementById("addPlanModalLabel").textContent = "Add Plan";
        document.getElementById("plan-form").reset();
        document.getElementById("plan-id").value = "";
    };

    window.openEditPlanModal = async function (id) {
        try {
            const response = await fetch(`${BASE_URL}/plans/${id}`, {
                headers: { "Authorization": `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error("Failed to fetch plan");
            const plan = await response.json();
            document.getElementById("addPlanModalLabel").textContent = "Edit Plan";
            document.getElementById("plan-id").value = plan.id;
            document.getElementById("plan-name").value = plan.name;
            document.getElementById("plan-category").value = plan.category ? plan.category.id : "";
            document.getElementById("plan-price").value = plan.price;
            document.getElementById("plan-validity").value = plan.validity;
            document.getElementById("plan-data-limit").value = plan.dataLimit;
            document.getElementById("plan-sms-limit").value = plan.smsLimit;
            document.getElementById("plan-call-limit").value = plan.callLimit;
            document.getElementById("plan-status").value = plan.status;
            new bootstrap.Modal(document.getElementById("addPlanModal")).show();
        } catch (error) {
            showToast("Error fetching plan details", "danger");
        }
    };

    window.handlePlanFormSubmit = async function (event) {
        event.preventDefault();
        const id = document.getElementById("plan-id").value;
        const plan = {
            id: id ? parseInt(id) : undefined,
            category: { id: parseInt(document.getElementById("plan-category").value) },
            name: document.getElementById("plan-name").value,
            price: parseFloat(document.getElementById("plan-price").value),
            validity: parseInt(document.getElementById("plan-validity").value),
            dataLimit: document.getElementById("plan-data-limit").value,
            smsLimit: document.getElementById("plan-sms-limit").value,
            callLimit: document.getElementById("plan-call-limit").value,
            status: document.getElementById("plan-status").value,
        };

        try {
            const url = id ? `${BASE_URL}/plans/${id}` : `${BASE_URL}/plans`;
            const method = id ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(plan),
            });
            if (!response.ok) throw new Error("Failed to save plan");
            showToast(id ? "Plan updated successfully" : "Plan added successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("addPlanModal")).hide();
            fetchPlans();
        } catch (error) {
            showToast("Error saving plan", "danger");
        }
    };

    window.openAddCategoryModal = function () {
        document.getElementById("addCategoryModalLabel").textContent = "Add Category";
        document.getElementById("category-form").reset();
        document.getElementById("category-id").value = "";
    };

    window.openEditCategoryModal = async function (id) {
        try {
            const response = await fetch(`${BASE_URL}/categories/${id}`, {
                headers: { "Authorization": `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error("Failed to fetch category");
            const category = await response.json();
            document.getElementById("addCategoryModalLabel").textContent = "Edit Category";
            document.getElementById("category-id").value = category.id;
            document.getElementById("category-name").value = category.name;
            new bootstrap.Modal(document.getElementById("addCategoryModal")).show();
        } catch (error) {
            showToast("Error fetching category details", "danger");
        }
    };

    window.handleCategoryFormSubmit = async function (event) {
        event.preventDefault();
        const id = document.getElementById("category-id").value;
        const category = {
            id: id ? parseInt(id) : undefined,
            name: document.getElementById("category-name").value,
        };

        try {
            const url = id ? `${BASE_URL}/categories/${id}` : `${BASE_URL}/categories`;
            const method = id ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(category),
            });
            if (!response.ok) throw new Error("Failed to save category");
            showToast(id ? "Category updated successfully" : "Category added successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("addCategoryModal")).hide();
            fetchCategories();
        } catch (error) {
            showToast("Error saving category", "danger");
        }
    };

    window.openDeletePlanModal = function (id) {
        const plan = plans.find(p => p.id === id);
        document.getElementById("delete-plan-name").textContent = plan.name;
        document.getElementById("delete-plan-details").innerHTML = `
            <p><strong>Category:</strong> ${plan.categoryName || "N/A"}</p>
            <p><strong>Price:</strong> ${plan.price}</p>
            <p><strong>Status:</strong> ${plan.status}</p>
        `;
        document.getElementById("deletePlanModal").dataset.planId = id;
        new bootstrap.Modal(document.getElementById("deletePlanModal")).show();
    };

    window.confirmDeletePlan = async function () {
        const id = document.getElementById("deletePlanModal").dataset.planId;
        try {
            const response = await fetch(`${BASE_URL}/plans/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error("Failed to delete plan");
            showToast("Plan deleted successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("deletePlanModal")).hide();
            fetchPlans();
        } catch (error) {
            showToast("Error deleting plan", "danger");
        }
    };

    window.openDeleteCategoryModal = function (id) {
        const category = categories.find(c => c.id === id);
        document.getElementById("delete-category-name").textContent = category.name;
        document.getElementById("delete-category-details").innerHTML = `
            <p><strong>Plans:</strong> ${category.plans ? category.plans.length : 0}</p>
        `;
        document.getElementById("deleteCategoryModal").dataset.categoryId = id;
        new bootstrap.Modal(document.getElementById("deleteCategoryModal")).show();
    };

    window.confirmDeleteCategory = async function () {
        const id = document.getElementById("deleteCategoryModal").dataset.categoryId;
        try {
            const response = await fetch(`${BASE_URL}/categories/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error("Failed to delete category");
            showToast("Category deleted successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("deleteCategoryModal")).hide();
            fetchCategories();
        } catch (error) {
            showToast("Error deleting category", "danger");
        }
    };

    window.exportPlans = function () {
        let csvContent = "data:text/csv;charset=utf-8,Name,Category,Price,Validity,Data Limit,SMS Limit,Call Limit,Status\n";
        filteredPlans.forEach(plan => {
            const row = [
                plan.name,
                plan.categoryName || "N/A",
                plan.price,
                plan.validity,
                plan.dataLimit,
                plan.smsLimit,
                plan.callLimit,
                plan.status,
            ].join(",");
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plans.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.exportPlanPDF = function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const headers = ["Name", "Category", "Price", "Validity", "Data Limit", "SMS Limit", "Call Limit", "Status"];
        const rows = filteredPlans.map(plan => [
            plan.name,
            plan.categoryName || "N/A",
            plan.price,
            plan.validity,
            plan.dataLimit,
            plan.smsLimit,
            plan.callLimit,
            plan.status,
        ]);
        doc.text("Plans List", 14, 10);
        doc.autoTable({ head: [headers], body: rows, startY: 20 });
        doc.save("plans.pdf");
    };

    window.exportCategories = function () {
        let csvContent = "data:text/csv;charset=utf-8,Name,Number of Plans\n";
        filteredCategories.forEach(category => {
            const row = [category.name, category.plans ? category.plans.length : 0].join(",");
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "categories.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.exportCategoryPDF = function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const headers = ["Name", "Number of Plans"];
        const rows = filteredCategories.map(category => [
            category.name,
            category.plans ? category.plans.length : 0,
        ]);
        doc.text("Categories List", 14, 10);
        doc.autoTable({ head: [headers], body: rows, startY: 20 });
        doc.save("categories.pdf");
    };

    fetchCategories();
    fetchPlans();
});

// Notification Management
document.addEventListener("DOMContentLoaded", function () {
    let subscribers = [];
    let notifications = JSON.parse(sessionStorage.getItem("notifications")) || [];
    let currentNotificationPage = 1;
    const notificationsPerPage = 5;
    let selectedAction, selectedNotificationId;

    // Fetch subscribers from data.json
    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            subscribers = data.subscribers;
            populateSubscriberList();
            populateGroupDropdown();
        })
        .catch(error => console.error("Error fetching subscribers:", error));

    // Populate subscriber list
    function populateSubscriberList() {
        let subscriberList = document.getElementById("subscriberList");
        subscriberList.innerHTML = "";
        subscribers.forEach(subscriber => {
            let option = document.createElement("option");
            option.value = subscriber.name;
            subscriberList.appendChild(option);
        });
    }

    // Populate group dropdown
    function populateGroupDropdown() {
        let groupSelect = document.getElementById("groupSelect");
        let uniquePlans = [...new Set(subscribers.map(sub => sub.plan))];
        groupSelect.innerHTML = `<option value="">Select Group</option>`;
        uniquePlans.forEach(plan => {
            let option = document.createElement("option");
            option.value = plan;
            option.textContent = plan;
            groupSelect.appendChild(option);
        });
    }

    // Send Notification
    document.getElementById("notificationForm").addEventListener("submit", function (event) {
        event.preventDefault();
        let subscriberName = document.getElementById("subscriberSelect").value.trim();
        let messageContent = document.getElementById("messageContent").value.trim();
        let notificationType = document.getElementById("notificationType").value;
        let selectedGroup = document.getElementById("groupSelect").value;
        let errorMessage = document.getElementById("errorMessage");

        if (messageContent.length < 10) {
            errorMessage.textContent = "Message must be at least 10 characters.";
            return;
        }
        errorMessage.textContent = "";

        let recipients = [];

        if (notificationType === "all") {
            recipients = subscribers;
        } else if (notificationType === "group") {
            recipients = subscribers.filter(subscriber => subscriber.plan === selectedGroup);
            if (recipients.length === 0) {
                errorMessage.textContent = "No subscribers found in the selected group.";
                return;
            }
        } else {
            let subscriber = subscribers.find(s => s.name === subscriberName);
            if (!subscriber) {
                errorMessage.textContent = "Please select a valid subscriber.";
                return;
            }
            recipients.push(subscriber);
        }

        recipients.forEach(subscriber => {
            let newNotification = {
                id: notifications.length ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
                subscriber: subscriber.name,
                mobile: subscriber.mobile,
                message: messageContent,
                date: new Date().toLocaleString(),
                status: "Pending"
            };
            notifications.push(newNotification);
        });

        sessionStorage.setItem("notifications", JSON.stringify(notifications));
        renderNotifications();

        setTimeout(() => {
            notifications.forEach(notification => {
                if (notification.status === "Pending") notification.status = "Sent";
            });
            sessionStorage.setItem("notifications", JSON.stringify(notifications));
            renderNotifications();
        }, 1000);

        document.getElementById("messageContent").value = "";
    });

    // Render notifications
    function renderNotifications() {
        let tableBody = document.getElementById("notificationHistoryList");
        tableBody.innerHTML = "";
        let filteredData = filterNotifications();
        let start = (currentNotificationPage - 1) * notificationsPerPage;
        let paginatedData = filteredData.slice(start, start + notificationsPerPage);

        paginatedData.forEach(notification => {
            let statusBadge = getStatusBadge(notification.status);
            let row = `<tr>
                <td>${notification.id}</td>
                <td>${notification.subscriber}</td>
                <td>${notification.mobile}</td>
                <td>${notification.date}</td>
                <td>${notification.message}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="confirmNotificationAction('resend', ${notification.id})">Resend</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmNotificationAction('delete', ${notification.id})">Delete</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        updateNotificationPagination();
    }

    function getStatusBadge(status) {
        let badgeClass = status === "Sent" ? "success" : status === "Pending" ? "warning" : status === "Resending" ? "info" : "primary";
        return `<span class="badge bg-${badgeClass}">${status}</span>`;
    }

    document.getElementById("searchInput").addEventListener("input", function () {
        currentNotificationPage = 1;
        renderNotifications();
    });

    function filterNotifications() {
        let searchValue = document.getElementById("searchInput").value.toLowerCase();
        return notifications.filter(n => n.status.toLowerCase().includes(searchValue));
    }

    function updateNotificationPagination() {
        let pagination = document.getElementById("pagination3");
        pagination.innerHTML = "";
        let totalPages = Math.ceil(filterNotifications().length / notificationsPerPage);
        if (totalPages <= 1) return;

        pagination.innerHTML += `<li class="page-item ${currentNotificationPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changeNotificationPage(${currentNotificationPage - 1})">&laquo;</a>
        </li>`;

        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `<li class="page-item ${i === currentNotificationPage ? "active" : ""}">
                <a class="page-link" href="#" onclick="changeNotificationPage(${i})">${i}</a>
            </li>`;
        }

        pagination.innerHTML += `<li class="page-item ${currentNotificationPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changeNotificationPage(${currentNotificationPage + 1})">&raquo;</a>
        </li>`;
    }

    window.changeNotificationPage = function (page) {
        currentNotificationPage = page;
        renderNotifications();
    };

    document.getElementById("clearHistory").addEventListener("click", function () {
        let clearHistoryModal = new bootstrap.Modal(document.getElementById("clearHistoryModal"));
        clearHistoryModal.show();
    });

    document.getElementById("confirmClearHistory").addEventListener("click", function () {
        notifications = [];
        localStorage.setItem("notifications", JSON.stringify(notifications));
        renderNotifications();

        let clearHistoryModal = bootstrap.Modal.getInstance(document.getElementById("clearHistoryModal"));
        clearHistoryModal.hide();
    });

    window.confirmNotificationAction = function (action, id) {
        selectedAction = action;
        selectedNotificationId = id;
        document.getElementById("notificationModalBody").textContent = `Are you sure you want to ${action} this notification?`;
        new bootstrap.Modal(document.getElementById("notificationConfirmationModal")).show();
    };

    document.getElementById("notificationConfirmAction").addEventListener("click", function () {
        if (selectedAction === "delete") {
            notifications = notifications.filter(n => n.id !== selectedNotificationId);
        } else if (selectedAction === "resend") {
            let originalNotification = notifications.find(n => n.id === selectedNotificationId);
            if (originalNotification) {
                notifications.push({ ...originalNotification, id: notifications.length + 1, status: "Pending" });
            }
        }

        localStorage.setItem("notifications", JSON.stringify(notifications));
        renderNotifications();
        bootstrap.Modal.getInstance(document.getElementById("notificationConfirmationModal")).hide();
    });

    document.getElementById("downloadedHistory").addEventListener("click", function () {
       
        let notificationData = localStorage.getItem("notifications");
        if (!notificationData) {
            showModal("notificationNoDataModal");
            return;
        }
    
        let notifications = JSON.parse(notificationData);
        if (notifications.length === 0) {
            showModal("notificationNoDataModal");
            return;
        }

        if (typeof window.jspdf === "undefined" || typeof window.jspdf.jsPDF === "undefined") {
            return;
        }
        const { jsPDF } = window.jspdf;
        let doc = new jsPDF("p", "mm", "a4");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Notification History", 14, 15);

        let rows = notifications.map((n, index) => [
            index + 1,                 
            n.subscriber || "N/A",    
            n.mobile || "N/A",      
            n.date || "N/A",           
            n.message || "N/A",       
            
            n.status || "N/A"          
        ]);
        doc.autoTable({
            startY: 20,
            head: [["ID", "Subscriber", "Mobile", "Date & Time", "Message", "Status"]],
            body: rows,
            theme: "grid",
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold" }
        });

        doc.save("Notification_History.pdf");
    });
    
    renderNotifications();
});

// Profile Management
document.addEventListener("DOMContentLoaded", function () {
    const BASE_URL = "http://localhost:8083/admin";
    let adminUsername;

    function logError(message, error) {
        console.error(`${message}:`, {
            message: error.message,
            stack: error.stack,
            status: error.status || 'N/A'
        });
    }

    async function loadAdminProfile() {
        if (!checkAuth()) return;
    
        const jwtToken = getToken();
        const decodedToken = parseJwt(jwtToken);
    
        if (!decodedToken || !decodedToken.sub) {
            showToast("Invalid or missing token. Please log in again.", "danger");
            setTimeout(() => window.location.href = "login.html", 2000);
            return;
        }
    
        adminUsername = decodedToken.sub;
    
        try {
            const url = `${BASE_URL}/profile/${encodeURIComponent(adminUsername)}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${jwtToken}`,
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                throw Object.assign(new Error(`HTTP ${response.status}: ${errorText || "Failed to fetch profile"}`), { status: response.status });
            }
    
            const profile = await response.json();
    
            document.getElementById("username").value = profile.username || "";
            document.getElementById("email").value = profile.email || adminUsername;
            document.getElementById("contact").value = profile.contact || "";
            document.getElementById("address").value = profile.address || "";
    
            const profileImageElement = document.getElementById("profileImage");
            const navbarAvatarElement = document.getElementById("navbarAvatar");
            const defaultImage = "../assesst/Images/profile.jpeg";
    
            if (profile.profileImage && profile.profileImage.startsWith("data:image")) {
                profileImageElement.src = profile.profileImage;
                navbarAvatarElement.src = profile.profileImage;
            } else if (profile.profileImage && /^https?:\/\//.test(profile.profileImage)) {
                profileImageElement.src = profile.profileImage;
                navbarAvatarElement.src = profile.profileImage;
            } else {
                profileImageElement.src = defaultImage;
                navbarAvatarElement.src = defaultImage;
                console.warn("Profile image not set or invalid, using default:", defaultImage);
            }
    
            document.getElementById("email").setAttribute("readonly", true);
            document.getElementById("username").setAttribute("readonly", true);
    
        } catch (error) {
            logError("Error loading profile", error);
            if (error.status === 401 || error.status === 403) {
                showToast("Unauthorized access. Please log in again.", "danger");
                setTimeout(() => window.location.href = "/login.html", 2000);
            } else if (error.status === 404) {
                showToast("Profile not found.", "warning");
            } else {
                showToast(`Failed to load profile: ${error.message}`, "danger");
            }
            document.getElementById("username").value = "";
            document.getElementById("email").value = adminUsername || "";
            document.getElementById("contact").value = "";
            document.getElementById("address").value = "";
            document.getElementById("profileImage").src = "../assesst/Images/profile.jpeg";
            document.getElementById("navbarAvatar").src = "../assesst/Images/profile.jpeg";
        }
    }

    document.getElementById("editProfileImage").addEventListener("click", function () {
        document.getElementById("imageUpload").click();
    });

    document.getElementById("imageUpload").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById("profileImage").src = e.target.result;
                document.getElementById("navbarAvatar").src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("togglePasswordFields").addEventListener("click", function () {
        const passwordFields = document.getElementById("passwordFields");
        passwordFields.style.display = passwordFields.style.display === "none" ? "block" : "none";
    });

    function validateInput(input, errorId, condition, errorMessage) {
        const errorElement = document.getElementById(errorId);
        if (!condition) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove("d-none");
            return false;
        } else {
            errorElement.classList.add("d-none");
            return true;
        }
    }

    document.getElementById("profileForm").addEventListener("input", function (event) {
        document.getElementById(event.target.id + "Error")?.classList.add("d-none");
    });

    document.getElementById("updateProfile").addEventListener("click", async function (event) {
        event.preventDefault();
    
        if (!checkAuth()) return;
    
        const username = document.getElementById("username").value.trim();
        const contact = document.getElementById("contact").value.trim();
        const address = document.getElementById("address").value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const profileImage = document.getElementById("profileImage").src;
        const passwordFields = document.getElementById("passwordFields");
    
        const isContactValid = validateInput(contact, "contactError", /^\d{10}$/.test(contact), "Invalid contact number (10 digits required)");
        const isAddressValid = validateInput(address, "addressError", address !== "", "Address cannot be empty");
    
        let isPasswordValid = true;
        let isPasswordMatch = true;
    
        if (passwordFields.style.display === "block" && newPassword) {
            isPasswordValid = validateInput(newPassword, "passwordError", newPassword.length >= 6, "Password must be at least 6 characters");
            isPasswordMatch = validateInput(confirmPassword, "confirmPasswordError", newPassword === confirmPassword, "Passwords do not match");
        }
    
        // Check image size (no format restriction)
        const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit
        let isImageSizeValid = true;
    
        if (profileImage.startsWith("data:image")) {
            // Extract MIME type for logging (optional)
            const mimeType = profileImage.split(",")[0].match(/data:([^;]+)/)[1];
            console.log("Image MIME Type:", mimeType); // Debug log
    
            // Validate image size
            const imageSizeBytes = profileImage.length; // Rough size in bytes
            const approxFileSizeBytes = Math.round(imageSizeBytes * 0.75); // Approximate decoded size
            console.log(`Profile Image Size: ${approxFileSizeBytes} bytes`); // Debug log
            if (approxFileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
                showToast(`Image size (${(approxFileSizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the 2MB limit. Please select a smaller image.`, "warning");
                isImageSizeValid = false;
            }
        }
    
        if (isContactValid && isAddressValid && isPasswordValid && isPasswordMatch && isImageSizeValid) {
            const profileData = {
                username: username,
                email: document.getElementById("email").value,
                contact: contact,
                address: address,
                password: newPassword || undefined,
                profileImage: profileImage.startsWith("data:image") ? profileImage : undefined
            };
    
            try {
                const response = await fetch(`${BASE_URL}/profile/${encodeURIComponent(adminUsername)}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify(profileData),
                });
    
                if (!response.ok) {
                    const errorText = await response.text();
                    throw Object.assign(new Error(`HTTP ${response.status}: ${errorText || "Failed to update profile"}`), { status: response.status });
                }
    
                const updatedProfile = await response.json();
    
                document.getElementById("contact").value = updatedProfile.contact || "";
                document.getElementById("address").value = updatedProfile.address || "";
                document.getElementById("profileImage").src = updatedProfile.profileImage || "../assesst/Images/profile.jpeg";
                document.getElementById("navbarAvatar").src = updatedProfile.profileImage || "../assesst/Images/profile.jpeg";
    
                document.getElementById("newPassword").value = "";
                document.getElementById("confirmPassword").value = "";
                document.getElementById("passwordFields").style.display = "none";
    
                showToast("Profile updated successfully!", "success");
                const toastElement = document.getElementById("updateToast");
                if (toastElement) {
                    var toast = new bootstrap.Toast(toastElement);
                    toast.show();
                } else {
                    console.warn("Toast element 'updateToast' not found in HTML.");
                }
    
            } catch (error) {
                logError("Error updating profile", error);
                if (error.status === 401 || error.status === 403) {
                    showToast("Unauthorized. Please log in again.", "danger");
                    setTimeout(() => window.location.href = "/login.html", 2000);
                } else {
                    showToast(`Failed to update profile: ${error.message}`, "danger");
                }
            }
        }
    });
    loadAdminProfile();
});

// Report and Analysis
document.addEventListener("DOMContentLoaded", function () {
    let revenueChart, dailyRechargeChart, rechargePlanChart, paymentModeChart;
    const BASE_URL = "http://localhost:8083/admin";

    // Fetch Data from Backend API
    fetchReportData();

    function fetchReportData() {
        const jwtToken = getToken(); // Assuming getToken() is defined as in your previous code
        if (!jwtToken) {
            showToast("Please log in to view reports.", "danger");
            setTimeout(() => window.location.href = "login.html", 2000);
            return;
        }

        fetch(`${BASE_URL}/reports/analytics`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "Content-Type": "application/json",
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch report data`);
            }
            return response.json();
        })
        .then(data => {
            updateSummaryCards(data);
            generateCharts(data);
        })
        .catch(error => {
            console.error("Error fetching report data:", error);
            showToast(`Failed to load reports: ${error.message}`, "danger");
            if (error.message.includes("401") || error.message.includes("403")) {
                showToast("Unauthorized access. Please log in again.", "danger");
                setTimeout(() => window.location.href = "/login.html", 2000);
            }
        });
    }

    // Update Summary Cards
    function updateSummaryCards(data) {
        document.getElementById("totalRevenues").innerHTML = `<b>${data.summary.totalRevenue} (This Month)</b>`;
        document.getElementById("totalRecharge").innerHTML = `<b>${data.summary.totalRecharge} (This Month)</b>`;
        document.getElementById("newSubscribers").innerHTML = `<b>${data.summary.newSubscribers} (This Month)</b>`;
    }

    // Generate Charts using Chart.js
    function generateCharts(data) {
        let revenueCtx = document.getElementById("revenueChart").getContext("2d");
        revenueChart = new Chart(revenueCtx, {
            type: "line",
            data: {
                labels: data.revenueOverview.labels,
                datasets: [{
                    label: "Revenue (₹)",
                    data: data.revenueOverview.values,
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgb(20, 145, 122)",
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        let dailyRechargeCtx = document.getElementById("dailyRechargeChart").getContext("2d");
        dailyRechargeChart = new Chart(dailyRechargeCtx, {
            type: "bar",
            data: {
                labels: data.dailyRecharge.labels,
                datasets: [{
                    label: "Daily Recharge (₹)",
                    data: data.dailyRecharge.values,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgb(237, 13, 61)",
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        let rechargePlanCtx = document.getElementById("rechargePlanChart").getContext("2d");
        rechargePlanChart = new Chart(rechargePlanCtx, {
            type: "pie",
            data: {
                labels: data.rechargePlanPopularity.labels,
                datasets: [{
                    data: data.rechargePlanPopularity.values,
                    backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        let paymentModeCtx = document.getElementById("paymentModeChart").getContext("2d");
        paymentModeChart = new Chart(paymentModeCtx, {
            type: "doughnut",
            data: {
                labels: data.paymentModeUsage.labels,
                datasets: [{
                    data: data.paymentModeUsage.values,
                    backgroundColor: ['#673AB7', '#03A9F4', '#FF9800']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
});

// PDF Generation Functions (unchanged)
function generatePDF(sectionId, fileName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const headerTitle = "Mobi.Comm Service";
    const reportTitle = fileName.replace('.pdf', '');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(headerTitle, 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(reportTitle, 105, 25, { align: "center" });
    document.querySelectorAll(".downloadBtn").forEach(btn => btn.style.display = "none");

    html2canvas(document.getElementById(sectionId)).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 150;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, "PNG", 10, 45, imgWidth, imgHeight);

        document.querySelectorAll(".downloadBtn").forEach(btn => btn.style.display = "block");
        doc.save(fileName);
    });
}

function generateFullReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const headerTitle = "Mobi.Comm Service";
    const reportTitle = "Full Reports & Analytics";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(headerTitle, 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(reportTitle, 105, 25, { align: "center" });
    document.querySelectorAll(".downloadBtn").forEach(btn => btn.style.display = "none");

    html2canvas(document.getElementById("reportAndAnalysis")).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, "PNG", 10, 35, imgWidth, imgHeight);
        document.querySelectorAll(".downloadBtn").forEach(btn => btn.style.display = "block");
        doc.save("Full_Report.pdf");
    });
}
document.addEventListener("DOMContentLoaded", function () {
    let notifications = [
        {
            id: 1,
            user: "Yuvasree",
            date: "26 Feb 2025, 10:15 AM",
            message: "I recharged with ₹599, but the plan hasn't been activated yet. Please check.",
            status: "Pending"
        },
        {
            id: 2,
            user: "Subscriber 1",
            date: "26 Feb 2025, 11:30 AM",
            message: "I want to upgrade from the Basic Plan to the Ultimate Plan. Kindly assist.",
            status: "In Progress"
        },
        {
            id: 3,
            user: "Subscriber 2",
            date: "26 Feb 2025, 12:05 PM",
            message: "I tried to pay via UPI, but the transaction failed. The amount was deducted. Help me!",
            status: "Resolved"
        }
    ];

    const notificationList = document.getElementById("notificationList");
    const filterStatus = document.getElementById("filterStatus");

    // Function to Render Notifications
    function renderNotifications() {
        notificationList.innerHTML = "";

        let filteredNotifications = notifications.filter(notif => 
            filterStatus.value === "all" || notif.status === filterStatus.value
        );

        if (filteredNotifications.length === 0) {
            notificationList.innerHTML = `<p class="text-muted">No notifications available.</p>`;
            return;
        }

        filteredNotifications.forEach(notification => {
            const notifCard = document.createElement("div");
            notifCard.classList.add("card", "mb-3");
            notifCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${notification.user} - <span class="badge bg-${getStatusColor(notification.status)}">${notification.status}</span></h5>
                    <p class="text-muted">${notification.date}</p>
                    <p>${notification.message}</p>
                    <select class="form-select status-select" data-id="${notification.id}">
                        <option value="Pending" ${notification.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="In Progress" ${notification.status === "In Progress" ? "selected" : ""}>In Progress</option>
                        <option value="Resolved" ${notification.status === "Resolved" ? "selected" : ""}>Resolved</option>
                    </select>
                    <button class="btn btn-danger btn-sm mt-2 delete-btn" data-id="${notification.id}">Delete</button>
                </div>
            `;
            notificationList.appendChild(notifCard);
        });

        // Event Listeners for Status Change & Delete
        document.querySelectorAll(".status-select").forEach(select => {
            select.addEventListener("change", updateStatus);
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", deleteNotification);
        });
    }

    function updateStatus(event) {
        const notificationId = parseInt(event.target.getAttribute("data-id"));
        const newStatus = event.target.value;
        notifications = notifications.map(notif => notif.id === notificationId ? { ...notif, status: newStatus } : notif);
        renderNotifications();
    }

    function deleteNotification(event) {
        const notificationId = parseInt(event.target.getAttribute("data-id"));
        notifications = notifications.filter(notif => notif.id !== notificationId);
        renderNotifications();
    }

    function getStatusColor(status) {
        return status === "Pending" ? "danger" : status === "In Progress" ? "warning" : "success";
    }

    filterStatus.addEventListener("change", renderNotifications);

    renderNotifications();
});