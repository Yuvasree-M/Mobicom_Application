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

// Show Scroll to Top Button on Scroll
window.onscroll = function () {
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        scrollTopBtn.style.display = "block";
    } else {
        scrollTopBtn.style.display = "none";
    }
};

// Scroll to Top Function
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}


// Dash Board Management

document.addEventListener("DOMContentLoaded", function () {
    let currentPage = 1;
    let recordsPerPage = 5;
    let subscriberData = [];

    function fetchDataAndUpdate() {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                updateDashboard(data);
                subscriberData = data.expiringSubscribers;
                updateTable();
            })
            .catch(error => console.error("Error loading data:", error));
    }

    function updateDashboard(data) {
        document.getElementById("totalSubscribers").innerHTML = `<b>${data.totalSubscribers}</b>`;
        document.getElementById("activePlans").innerHTML = `<b>${data.activePlans}</b>`;
        document.getElementById("expiringPlans").innerHTML = `<b>${data.expiringSubscribers.length}</b>`;
        document.getElementById("totalRevenue").innerHTML = `<b>₹${data.totalRevenue}</b>`;
    }

    function updateTable() {
        const tableBody = document.getElementById("expiringSubscribersTable");
        tableBody.innerHTML = "";

        let start = (currentPage - 1) * recordsPerPage;
        let end = start + recordsPerPage;
        let paginatedData = subscriberData.slice(start, end);

        paginatedData.forEach(subscriber => {
            let row = `<tr>
                <td>${subscriber.name}</td>
                <td>${subscriber.phone}</td>
                <td>${subscriber.plan}</td>
                <td>${subscriber.price}</td>
                <td>${subscriber.validity} Days</td>
                <td>${subscriber.rechargeDate}</td>
                <td>${subscriber.expiryDate}</td>
                <td><button class="btn btn-warning" onclick="notifyUser('${subscriber.name}', '${subscriber.phone}')">Notify</button></td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        updatePaginationControls();
    }

    function updatePaginationControls() {
        const paginationContainer = document.getElementById("pagination");
        paginationContainer.innerHTML = "";

        let totalPages = Math.ceil(subscriberData.length / recordsPerPage);

        let prevClass = currentPage === 1 ? "disabled" : "";
        paginationContainer.innerHTML += `
            <li class="page-item ${prevClass}">
                <a class="page-link" href="#" aria-label="Previous" onclick="changePage(${currentPage - 1})">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>`;
        for (let i = 1; i <= totalPages; i++) {
            let activeClass = i === currentPage ? "active" : "";
            paginationContainer.innerHTML += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>`;
        }
        let nextClass = currentPage === totalPages ? "disabled" : "";
        paginationContainer.innerHTML += `
            <li class="page-item ${nextClass}">
                <a class="page-link" href="#" aria-label="Next" onclick="changePage(${currentPage + 1})">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>`;
    }

    window.changePage = function (page) {
        if (page > 0 && page <= Math.ceil(subscriberData.length / recordsPerPage)) {
            currentPage = page;
            updateTable();
        }
    };
    setInterval(fetchDataAndUpdate, 10000);
    fetchDataAndUpdate();
});

// Notify User Modal Function
function notifyUser(name, phone) {
    document.getElementById("notifyUserName").innerText = name;
    document.getElementById("notifyUserPhone").innerText = phone;
    new bootstrap.Modal(document.getElementById('notifyModal')).show();
}

// Subscriber Management

