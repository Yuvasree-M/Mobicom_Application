function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function getToken() {
    return sessionStorage.getItem("jwtToken");
}

function checkAuth(redirect = true) {
    const token = getToken();
    if (!token) {
        if (redirect) {
            showToast("Please log in to access this page", "danger");
            setTimeout(() => window.location.href = "login.html", 2000);
        }
        return false;
    }
    return true;
}

function showToast(message, type) {
    const toastContainer = document.getElementById("toastContainer") || document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "1050";
    if (!document.getElementById("toastContainer")) document.body.appendChild(toastContainer);
    toastContainer.innerHTML = `
        <div class="toast show text-white bg-${type}" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    setTimeout(() => toastContainer.innerHTML = "", 3000);
}


document.addEventListener("DOMContentLoaded", function () {
    showPage("dashboard");
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const pageId = this.getAttribute("onclick").match(/'([^']+)'/)[1];
            showPage(pageId);
        });
    });
    setAdminTooltip();
});

function showPage(pageId) {
    document.querySelectorAll(".content-section").forEach(section => section.style.display = "none");
    const selectedSection = document.getElementById(pageId);
    if (selectedSection) selectedSection.style.display = "block";
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("onclick")?.includes(pageId)) link.classList.add("active");
    });
}

// Scroll to Top
window.onscroll = function () {
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
        scrollTopBtn.style.display = (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) ? "block" : "none";
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Admin Tooltip
async function setAdminTooltip() {
    const tooltipElement = document.getElementById('adminTooltip');
    if (!tooltipElement) {
        return;
    }

    if (!checkAuth(false)) {
        tooltipElement.setAttribute('data-bs-title', 'Please log in');
        return;
    }

    try {
        const token = getToken();
        const response = await fetch('http://localhost:8083/admin/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch admin profile'}`);
        }

        const profileData = await response.json();
        tooltipElement.setAttribute('data-bs-title', profileData.name || 'Admin');
    } catch (error) {
        tooltipElement.setAttribute('data-bs-title', 'Error loading profile');
        showToast(`Failed to load admin profile: ${error.message}`, "danger");
    }
}