document.addEventListener("DOMContentLoaded", function () {
    const subscribersUrl = "data.json";
    let subscribers = [];
    let filteredSubscribers = [];
    const itemsPerPage = 5;
    let currentPage = 1;

    async function fetchSubscribers() {
        try {
            const response = await fetch(subscribersUrl);
            const data = await response.json();

            let storedSubscribers = JSON.parse(localStorage.getItem("subscribers")) || [];
            subscribers = mergeSubscribers(data.subscribers, storedSubscribers);
            filteredSubscribers = [...subscribers];

            saveToLocalStorage();
            displaySubscribers();
        } catch (error) {
            console.error("Error fetching subscribers:", error);
        }
    }

    function mergeSubscribers(jsonData, localData) {
        let allSubscribers = [...jsonData];

        localData.forEach(newSub => {
            let existingSub = allSubscribers.find(sub => sub.mobile === newSub.mobile);
            if (existingSub) {
                existingSub.status = newSub.status;
            } else {
                allSubscribers.push(newSub);
            }
        });

        return allSubscribers;
    }

    function saveToLocalStorage() {
        localStorage.setItem("subscribers", JSON.stringify(subscribers));
    }

    function displaySubscribers() {
        const tbody = document.getElementById("subscriber-list");
        tbody.innerHTML = "";

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedSubscribers = filteredSubscribers.slice(start, end);

        paginatedSubscribers.forEach(subscriber => {
            const row = `
                <tr>
                    <td>${subscriber.name}</td>
                    <td>${subscriber.mobile}</td>
                    <td>${subscriber.email}</td>
                    <td id="status-${subscriber.mobile}">${subscriber.status}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="showConfirmationModal('${subscriber.name}', '${subscriber.mobile}', '${subscriber.email}', '${subscriber.status}', 'approve')">Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="showConfirmationModal('${subscriber.name}', '${subscriber.mobile}', '${subscriber.email}', '${subscriber.status}', 'delete')">Delete</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        generatePagination();
    }

    function generatePagination() {
        const pagination = document.getElementById("pagination0");
        pagination.innerHTML = "";

        const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
        if (totalPages <= 1) return;

        pagination.innerHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="changePage(${currentPage - 1})">&laquo;</button>
            </li>`;

        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="changePage(${i})">${i}</button>
                </li>`;
        }

        pagination.innerHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="changePage(${currentPage + 1})"> &raquo;</button>
            </li>`;
    }

    window.changePage = function (page) {
        const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        displaySubscribers();
    };

    window.showConfirmationModal = function (name, mobile, email, status, action) {
        document.getElementById("modalSubscriberName").textContent = name;
        document.getElementById("modalSubscriberMobile").textContent = mobile;
        document.getElementById("modalSubscriberEmail").textContent = email;
        document.getElementById("modalSubscriberStatus").textContent = status;

        let confirmText = document.getElementById("confirmText");
        let confirmActionBtn = document.getElementById("confirmActionBtn");

        if (action === 'approve') {
            confirmText.textContent = "Are you sure you want to approve this subscriber?";
            confirmActionBtn.className = "btn btn-success";
            confirmActionBtn.onclick = function () { approveSubscriber(mobile); };
        } else {
            confirmText.textContent = "Are you sure you want to delete this subscriber?";
            confirmActionBtn.className = "btn btn-danger";
            confirmActionBtn.onclick = function () { deleteSubscriber(mobile); };
        }

        let modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();
    };

    function approveSubscriber(mobile) {
        let subscriber = subscribers.find(sub => sub.mobile === mobile);
        if (subscriber) {
            subscriber.status = "Active";
            document.getElementById(`status-${mobile}`).textContent = "Active";
            saveToLocalStorage();
            showToast("Subscriber approved successfully!", "success");
        }
        let modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        modal.hide();
    }

    // function deleteSubscriber(mobile) {
    //     filteredSubscribers = filteredSubscribers.filter(sub => sub.mobile !== mobile);
    //     subscribers = subscribers.filter(sub => sub.mobile !== mobile);
    //     saveToLocalStorage();
    //     displaySubscribers();
    //     showToast("Subscriber deleted successfully!", "danger");

    //     let modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
    //     modal.hide();
    // }

    function deleteSubscriber(mobile) {
        let subscriber = subscribers.find(sub => sub.mobile === mobile);
        if (subscriber) {
            subscriber.status = "Inactive"; // 
            document.getElementById(`status-${mobile}`).textContent = "Inactive";
            saveToLocalStorage();
            showToast("Subscriber marked as inactive!", "warning");
        }
    
        // Close the confirmation modal
        let modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        modal.hide();
    }
    

    window.filterSubscribers = function () {
        let searchInput = document.getElementById("searchSubscribers").value.toLowerCase();
        filteredSubscribers = subscribers.filter(subscriber =>
            subscriber.name.toLowerCase().includes(searchInput) ||
            subscriber.mobile.includes(searchInput)
        );
        currentPage = 1;
        displaySubscribers();
    };

    function showToast(message, type) {
        let toastContainer = document.getElementById("toastContainer");
        let toastHTML = `
            <div class="toast align-items-center text-white bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        toastContainer.innerHTML = toastHTML;
        setTimeout(() => {
            toastContainer.innerHTML = "";
        }, 3000);
    }

   // Download CSV
window.exportSubscribersToCSV = function () {
    let csv = "Name,Mobile,Email,Status\n";
    filteredSubscribers.forEach(sub => {
        csv += `${sub.name},${sub.mobile},${sub.email},${sub.status}\n`;
    });

    let blob = new Blob([csv], { type: 'text/csv' });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "subscribers.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// WDownload PDF
window.exportSubscribersToPDF = function () {
    if (window.jspdf) {
        const { jsPDF } = window.jspdf;
        let doc = new jsPDF();

        doc.text("Subscriber List", 10, 10);

        let rows = filteredSubscribers.map(sub => [sub.name, sub.mobile, sub.email, sub.status]);

        doc.autoTable({
            head: [["Name", "Mobile", "Email", "Status"]],
            body: rows,
            startY: 20
        });

        doc.save("subscribers.pdf");
    } else {
        console.error("jsPDF is not loaded.");
    }
};

    fetchSubscribers();
});


// Transcation management
(function () {
    let transactions = []; 
    let filteredTransactions = []; 
    let currentPage = 1;
    const rowsPerPage = 5;

    // Fetch Transaction History
    document.addEventListener("DOMContentLoaded", function () {
        fetch("data.json")
            .then(response => response.json())
            .then(data => {
                if (data.transactionHistory) {
                    transactions = data.transactionHistory;
                    filteredTransactions = [...transactions]; // Clone original data
                    displayTransactions();
                    setupPagination();
                } else {
                    console.error("Transaction history not found in data.json");
                }
            })
            .catch(error => console.error("Error loading transactions:", error));
    });

    // Display Transactions with Pagination
    function displayTransactions() {
        const transactionList = document.getElementById("transaction-list");
        if (!transactionList) return;
        transactionList.innerHTML = "";

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedTransactions = filteredTransactions.slice(start, end);

        paginatedTransactions.forEach(transaction => {
            const row = `<tr>
                <td>${transaction.transactionID || "N/A"}</td>
                <td>${transaction.rechargeDate || "N/A"}</td>
                <td>${transaction.username || "N/A"}</td>
                <td>${transaction.mobileNumber || "N/A"}</td>
                <td>${transaction.planName || "N/A"}</td>
                <td>${transaction.planPrice || "N/A"}</td>
                <td>${transaction.validity || "N/A"}</td>
                <td>${transaction.paymentMode || "N/A"}</td>
                <td>${transaction.status || "N/A"}</td>
            </tr>`;
            transactionList.innerHTML += row;
        });

        setupPagination();
    }

    function setupPagination() {
        const pagination = document.getElementById("pagination5");
        if (!pagination) return;
        pagination.innerHTML = "";

        const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
        if (totalPages === 0) return;

       
        let prevLi = document.createElement("li");
        prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
        prevLi.innerHTML = `<a class="page-link" href="#">«</a>`;
        prevLi.addEventListener("click", function () {
            if (currentPage > 1) changePage(currentPage - 1);
        });
        pagination.appendChild(prevLi);
        for (let i = 1; i <= totalPages; i++) {
            let li = document.createElement("li");
            li.className = `page-item ${i === currentPage ? "active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener("click", function () {
                changePage(i);
            });
            pagination.appendChild(li);
        }

        let nextLi = document.createElement("li");
        nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
        nextLi.innerHTML = `<a class="page-link" href="#">»</a>`;
        nextLi.addEventListener("click", function () {
            if (currentPage < totalPages) changePage(currentPage + 1);
        });
        pagination.appendChild(nextLi);
    }

    // Change Page Function
    function changePage(page) {
        const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
        if (page < 1 || page > totalPages) return;

        currentPage = page;
        displayTransactions();
    }

    // Filter Transactions (Search)
    function filterTransactions() {
        const searchQuery = document.getElementById("searchTransactions")?.value.toLowerCase();
        if (searchQuery === undefined) return;

        filteredTransactions = transactions.filter(t =>
            t.username.toLowerCase().includes(searchQuery) ||
            t.mobileNumber.includes(searchQuery)
        );
        currentPage = 1;
        displayTransactions();
        setupPagination();
    }

    // Export Transactions to CSV
    function exportTransactionsToCSV() {
        let csvContent = "Transaction ID,Recharge Date,Username,Mobile No.,Plan Name,Plan Price,Validity,Payment Mode,Status\n";
        filteredTransactions.forEach(transaction => {
            csvContent += `${transaction.transactionID},${transaction.rechargeDate},${transaction.username},${transaction.mobileNumber},${transaction.planName},${transaction.planPrice},${transaction.validity},${transaction.paymentMode},${transaction.status}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Transaction_History.csv";
        link.click();
    }

    // Export Transactions to PDF
function exportTransactionsToPDF() {
    if (!window.jspdf) {
        console.error("jsPDF library not loaded");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Transaction History", 14, 15);
    const headers = [
        ["Transaction ID", "Date", "Username", "Mobile", "Plan Name", "Price (₹)", "Validity", "Payment Mode", "Status"]
    ];

    const data = filteredTransactions.map(transaction => [
        transaction.transactionID,
        transaction.rechargeDate,
        transaction.username,
        transaction.mobileNumber,
        transaction.planName,
        `${transaction.planPrice}`,
        transaction.validity,
        transaction.paymentMode,
        transaction.status
    ]);

    doc.autoTable({
        startY: 20,
        head: headers,
        body: data,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold"}, // Yellow Header
      
    });

    doc.save("Transaction_History.pdf");
}

    window.filterTransactions = filterTransactions;
    window.exportTransactionsToCSV = exportTransactionsToCSV;
    window.exportTransactionsToPDF = exportTransactionsToPDF;
    window.changePage = changePage; 
})();

// PLan Managemt

document.addEventListener("DOMContentLoaded", function () {
    let plans = [];
    let filteredPlans = [];
    let currentPlanPage = 1;
    const itemsPerPage = 5;
    let editIndex = null;

    // Load plans from data.json or local storage
    function loadPlans() {
        const storedPlans = localStorage.getItem("plans");

        if (storedPlans) {
            plans = JSON.parse(storedPlans);
            applyFilters();
        } else {
            fetch("data.json")
                .then(response => response.json())
                .then(data => {
                    plans = data.plans;
                    localStorage.setItem("plans", JSON.stringify(plans));
                    applyFilters();
                })
                .catch(error => console.error("Error loading data:", error));
        }
    }

    function displayPlans() {
        const plansTableBody = document.querySelector("#plans-table tbody");
        plansTableBody.innerHTML = "";

        const startIndex = (currentPlanPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

        paginatedPlans.forEach((plan, index) => {
            const row = `
                <tr>
                    <td>${plan.name}</td>
                    <td>₹${plan.price}</td>
                    <td>${plan.validity}</td>
                    <td>${plan.dataLimit}</td>
                    <td>${plan.smsLimit}</td>
                    <td>${plan.callLimit}</td>
                    <td>${plan.status}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editPlan(${index})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${index})">Delete</button>
                    </td>
                </tr>
            `;
            plansTableBody.innerHTML += row;
        });

        generatePlanPagination();
    }

    // Open Add Plan Modal
    window.openAddPlanModal = function () {
        editIndex = null;
        document.getElementById("plan-form").reset();
        document.getElementById("addPlanModalLabel").innerText = "Add Plan";
    };

    // Handle Add/Edit Form Submission
    window.handleFormSubmit = function (event) {
        event.preventDefault();

        const plan = {
            name: document.getElementById("plan-name").value,
            price: document.getElementById("plan-price").value,
            validity: document.getElementById("plan-validity").value,
            dataLimit: document.getElementById("plan-data-limit").value,
            smsLimit: document.getElementById("plan-sms-limit").value,
            callLimit: document.getElementById("plan-call-limit").value,
            status: document.getElementById("plan-status").value
        };

        if (editIndex !== null) {
            plans[editIndex] = plan;
        } else {
            plans.push(plan);
        }

        localStorage.setItem("plans", JSON.stringify(plans));
        applyFilters();
        bootstrap.Modal.getInstance(document.getElementById("addPlanModal")).hide();
    };

    // Edit a Plan
    window.editPlan = function (index) {
        editIndex = index;
        const plan = filteredPlans[index];

        document.getElementById("plan-name").value = plan.name;
        document.getElementById("plan-price").value = plan.price;
        document.getElementById("plan-validity").value = plan.validity;
        document.getElementById("plan-data-limit").value = plan.dataLimit;
        document.getElementById("plan-sms-limit").value = plan.smsLimit;
        document.getElementById("plan-call-limit").value = plan.callLimit;
        document.getElementById("plan-status").value = plan.status;

        document.getElementById("addPlanModalLabel").innerText = "Edit Plan";
        new bootstrap.Modal(document.getElementById("addPlanModal")).show();
    };

    // Show Delete Modal
    window.showDeleteModal = function (index) {
        const plan = filteredPlans[index];

        document.getElementById("delete-plan-name").innerText = plan.name;
        document.getElementById("delete-plan-details").innerHTML = `
            <p><strong>Price:</strong> ₹${plan.price}</p>
            <p><strong>Validity:</strong> ${plan.validity}</p>
            <p><strong>Data Limit:</strong> ${plan.dataLimit}</p>
            <p><strong>SMS Limit:</strong> ${plan.smsLimit}</p>
            <p><strong>Call Limit:</strong> ${plan.callLimit}</p>
            <p><strong>Status:</strong> ${plan.status}</p>
        `;

        const actualIndex = plans.findIndex(p => p.name === plan.name && p.price == plan.price);
        document.getElementById("deletePlanModal").setAttribute("data-index", actualIndex);

        new bootstrap.Modal(document.getElementById("deletePlanModal")).show();
    };

    // Confirm Delete Plan
    window.confirmDeletePlan = function () {
        const index = document.getElementById("deletePlanModal").getAttribute("data-index");

        if (index !== null && index !== undefined) {
            plans.splice(index, 1);
            localStorage.setItem("plans", JSON.stringify(plans));
            applyFilters();
            bootstrap.Modal.getInstance(document.getElementById("deletePlanModal")).hide();
        } else {
            console.error("Invalid index for deleting plan");
        }
    };


    // Apply Filters
    window.applyFilters = function () {
        const searchText = document.getElementById("search-plan-name").value.toLowerCase();
        const filterPrice = document.getElementById("filter-price").value;
        const filterStatus = document.getElementById("filter-status").value;

        filteredPlans = plans.filter(plan =>
            plan.name.toLowerCase().includes(searchText) &&
            (filterStatus === "" || plan.status.toLowerCase() === filterStatus.toLowerCase())
        );

        if (filterPrice === "low-to-high") {
            filteredPlans.sort((a, b) => a.price - b.price);
        } else if (filterPrice === "high-to-low") {
            filteredPlans.sort((a, b) => b.price - a.price);
        }

        currentPlanPage = 1;
        displayPlans();
    };

    // Generate Pagination
    function generatePlanPagination() {
        const pagination = document.getElementById("pagination2");
        pagination.innerHTML = "";
    
        const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
        if (totalPages <= 1) return; // Hide pagination if only one page
    
        let paginationHTML = [];
    
        // **Previous Button (<<)**
        paginationHTML.push(`
            <li class="page-item ${currentPlanPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePlanPage(${currentPlanPage - 1})">&laquo;</a>
            </li>
        `);
    
        // **Page Numbers**
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML.push(`
                <li class="page-item ${i === currentPlanPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePlanPage(${i})">${i}</a>
                </li>
            `);
        }
    
        // **Next Button (>>)**
        paginationHTML.push(`
            <li class="page-item ${currentPlanPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePlanPage(${currentPlanPage + 1})">&raquo;</a>
            </li>
        `);
    
        pagination.innerHTML = paginationHTML.join(""); // Efficient DOM update
    }
    

    window.changePlanPage = function (page) {
        currentPlanPage = page;
        displayPlans();
        generatePlanPagination();
    };

    window.clearFilters = function () {
        document.getElementById("search-plan-name").value = "";
        document.getElementById("filter-price").value = "";
        document.getElementById("filter-status").value = "";
        applyFilters();
    };

    loadPlans();

    // Export to CSV
window.exportPlans = function () {
    if (filteredPlans.length === 0) {
        alert("No plans available to export!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Plan Name,Price,Validity,Data Limit,SMS Limit,Call Limit,Status\n";

    filteredPlans.forEach(plan => {
        let row = `${plan.name},${plan.price},${plan.validity},${plan.dataLimit},${plan.smsLimit},${plan.callLimit},${plan.status}`;
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

// Export to PDF
window.exportPlanPDF = function () {
    if (filteredPlans.length === 0) {
        alert("No plans available to export!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Plan List", 14, 15);

    const headers = [["Plan Name", "Price (₹)", "Validity", "Data Limit", "SMS Limit", "Call Limit", "Status"]];
    const data = filteredPlans.map(plan => [
        plan.name, 
        `₹${plan.price}`, 
        plan.validity, 
        plan.dataLimit, 
        plan.smsLimit, 
        plan.callLimit, 
        plan.status
    ]);

    doc.autoTable({
        startY: 20,
        head: headers,
        body: data,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold" },
    });

    doc.save("plans.pdf");
};

});


// Notification management


document.addEventListener("DOMContentLoaded", function () {
    let subscribers = [];
    let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
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

        localStorage.setItem("notifications", JSON.stringify(notifications));
        renderNotifications();

        setTimeout(() => {
            notifications.forEach(notification => {
                if (notification.status === "Pending") notification.status = "Sent";
            });
            localStorage.setItem("notifications", JSON.stringify(notifications));
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

    // Open Clear History Modal
    document.getElementById("clearHistory").addEventListener("click", function () {
        let clearHistoryModal = new bootstrap.Modal(document.getElementById("clearHistoryModal"));
        clearHistoryModal.show();
    });

    // Confirm and Clear History
    document.getElementById("confirmClearHistory").addEventListener("click", function () {
        notifications = [];
        localStorage.setItem("notifications", JSON.stringify(notifications));
        renderNotifications();

        // Close modal after clearing history
        let clearHistoryModal = bootstrap.Modal.getInstance(document.getElementById("clearHistoryModal"));
        clearHistoryModal.hide();
    });

    // Open confirmation modal for delete or resend
    window.confirmNotificationAction = function (action, id) {
        selectedAction = action;
        selectedNotificationId = id;
        document.getElementById("notificationModalBody").textContent = `Are you sure you want to ${action} this notification?`;
        new bootstrap.Modal(document.getElementById("notificationConfirmationModal")).show();
    };

    // Handle confirmation action (Delete or Resend)
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



// Profile management

document.addEventListener("DOMContentLoaded", function () {
    const adminEmail = localStorage.getItem("adminEmail");
    if (adminEmail) {
        document.getElementById("email").value = adminEmail;
    }
    document.getElementById("email").setAttribute("readonly", true);

    if (localStorage.getItem("profileImage")) {
        const profileImageSrc = localStorage.getItem("profileImage");
        document.getElementById("profileImage").src = profileImageSrc;
        document.getElementById("navbarAvatar").src = profileImageSrc; // Update Navbar Avatar
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
                document.getElementById("navbarAvatar").src = e.target.result; // Update Navbar Avatar
                localStorage.setItem("profileImage", e.target.result); // Save image
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

    document.getElementById("updateProfile").addEventListener("click", function () {
        const contact = document.getElementById("contact").value.trim();
        const address = document.getElementById("address").value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const passwordFields = document.getElementById("passwordFields");

        const isContactValid = validateInput(contact, "contactError", /^\d{10}$/.test(contact), "Invalid contact number");
        const isAddressValid = validateInput(address, "addressError", address !== "", "Address cannot be empty");

        let isPasswordValid = true;
        let isPasswordMatch = true;

        if (passwordFields.style.display === "block") {
            isPasswordValid = validateInput(newPassword, "passwordError", newPassword.length >= 6, "Password must be at least 6 characters");
            isPasswordMatch = validateInput(confirmPassword, "confirmPasswordError", newPassword === confirmPassword, "Passwords do not match");
        }

        if (isContactValid && isAddressValid && isPasswordValid && isPasswordMatch) {
            localStorage.setItem("adminContact", contact);
            localStorage.setItem("adminAddress", address);
            var toast = new bootstrap.Toast(document.getElementById("updateToast"));
            toast.show();
        }
    });
    document.getElementById("contact").value = localStorage.getItem("adminContact") || "";
    document.getElementById("address").value = localStorage.getItem("adminAddress") || "";
});


// Report and Analysis

document.addEventListener("DOMContentLoaded", function () {
    let revenueChart, dailyRechargeChart, rechargePlanChart, paymentModeChart;

    //  Fetch Data from JSON
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            updateSummaryCards(data);
            generateCharts(data);
        })
        .catch(error => console.error("Error fetching report data:", error));

    //  Update Summary Cards
    function updateSummaryCards(data) {
        document.getElementById("totalRevenue").innerHTML = `<b>${data.totalRevenue} (This Month)</b>`;
        document.getElementById("totalRecharge").innerHTML = `<b>${data.totalRecharge} (This Month)</b>`;
        document.getElementById("newSubscribers").innerHTML = `<b>${data.newSubscribers} (This Month)</b>`;
    }

    //  Generate Charts using Chart.js
    function generateCharts(data) {
        let revenueCtx = document.getElementById("revenueChart").getContext("2d");
        revenueChart = new Chart(revenueCtx, {
            type: "line",
            data: {
                labels: data.revenueOverview.dates,
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
                labels: data.dailyRecharge.dates,
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
                labels: data.rechargePlanPopularity.plans,
                datasets: [{
                    data: data.rechargePlanPopularity.values,
                    backgroundColor: ['#4CAF50', '#2196F3', '#FF9800']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        let paymentModeCtx = document.getElementById("paymentModeChart").getContext("2d");
        paymentModeChart = new Chart(paymentModeCtx, {
            type: "doughnut",
            data: {
                labels: data.paymentModeUsage.modes,
                datasets: [{
                    data: data.paymentModeUsage.values,
                    backgroundColor: ['#673AB7', '#03A9F4', '#FF9800']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
});

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

    // Function to Update Status
    function updateStatus(event) {
        const notificationId = parseInt(event.target.getAttribute("data-id"));
        const newStatus = event.target.value;
        notifications = notifications.map(notif => notif.id === notificationId ? { ...notif, status: newStatus } : notif);
        renderNotifications();
    }

    // Function to Delete Notification
    function deleteNotification(event) {
        const notificationId = parseInt(event.target.getAttribute("data-id"));
        notifications = notifications.filter(notif => notif.id !== notificationId);
        renderNotifications();
    }

    // Function to Get Status Badge Color
    function getStatusColor(status) {
        return status === "Pending" ? "danger" : status === "In Progress" ? "warning" : "success";
    }

    // Filter Change Event
    filterStatus.addEventListener("change", renderNotifications);

    // Initial Render
    renderNotifications();
});