// Dashboard Management
async function notifyUser(name, phone, email, expiryDate) {
    try {
        if (!checkAuth()) throw new Error("No JWT token found. Please log in.");
        if (!expiryDate || typeof expiryDate !== 'string') throw new Error("Expiry date is missing or invalid");

        const payload = {
            name,
            phone,
            email: email || 'Not provided',
            expiryDate,
        };

        // Send POST request to backend API
        const response = await fetch('http://localhost:8083/admin/notify-expiry', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send notification: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const modalElements = {
            userName: document.getElementById('notifyUserName'),
            userPhone: document.getElementById('notifyUserPhone'),
            message: document.getElementById('notifyMessage'),
            modalLabel: document.getElementById('notifyModalLabel'),
        };

        if (!Object.values(modalElements).every(el => el)) {
            throw new Error("Modal elements not found in the DOM");
        }

        modalElements.userName.textContent = name;
        modalElements.userPhone.textContent = phone;
        modalElements.message.textContent = `User has been notified about their plan expiry. Email sent to ${email || 'Not provided'}.`;
        modalElements.modalLabel.textContent = "Notification Sent";

        const notifyModal = new bootstrap.Modal(document.getElementById('notifyModal'), { keyboard: true });
        notifyModal.show();
    } catch (error) {
    
        const modalElements = {
            userName: document.getElementById('notifyUserName'),
            userPhone: document.getElementById('notifyUserPhone'),
            message: document.getElementById('notifyMessage'),
            modalLabel: document.getElementById('notifyModalLabel'),
        };

        if (Object.values(modalElements).every(el => el)) {
            modalElements.userName.textContent = name;
            modalElements.userPhone.textContent = phone;
            modalElements.message.textContent = `Failed to send notification email: ${error.message}`;
            modalElements.modalLabel.textContent = "Notification Failed";
            const notifyModal = new bootstrap.Modal(document.getElementById('notifyModal'), { keyboard: true });
            notifyModal.show();
        } else {
            showToast(`Notification failed: ${error.message}`, "danger");
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    let dashboardCurrentPage = 1;
    let dashboardRecordsPerPage = 5;
    let subscriberData = [];

    async function fetchDataAndUpdate() {
        if (!checkAuth()) return;

        try {
            const response = await fetch('http://localhost:8083/admin/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }

            const data = await response.json();
            subscriberData = data.expiringSubscribers || [];
            updateDashboard(data);
            updateTable();
        } catch (error) {
            displayError(`Failed to load dashboard data: ${error.message}`);
        }
    }

    function displayError(message) {
        const tableBody = document.getElementById("expiringSubscribersTable");
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="text-danger text-center">${message}</td></tr>`;
        ['totalSubscribers', 'activePlans', 'expiringPlans', 'totalRevenue'].forEach(id => {
            document.getElementById(id).innerHTML = `<b>N/A</b>`;
        });
        document.getElementById("pagination").innerHTML = "";
    }

    function updateDashboard(data) {
        document.getElementById("totalSubscribers").innerHTML = `<b>${data.totalSubscribers || 0}</b>`;
        document.getElementById("activePlans").innerHTML = `<b>${data.activePlans || 0}</b>`;
        document.getElementById("expiringPlans").innerHTML = `<b>${data.expiringSubscribersCount || 0}</b>`;
        const currentMonth = new Date().toISOString().slice(0, 7);
        const revenue = data.monthlyRevenue?.[currentMonth] || 0;
        document.getElementById("totalRevenue").innerHTML = `<b>₹${revenue.toFixed(2)}</b>`;
    }

    function updateTable() {
        const tableBody = document.getElementById("expiringSubscribersTable");
        if (!tableBody) return;
        tableBody.innerHTML = "";

        const start = (dashboardCurrentPage - 1) * dashboardRecordsPerPage;
        const end = start + dashboardRecordsPerPage;
        const paginatedData = subscriberData.slice(start, end);

        if (paginatedData.length === 0 && dashboardCurrentPage === 1) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No expiring subscribers found.</td></tr>';
        } else {
            paginatedData.forEach(subscriber => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${subscriber.name || 'N/A'}</td>
                        <td>${subscriber.phone || 'N/A'}</td>
                        <td>${subscriber.plan || 'N/A'}</td>
                        <td>${subscriber.price || 'N/A'}</td>
                        <td>${subscriber.validity || 'N/A'}</td>
                        <td>${subscriber.rechargeDate || 'N/A'}</td>
                        <td>${subscriber.expiryDate || 'N/A'}</td>
                        <td><button class="btn btn-warning" onclick="notifyUser('${subscriber.name || ''}', '${subscriber.phone || ''}', '${subscriber.email || ''}', '${subscriber.expiryDate || ''}')">Notify</button></td>
                    </tr>`;
            });
        }

        updatePaginationControls();
    }

    function updatePaginationControls() {
        const paginationContainer = document.getElementById("pagination");
        if (!paginationContainer) return;
        paginationContainer.innerHTML = "";

        const totalPages = Math.ceil(subscriberData.length / dashboardRecordsPerPage);
        if (totalPages <= 1) return;

        const createPageItem = (page, label = page, disabled = false, active = false) => {
            return `
                <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${page}">${label}</a>
                </li>`;
        };

        paginationContainer.innerHTML += createPageItem(dashboardCurrentPage - 1, "«", dashboardCurrentPage === 1);

        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.innerHTML += createPageItem(i, i, false, i === dashboardCurrentPage);
        }

        paginationContainer.innerHTML += createPageItem(dashboardCurrentPage + 1, "»", dashboardCurrentPage === totalPages);

        // Attach event listeners to pagination links
        Array.from(paginationContainer.querySelectorAll("a.page-link")).forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute("data-page"));
                if (!isNaN(page)) {
                    changePage(page);
                }
            });
        });
    }

    function changePage(page) {
        const totalPages = Math.ceil(subscriberData.length / dashboardRecordsPerPage);
        if (page >= 1 && page <= totalPages) {
            dashboardCurrentPage = page;
            updateTable();
        }
    }

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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch subscribers`);
            const data = await response.json();
            subscribers = data.content || [];
            filteredSubscribers = [...subscribers];
            subscriberTotalPages = data.totalPages || 1;
            displaySubscribers();
        } catch (error) {
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch all subscribers`);
            const data = await response.json();
            return data.content || [];
        } catch (error) {
            showToast("Error fetching all subscribers", "danger");
            return [];
        }
    }

    function displaySubscribers() {
        const tbody = document.getElementById("subscriber-list");
        if (!tbody) return;
        tbody.innerHTML = "";

        filteredSubscribers.forEach(subscriber => {
            tbody.innerHTML += `
                <tr>
                    <td>${subscriber.name || "N/A"}</td>
                    <td>${subscriber.email || "N/A"}</td>
                    <td>${subscriber.phoneNumber || "N/A"}</td>
                    <td><a href="${subscriber.aadhar_card || "#"}" target="_blank">View Aadhar</a></td>
                    <td><img src="${subscriber.photo || "../assesst/Images/profile.jpeg"}" alt="Photo" class="img-thumbnail" width="60"></td>
                    <td id="status-${subscriber.id}">${subscriber.status || "Pending"}</td>
                    <td>
                        <button class="btn btn-success btn-sm approve-btn">Approve</button>
                        <button class="btn btn-danger btn-sm delete-btn">Deactivate</button>
                    </td>
                </tr>`;
            const row = tbody.lastElementChild;
            row.querySelector(".approve-btn").addEventListener("click", () => showConfirmationModal(subscriber.id, "approve"));
            row.querySelector(".delete-btn").addEventListener("click", () => showConfirmationModal(subscriber.id, "delete"));
        });

        const searchInput = document.getElementById("searchSubscribers")?.value;
        if (!searchInput) generatePagination();
        else document.getElementById("pagination0").innerHTML = "";
    }

    function generatePagination() {
        const pagination = document.getElementById("pagination0");
        if (!pagination || subscriberTotalPages <= 1) return;
        pagination.innerHTML = "";

        pagination.innerHTML += `
            <li class="page-item ${subscriberCurrentPage === 1 ? "disabled" : ""}">
                <button class="page-link" onclick="changeSubscriberPage(${subscriberCurrentPage - 1})">«</button>
            </li>`;
        for (let i = 1; i <= subscriberTotalPages; i++) {
            pagination.innerHTML += `
                <li class="page-item ${i === subscriberCurrentPage ? "active" : ""}">
                    <button class="page-link" onclick="changeSubscriberPage(${i})">${i}</button>
                </li>`;
        }
        pagination.innerHTML += `
            <li class="page-item ${subscriberCurrentPage === subscriberTotalPages ? "disabled" : ""}">
                <button class="page-link" onclick="changeSubscriberPage(${subscriberCurrentPage + 1})">»</button>
            </li>`;
    }

    window.changeSubscriberPage = function (page) {
        if (page < 1 || page > subscriberTotalPages) return;
        subscriberCurrentPage = page;
        const status = document.getElementById("statusFilter")?.value || null;
        document.getElementById("searchSubscribers").value = "";
        fetchSubscribers(page - 1, status);
    };

    function showConfirmationModal(id, action) {
        const subscriber = subscribers.find(sub => sub.id === id);
        if (!subscriber) return;

        const modalBody = document.getElementById("confirmModalBody");
        const confirmText = document.getElementById("confirmText");
        const confirmActionBtn = document.getElementById("confirmActionBtn");

        modalBody.innerHTML = `
            <p><strong>Name:</strong> ${subscriber.name}</p>
            <p><strong>Email:</strong> ${subscriber.email}</p>
            <p><strong>Mobile:</strong> ${subscriber.phoneNumber}</p>
            <p><strong>Aadhar Card:</strong> <a href="${subscriber.aadhar_card || "#"}" target="_blank">View Aadhar</a></p>
            <p><strong>Photo:</strong><br><img src="${subscriber.photo || "../assesst/Images/default-avatar.jpg"}" class="img-thumbnail" width="100"></p>
        `;

        if (action === "approve") {
            confirmText.textContent = "Approve this subscriber?";
            confirmActionBtn.className = "btn btn-success";
            confirmActionBtn.textContent = "Approve";
            confirmActionBtn.onclick = () => updateSubscriberStatus(id, "ACTIVE");
        } else if (action === "delete") {
            confirmText.textContent = "Deactivate this subscriber?";
            confirmActionBtn.className = "btn btn-danger";
            confirmActionBtn.textContent = "Deactivate";
            confirmActionBtn.onclick = () => deleteSubscriber(id);
        }

        new bootstrap.Modal(document.getElementById("confirmationModal")).show();
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to update status`);
            const result = await response.json();
            showToast(result.message, newStatus === "ACTIVE" ? "success" : "warning");
            document.getElementById(`status-${id}`).textContent = newStatus;
            fetchSubscribers(subscriberCurrentPage - 1, document.getElementById("statusFilter")?.value || null);
        } catch (error) {
            showToast("Error updating status", "danger");
        }
        bootstrap.Modal.getInstance(document.getElementById("confirmationModal")).hide();
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to deactivate subscriber`);
            const result = await response.json();
            showToast(result.message, "warning");
            document.getElementById(`status-${id}`).textContent = "INACTIVE";
            fetchSubscribers(subscriberCurrentPage - 1, document.getElementById("statusFilter")?.value || null);
        } catch (error) {
            showToast("Error deactivating subscriber", "danger");
        }
        bootstrap.Modal.getInstance(document.getElementById("confirmationModal")).hide();
    }

    async function filterSubscribers() {
        const searchInput = document.getElementById("searchSubscribers").value.toLowerCase();
        const status = document.getElementById("statusFilter")?.value || null;

        if (searchInput) {
            const allSubscribers = await fetchAllSubscribers(status);
            filteredSubscribers = allSubscribers.filter(subscriber => (
                (subscriber.name && subscriber.name.toLowerCase().includes(searchInput)) ||
                (subscriber.phoneNumber && subscriber.phoneNumber.includes(searchInput)) ||
                (subscriber.status && subscriber.status.toLowerCase().includes(searchInput))
            ));
        } else {
            filteredSubscribers = [...subscribers];
        }
        displaySubscribers();
    }

    function filterByStatus() {
        subscriberCurrentPage = 1;
        document.getElementById("searchSubscribers").value = "";
        fetchSubscribers(0, document.getElementById("statusFilter")?.value || null);
    }

    document.getElementById("statusFilter")?.addEventListener("change", filterByStatus);
    document.getElementById("searchSubscribers")?.addEventListener("keyup", filterSubscribers);
    document.getElementById("exportCSV")?.addEventListener("click", async () => {
        const searchInput = document.getElementById("searchSubscribers").value;
        const status = document.getElementById("statusFilter")?.value || null;
        const data = searchInput ? filteredSubscribers : await fetchAllSubscribers(status);
        exportSubscribersToCSV(data, "subscribers.csv");
    });
    document.getElementById("exportPDF")?.addEventListener("click", async () => {
        const searchInput = document.getElementById("searchSubscribers").value;
        const status = document.getElementById("statusFilter")?.value || null;
        const data = searchInput ? filteredSubscribers : await fetchAllSubscribers(status);
        exportSubscribersToPDF(data, "subscribers.pdf");
    });

    function exportSubscribersToCSV(data, filename) {
        let csvContent = "data:text/csv;charset=utf-8,Name,Email,Mobile,Status\n";
        data.forEach(subscriber => {
            csvContent += [
                subscriber.name || "N/A",
                subscriber.email || "N/A",
                subscriber.phoneNumber || "N/A",
                subscriber.status || "Pending"
            ].join(",") + "\n";
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
        const rows = data.map(subscriber => [
            subscriber.name || "N/A",
            subscriber.email || "N/A",
            subscriber.phoneNumber || "N/A",
            subscriber.status || "Pending"
        ]);
        doc.text("Subscriber List", 14, 10);
        doc.autoTable({ head: [headers], body: rows, startY: 20 });
        doc.save(filename);
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
        if (!checkAuth()) throw new Error('No token');
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch`);
        return response.json();
    }

    async function loadAllTransactions() {
        try {
            allTransactions = await fetchWithAuth(`${apiBaseUrl}/transactions/all`);
            applyFiltersAndRender();
        } catch (error) {
            showToast("Failed to load transactions", "danger");
        }
    }

    function applyFiltersAndRender() {
        const status = document.getElementById('filterStatus')?.value;
        const payment = document.getElementById('filterPayment')?.value;
        const dateFrom = document.getElementById('filterDateFrom')?.value;
        const dateTo = document.getElementById('filterDateTo')?.value;
        const searchTerm = document.getElementById('searchTransactions')?.value.trim().toLowerCase();

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
        if (!tbody) return;
        tbody.innerHTML = filteredTransactions.length === 0
            ? `<tr><td colspan="10" class="text-center">No transactions found</td></tr>`
            : '';

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
        if (!pagination || totalPages <= 1) return;
        pagination.innerHTML = `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="changePage(${currentPage - 1})">«</button>
            </li>`;
        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="changePage(${i})">${i}</button>
                </li>`;
        }
        pagination.innerHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="changePage(${currentPage + 1})">»</button>
            </li>`;
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

    document.getElementById('exportTransactionsToCSVBtn')?.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,Transaction ID,Recharge Date,Subscriber Name,Subscriber Number,Plan Name,Plan Price,Plan Validity,Payment Method,Status\n";
        filteredTransactions.forEach(tx => {
            csvContent += [
                tx.transactionId, tx.rechargeDate, tx.subscriberName, tx.subscriberNumber,
                tx.planName, `₹${tx.planPrice.toFixed(2)}`, tx.planValidity, tx.paymentMethod, tx.status
            ].join(",") + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "transactions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('exportTransactionsToPDFBtn')?.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Transaction History", 14, 10);
        const headers = ["Transaction ID", "Recharge Date", "Subscriber Name", "Subscriber Number", "Plan Name", "Plan Price", "Plan Validity", "Payment Method", "Status"];
        const rows = filteredTransactions.map(tx => [
            tx.transactionId, tx.rechargeDate, tx.subscriberName, tx.subscriberNumber,
            tx.planName, `₹${tx.planPrice.toFixed(2)}`, tx.planValidity, tx.paymentMethod, tx.status
        ]);
        doc.autoTable({ head: [headers], body: rows, startY: 20 });
        doc.save("transactions.pdf");
    });

    ['filterStatus', 'filterPayment', 'filterDateFrom', 'filterDateTo', 'searchTransactions'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            currentPage = 1;
            applyFiltersAndRender();
        });
    });

    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        ['filterStatus', 'filterPayment', 'filterDateFrom', 'filterDateTo', 'searchTransactions'].forEach(id => {
            document.getElementById(id).value = '';
        });
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch categories`);
            categories = await response.json();
            filteredCategories = [...categories];
            populateCategoryDropdowns();
            displayCategories();
        } catch (error) {
            showToast("Error fetching categories", "danger");
        }
    }

    async function fetchPlans() {
        if (!checkAuth()) return;

        const nameFilter = document.getElementById("search-plan-name")?.value;
        const priceFilter = document.getElementById("filter-price")?.value;
        const statusFilter = document.getElementById("filter-status")?.value;
        const categoryFilter = document.getElementById("filter-category")?.value;

        let sortDir = "asc", sortBy = "price";
        if (priceFilter === "low-to-high") sortDir = "asc";
        else if (priceFilter === "high-to-low") sortDir = "desc";

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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch plans`);
            const data = await response.json();
            plans = data.content;
            filteredPlans = plans.filter(plan => !statusFilter || plan.status === statusFilter);
            planTotalPages = data.totalPages;
            displayPlans();
        } catch (error) {
            showToast("Error fetching plans", "danger");
        }
    }

    function populateCategoryDropdowns() {
        const filterDropdown = document.getElementById("filter-category");
        const planModalDropdown = document.getElementById("plan-category");
        if (filterDropdown) filterDropdown.innerHTML = '<option value="" selected>-- Select Category --</option>';
        if (planModalDropdown) planModalDropdown.innerHTML = '<option value="" selected>-- Select Category --</option>';
        categories.forEach(category => {
            if (filterDropdown) filterDropdown.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            if (planModalDropdown) planModalDropdown.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });
    }

    function displayPlans() {
        const tbody = document.querySelector("#plans-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        filteredPlans.forEach(plan => {
            tbody.innerHTML += `
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
                </tr>`;
        });
        generatePlanPagination();
    }

    function displayCategories() {
        const tbody = document.querySelector("#categories-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        filteredCategories.forEach(category => {
            tbody.innerHTML += `
                <tr>
                    <td>${category.name || "N/A"}</td>
                    <td>${category.plans ? category.plans.length : 0}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openEditCategoryModal(${category.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="openDeleteCategoryModal(${category.id})">Delete</button>
                    </td>
                </tr>`;
        });
        generateCategoryPagination();
    }

    function generatePlanPagination() {
        const pagination = document.getElementById("pagination-plans");
        if (!pagination || planTotalPages <= 1) return;
        pagination.innerHTML = `
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
        const pagination = document.getElementById("pagination-categories");
        if (pagination) pagination.innerHTML = "";
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
        const nameFilter = document.getElementById("search-category-name")?.value.toLowerCase();
        filteredCategories = categories.filter(category => !nameFilter || category.name.toLowerCase().includes(nameFilter));
        displayCategories();
    };

    window.clearFilters = function () {
        ['search-plan-name', 'filter-price', 'filter-status', 'filter-category'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        applyFilters();
    };

    window.clearCategoryFilters = function () {
        const el = document.getElementById("search-category-name");
        if (el) el.value = "";
        applyCategoryFilters();
    };

    window.toggleView = function (section) {
        document.getElementById("plans").style.display = section === "plans" ? "block" : "none";
        document.getElementById("categories").style.display = section === "categories" ? "block" : "none";
    };

    window.openAddPlanModal = function () {
        document.getElementById("addPlanModalLabel").textContent = "Add Plan";
        document.getElementById("plan-form")?.reset();
        document.getElementById("plan-id").value = "";
    };

    window.openEditPlanModal = async function (id) {
        try {
            const response = await fetch(`${BASE_URL}/plans/${id}`, {
                headers: { "Authorization": `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch plan`);
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to save plan`);
            showToast(id ? "Plan updated successfully" : "Plan added successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("addPlanModal")).hide();
            fetchPlans();
        } catch (error) {
            showToast("Error saving plan", "danger");
        }
    };

    window.openAddCategoryModal = function () {
        document.getElementById("addCategoryModalLabel").textContent = "Add Category";
        document.getElementById("category-form")?.reset();
        document.getElementById("category-id").value = "";
    };

    window.openEditCategoryModal = async function (id) {
        try {
            const response = await fetch(`${BASE_URL}/categories/${id}`, {
                headers: { "Authorization": `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch category`);
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to save category`);
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to delete plan`);
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to delete category`);
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
            csvContent += [
                plan.name, plan.categoryName || "N/A", plan.price, plan.validity,
                plan.dataLimit, plan.smsLimit, plan.callLimit, plan.status
            ].join(",") + "\n";
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
            plan.name, plan.categoryName || "N/A", plan.price, plan.validity,
            plan.dataLimit, plan.smsLimit, plan.callLimit, plan.status
        ]);
        doc.text("Plans List", 14, 10);
        doc.autoTable({ head: [headers], body: rows, startY: 20 });
        doc.save("plans.pdf");
    };

    window.exportCategories = function () {
        let csvContent = "data:text/csv;charset=utf-8,Name,Number of Plans\n";
        filteredCategories.forEach(category => {
            csvContent += [category.name, category.plans ? category.plans.length : 0].join(",") + "\n";
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
        const rows = filteredCategories.map(category => [category.name, category.plans ? category.plans.length : 0]);
        doc.text("Categories List", 14, 10);
        doc.autoTable({ head: [headers], body: rows, startY: 20 });
        doc.save("categories.pdf");
    };

    fetchCategories();
    fetchPlans();
});

// Profile Management
document.addEventListener("DOMContentLoaded", function () {
    const BASE_URL = "http://localhost:8083/admin";
    let adminUsername;

    async function loadAdminProfile() {
        if (!checkAuth()) return;

        const decodedToken = parseJwt(getToken());
        if (!decodedToken || !decodedToken.sub) {
            showToast("Invalid or missing token. Please log in again.", "danger");
            setTimeout(() => window.location.href = "login.html", 2000);
            return;
        }

        adminUsername = decodedToken.sub;

        try {
            const response = await fetch(`${BASE_URL}/profile/${encodeURIComponent(adminUsername)}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
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
            profileImageElement.src = profile.profileImage && (profile.profileImage.startsWith("data:image") || /^https?:\/\//.test(profile.profileImage))
                ? profile.profileImage
                : defaultImage;
            navbarAvatarElement.src = profileImageElement.src;
            document.getElementById("email").setAttribute("readonly", true);
            document.getElementById("username").setAttribute("readonly", true);
        } catch (error) {
            logError("Error loading profile", error);
            handleAuthError(error);
            resetProfileFields();
        }
    }

    function handleAuthError(error) {
        if (error.status === 401 || error.status === 403) {
            showToast("Unauthorized access. Please log in again.", "danger");
            setTimeout(() => window.location.href = "/login.html", 2000);
        } else if (error.status === 404) {
            showToast("Profile not found.", "warning");
        } else {
            showToast(`Failed to load profile: ${error.message}`, "danger");
        }
    }

    function resetProfileFields() {
        document.getElementById("username").value = "";
        document.getElementById("email").value = adminUsername || "";
        document.getElementById("contact").value = "";
        document.getElementById("address").value = "";
        document.getElementById("profileImage").src = "../assesst/Images/profile.jpeg";
        document.getElementById("navbarAvatar").src = "../assesst/Images/profile.jpeg";
    }

    document.getElementById("editProfileImage")?.addEventListener("click", () => document.getElementById("imageUpload")?.click());

    document.getElementById("imageUpload")?.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById("profileImage").src = e.target.result;
                document.getElementById("navbarAvatar").src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("togglePasswordFields")?.addEventListener("click", function () {
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

    document.getElementById("profileForm")?.addEventListener("input", function (event) {
        document.getElementById(event.target.id + "Error")?.classList.add("d-none");
    });

    document.getElementById("updateProfile")?.addEventListener("click", async function (event) {
        event.preventDefault();
        if (!checkAuth()) return;

        const username = document.getElementById("username").value.trim();
        const contact = document.getElementById("contact").value.trim();
        const address = document.getElementById("address").value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const profileImage = document.getElementById("profileImage").src;

        const isContactValid = validateInput(contact, "contactError", /^\d{10}$/.test(contact), "Invalid contact number (10 digits required)");
        const isAddressValid = validateInput(address, "addressError", address !== "", "Address cannot be empty");
        let isPasswordValid = true, isPasswordMatch = true;

        if (document.getElementById("passwordFields").style.display === "block" && newPassword) {
            isPasswordValid = validateInput(newPassword, "passwordError", newPassword.length >= 6, "Password must be at least 6 characters");
            isPasswordMatch = validateInput(confirmPassword, "confirmPasswordError", newPassword === confirmPassword, "Passwords do not match");
        }

        const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
        let isImageSizeValid = true;
        if (profileImage.startsWith("data:image")) {
            const approxFileSizeBytes = Math.round(profileImage.length * 0.75);
            if (approxFileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
                showToast(`Image size exceeds 2MB limit`, "warning");
                isImageSizeValid = false;
            }
        }

        if (isContactValid && isAddressValid && isPasswordValid && isPasswordMatch && isImageSizeValid) {
            const profileData = {
                username,
                email: document.getElementById("email").value,
                contact,
                address,
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
            } catch (error) {
                logError("Error updating profile", error);
                handleAuthError(error);
            }
        }
    });

    loadAdminProfile();
});

// Report and Analysis
document.addEventListener("DOMContentLoaded", function () {
    let revenueChart, dailyRechargeChart, rechargePlanChart, paymentModeChart;
    const BASE_URL = "http://localhost:8083/admin";

    fetchReportData();

    function fetchReportData() {
        if (!checkAuth()) return;

        fetch(`${BASE_URL}/reports/analytics`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch report data`);
                return response.json();
            })
            .then(data => {
                updateSummaryCards(data);
                generateCharts(data);
            })
            .catch(error => {

                showToast(`Failed to load reports: ${error.message}`, "danger");
                if (error.message.includes("401") || error.message.includes("403")) {
                    setTimeout(() => window.location.href = "/login.html", 2000);
                }
            });
    }

    function updateSummaryCards(data) {
        document.getElementById("totalRevenues").innerHTML = `<b>${data.summary.totalRevenue} (This Month)</b>`;
        document.getElementById("totalRecharge").innerHTML = `<b>${data.summary.totalRecharge} (This Month)</b>`;
        document.getElementById("newSubscribers").innerHTML = `<b>${data.summary.newSubscribers} (This Month)</b>`;
    }

    function generateCharts(data) {
        let revenueCtx = document.getElementById("revenueChart")?.getContext("2d");
        if (revenueCtx) {
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
        }

        let dailyRechargeCtx = document.getElementById("dailyRechargeChart")?.getContext("2d");
        if (dailyRechargeCtx) {
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
        }

        let rechargePlanCtx = document.getElementById("rechargePlanChart")?.getContext("2d");
        if (rechargePlanCtx) {
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
        }

        let paymentModeCtx = document.getElementById("paymentModeChart")?.getContext("2d");
        if (paymentModeCtx) {
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
    }
});

function generatePDF(sectionId, fileName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Mobi.Comm Service", 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(fileName.replace('.pdf', ''), 105, 25, { align: "center" });

    document.querySelectorAll(".downloadBtn")?.forEach(btn => btn.style.display = "none");
    html2canvas(document.getElementById(sectionId)).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 150;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, "PNG", 10, 45, imgWidth, imgHeight);
        document.querySelectorAll(".downloadBtn")?.forEach(btn => btn.style.display = "block");
        doc.save(fileName);
    });
}

function generateFullReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Mobi.Comm Service", 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text("Full Reports & Analytics", 105, 25, { align: "center" });

    document.querySelectorAll(".downloadBtn")?.forEach(btn => btn.style.display = "none");
    html2canvas(document.getElementById("reportAndAnalysis")).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, "PNG", 10, 35, imgWidth, imgHeight);
        document.querySelectorAll(".downloadBtn")?.forEach(btn => btn.style.display = "block");
        doc.save("Full_Report.pdf");
    });
}

function confirmLogout() {
    const logoutModal = new bootstrap.Modal(document.getElementById('logoutModal'));
    logoutModal.show();

    const apiBaseUrl = "http://localhost:8083/auth";
    const confirmBtn = document.getElementById('confirmLogoutBtn');

    confirmBtn.onclick = async () => {
        const token = sessionStorage.getItem('jwtToken');

        if (!token) {
            showToast("errorToast", "No session token found. You are already logged out.");
            sessionStorage.removeItem('jwtToken');
            logoutModal.hide();
            window.location.href = '/index.html';
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/logout/admin`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Logout failed!");
            }

            sessionStorage.removeItem('jwtToken');
            showToast("successToast", result.message || "Logged out successfully!");
            logoutModal.hide();

            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } catch (error) {
            showToast("errorToast", error.message || "Failed to logout. Please try again.");
        }
    };
}
