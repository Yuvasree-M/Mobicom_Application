// Subscriber Details
async function loadSubscriberDetails() {
    try {
        const subscriber = await fetchWithAuth(`${window.apiBaseUrl}/me?type=account`);
        document.getElementById('accountName').textContent = subscriber.name || 'N/A';
        document.getElementById('accountMobile').textContent = `+91 ${subscriber.phoneNumber}` || 'N/A';
        document.getElementById('accountEmail').textContent = subscriber.email || 'N/A';

        const profileImage = document.getElementById("profileImage");
        if (subscriber.profileImageUrl) {
            let base64String = subscriber.profileImageUrl;
            if (!base64String.startsWith("data:image")) {
                base64String = `data:image/jpeg;base64,${base64String}`;
                profileImage.src = base64String;
                profileImage.onerror = () => {
                    base64String = `data:image/png;base64,${subscriber.profileImageUrl}`;
                    profileImage.src = base64String;
                    profileImage.onerror = () => {
                        profileImage.src = "/assesst/Images/profile.jpeg";
                        profileImage.alt = "Failed to load profile photo";
                    };
                };
            } else {
                profileImage.src = base64String;
            }
        } else {
            profileImage.src = "/assesst/Images/profile.jpeg";
        }
    } catch (error) {
        console.error('Error loading subscriber details:', error);
        document.getElementById('accountName').textContent = 'Error';
        document.getElementById('accountMobile').textContent = 'Error';
        document.getElementById('accountEmail').textContent = 'Error';
    }
}

// Load Current Plan
async function loadCurrentPlan() {
    try {
        const currentPlan = await fetchWithAuth(`${window.apiBaseUrl}/current-plan`);
        if (!currentPlan || Object.keys(currentPlan).length === 0) {
            throw new Error('No active plan found');
        }

        document.getElementById('days-left').textContent = `${currentPlan.daysLeft} days left`;
        document.getElementById('plan-name-price').textContent = `${currentPlan.planName} - ₹${currentPlan.planPrice}`;
        document.getElementById('validity').textContent = `${currentPlan.validity} days`;
        document.getElementById('calls').textContent = currentPlan.calls || 'Unlimited';
        document.getElementById('sms').textContent = currentPlan.sms || '100/day';
        document.getElementById('data').textContent = currentPlan.data || 'N/A';

        const daysLeftBadge = document.getElementById('days-left');
        daysLeftBadge.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        if (currentPlan.daysLeft <= 5) daysLeftBadge.classList.add('bg-danger');
        else if (currentPlan.daysLeft <= 10) daysLeftBadge.classList.add('bg-warning');
        else daysLeftBadge.classList.add('bg-success');
    } catch (error) {
        console.error('Error loading current plan:', error);
        document.getElementById('plan-name-price').textContent = 'No active plan';
        document.getElementById('days-left').textContent = 'N/A';
        document.getElementById('validity').textContent = 'N/A';
        document.getElementById('calls').textContent = 'N/A';
        document.getElementById('sms').textContent = 'N/A';
        document.getElementById('data').textContent = 'N/A';
    }
}

// Categories
async function loadCategories() {
    try {
        const categories = await fetchWithAuth(`${window.apiBaseUrl}/categories`);
        const categorySelect = document.getElementById('filter-category');
        categorySelect.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Plans
async function fetchPopularPlans() {
    const container = document.getElementById('popular-plans-container');
    container.innerHTML = '<p>Loading popular plans...</p>';
    try {
        const query = new URLSearchParams({
            page: 0,
            size: 10,
            sortBy: 'price',
            sortDir: 'asc',
            category: 'Popular Plan',
        }).toString();
        const plansPage = await fetchWithAuth(`${window.apiBaseUrl}/plans?${query}`);
        const plans = plansPage.content || plansPage;

        container.innerHTML = '';
        if (!plans || plans.length === 0) {
            container.innerHTML = '<p>No popular plans available.</p>';
            return;
        }

        plans.forEach(plan => {
            const planCard = createPlanCard(plan);
            container.innerHTML += planCard;
        });

        attachRechargeButtonListeners();
    } catch (error) {
        console.error('Error fetching popular plans:', error);
        container.innerHTML = '<p>Error loading popular plans.</p>';
    }
}

async function fetchPlans(filters = {}) {
    const planSections = document.getElementById('plan-sections');
    planSections.innerHTML = '<p>Loading plans...</p>';
    try {
        const query = new URLSearchParams({
            page: 0,
            size: 100,
            sortBy: 'price',
            sortDir: filters.sortDir || 'asc',
            name: filters.name || '',
            category: filters.category || '',
        }).toString();
        const plansPage = await fetchWithAuth(`${window.apiBaseUrl}/plans?${query}`);
        const plans = plansPage.content || plansPage;

        planSections.innerHTML = '';
        const plansByCategory = groupPlansByCategory(plans);

        Object.entries(plansByCategory).forEach(([category, plans]) => {
            const section = document.createElement('div');
            section.className = 'plan-section';
            section.innerHTML = `
                <div class="container">
                    <h3>${category}</h3>
                    <div class="plan-wrapper" id="${category}-container"></div>
                </div>
            `;
            planSections.appendChild(section);

            const container = document.getElementById(`${category}-container`);
            plans.forEach(plan => container.innerHTML += createPlanCard(plan));
        });

        attachRechargeButtonListeners();
        if (Object.keys(plansByCategory).length === 0) {
            planSections.innerHTML = '<p>No plans found.</p>';
        }
    } catch (error) {
        console.error('Error fetching plans:', error);
        planSections.innerHTML = '<p>Error loading plans.</p>';
    }
}

function createPlanCard(plan) {
    return `
        <div class="plan-card">
            <h4>${plan.name}</h4>
            <p>Price: ${plan.price}</p>
            <p>Data: ${plan.dataLimit || 'N/A'}</p>
            <p>Validity: ${plan.validity} days</p>
            <p>SMS: ${plan.smsLimit || 'N/A'}</p>
            <p>Calls: ${plan.callLimit || 'N/A'}</p>
            <button class="btn btn-primary recharge-btn" 
                    data-plan-id="${plan.id}" 
                    data-plan-name="${plan.name}" 
                    data-plan-validity="${plan.validity}"
                    data-plan-price="${plan.price}">Recharge</button>
        </div>
    `;
}

function groupPlansByCategory(plans) {
    const plansByCategory = {};
    plans.forEach(plan => {
        const category = plan.category || 'Uncategorized';
        if (!plansByCategory[category]) plansByCategory[category] = [];
        plansByCategory[category].push(plan);
    });
    return plansByCategory;
}

function attachRechargeButtonListeners() {
    document.querySelectorAll('.recharge-btn').forEach(btn => 
        btn.addEventListener('click', showRechargeModal)
    );
}

// Recharge Flow
function showRechargeModal(event) {
    const btn = event?.target || document.querySelector('.recharge-btn');
    const planId = btn.dataset.planId;
    const planName = btn.dataset.planName;
    const planPrice = parseFloat(btn.dataset.planPrice);
    const planValidity = btn.dataset.planValidity;

    document.getElementById('modal-plan-details').textContent = 
        `Recharge Plan: ${planName} for ₹${planPrice} (${planValidity} days)`;
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    confirmationModal.show();

    document.getElementById('cancel').onclick = () => confirmationModal.hide();
    document.getElementById('close-confirmation-btn').onclick = () => confirmationModal.hide();
    document.getElementById('confirmRecharge').onclick = () => 
        confirmRecharge(planId, confirmationModal, planName, planPrice, planValidity);
}

async function fetchSubscriberId(phoneNumber) {
    try {
        const response = await fetchWithAuth(`${window.apiBaseUrl}/subscriber-id?phoneNumber=${phoneNumber}`);
        return response;
    } catch (error) {
        console.error('Error fetching subscriber ID:', error);
        return null;
    }
}

function proceedPayment(planName, planId, price, subscriberId, callback) {
    const options = {
        "key": "rzp_test_GqJn5IN8LD0wep",
        "amount": price * 100,
        "currency": "INR",
        "name": "Mobi.comm",
        "description": `${planName} - ${planId}`,
        "handler": function (response) {
            alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
            if (callback) callback(response.razorpay_payment_id);
        },
        "prefill": {
            "name": "Yuvasree",
            "email": "Yuvasree@example.com",
            "contact": "6374116113"
        },
        "theme": { "color": "#008080" },
        "modal": { "ondismiss": () => alert("Payment cancelled.") }
    };
    const rzp = new Razorpay(options);
    rzp.open();
}

async function confirmRecharge(planId, confirmationModal, planName, planPrice, planValidity) {
    try {
        const paymentMode = document.getElementById('payment-mode').value;
        const phoneNumber = getSubscriberIdFromToken();
        if (!phoneNumber) throw new Error('No phone number found in token.');

        const subscriberId = await fetchSubscriberId(phoneNumber);
        if (!subscriberId) throw new Error('No subscriber ID found.');

        proceedPayment(planName, planId, planPrice, subscriberId, async (paymentId) => {
            const rechargeRequest = {
                subscriberId: subscriberId,
                planId: parseInt(planId),
                planName: planName,
                planPrice: planPrice,
                planValidity: planValidity,
                paymentMode: paymentMode,
                paymentId: paymentId
            };

            const response = await fetchWithAuth(`${window.apiBaseUrl}/recharge`, {
                method: 'POST',
                body: JSON.stringify(rechargeRequest),
            });

            confirmationModal.hide();
            showInvoiceModal(response);
        });
    } catch (error) {
        console.error('Recharge error:', error);
        showToast('error', 'Failed to process recharge: ' + error.message);
    }
}

function showInvoiceModal(response) {
    const invoiceModal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    
    document.getElementById('invoice-number').textContent = response.transactionId;
    document.getElementById('subscriber-name').textContent = response.subscriberName;
    document.getElementById('subscriber-number').textContent = response.subscriberNumber;
    document.getElementById('plan-name').textContent = response.planName;
    document.getElementById('amount').textContent = response.planPrice.toFixed(2);
    document.getElementById('plan-validity').textContent = `${response.planValidity} days` || 'N/A';
    document.getElementById('payment-method').textContent = response.paymentMethod;
    document.getElementById('issue-date').textContent = response.rechargeDate;
    document.getElementById('invoice-status').textContent = response.status;
    
    const emailNotification = document.getElementById('email-notification');
    if (emailNotification) {
        emailNotification.textContent = 'Your invoice has been sent to your registered email ID.';
    }

    invoiceModal.show();

    document.getElementById('download-invoice-btn').onclick = () => downloadInvoice(response);
    document.getElementById('back-to-home-btn').onclick = () => {
        invoiceModal.hide();
        showSection('dashboard');
        refreshRechargeHistory();
    };
}

function downloadInvoice(transaction) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(0, 128, 128);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('Mobi.comm Prepaid Service', 20, 20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text('Your Recharge Invoice', 20, 30);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const leftMargin = 20;
    const valueMargin = 90;
    const startY = 50;
    const lineHeight = 10;

    const details = [
        { label: 'Transaction ID', value: transaction.transactionId },
        { label: 'Subscriber Name', value: transaction.subscriberName },
        { label: 'Subscriber Number', value: transaction.subscriberNumber },
        { label: 'Plan Name', value: transaction.planName },
        { label: 'Amount', value: `₹${transaction.planPrice.toFixed(2)}` },
        { label: 'Validity', value: `${transaction.planValidity || 'N/A'} days` },
        { label: 'Payment Method', value: transaction.paymentMethod },
        { label: 'Issue Date', value: transaction.rechargeDate },
        { label: 'Status', value: transaction.status }
    ];

    details.forEach((item, index) => {
        const yPosition = startY + (index * lineHeight);
        doc.setFont("helvetica", "bold");
        doc.text(item.label, leftMargin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(item.value, valueMargin, yPosition);
        if (index < details.length) {
            doc.setLineWidth(0.1);
            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, yPosition + 2, 190, yPosition + 2);
        }
    });

    const footerY = startY + (details.length * lineHeight) + 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing Mobi.comm!', 105, footerY, { align: 'center' });
    doc.save(`invoice_${transaction.transactionId}.pdf`);
}

// Recharge History
function refreshRechargeHistory() {
    const table = document.getElementById("rechargeTable");
    const rowsPerPage = 5;
    let currentPage = 1;
    const pagination = document.getElementById("paginationId");

    async function loadTransactions() {
        try {
            const transactions = await fetchWithAuth(`${window.apiBaseUrl}/transactions`);
            return transactions.map(tx => ({
                transactionId: tx.transactionId,
                planName: tx.planName,
                amount: `₹${tx.planPrice.toFixed(2)}`,
                validity: tx.planValidity || 'N/A',
                rechargeDate: tx.rechargeDate,
                paymentMethod: tx.paymentMethod
            }));
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }

    function showPage(page, rows) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        table.innerHTML = '';
        rows.slice(start, end).forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.transactionId}</td>
                <td>${row.planName}</td>
                <td>${row.amount}</td>
                <td>${row.validity}</td>
                <td>${row.rechargeDate}</td>
                <td>${row.paymentMethod}</td>
            `;
            table.appendChild(tr);
        });
        updatePagination(page, rows);
    }

    function updatePagination(activePage, rows) {
        pagination.innerHTML = '';
        const totalPages = Math.ceil(rows.length / rowsPerPage);

        const prevLi = document.createElement("li");
        prevLi.className = `page-item ${activePage === 1 ? "disabled" : ""}`;
        prevLi.innerHTML = `<a class="page-link" href="#">«</a>`;
        prevLi.addEventListener("click", (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage, rows);
            }
        });
        pagination.appendChild(prevLi);

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === activePage ? "active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = i;
                showPage(currentPage, rows);
            });
            pagination.appendChild(li);
        }

        const nextLi = document.createElement("li");
        nextLi.className = `page-item ${activePage === totalPages ? "disabled" : ""}`;
        nextLi.innerHTML = `<a class="page-link" href="#">»</a>`;
        nextLi.addEventListener("click", (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage, rows);
            }
        });
        pagination.appendChild(nextLi);
    }

    loadTransactions().then(rows => showPage(currentPage, rows));
}

// Profile Management
function setupProfileManagement() {
    const profileImageInput = document.getElementById("profileImageInput");
    const profileImage = document.getElementById("profileImage");
    const navbarAvatar = document.getElementById("navbarAvatar");
    const userName = document.getElementById("userName");
    const emailInput = document.getElementById("emailInput");
    const mobileInput = document.getElementById("mobileInput");
    const alternateMobileNumber = document.getElementById("mobilenumber");
    const address = document.getElementById("address");
    const displayUserName = document.getElementById("displayUserName");
    const updateProfileBtn = document.getElementById("updateProfileBtn");
    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const addressError = document.getElementById("addressError");

    let profileImageBase64 = null;

    function validateInput() {
        let isValid = true;

        if (!userName.value.trim() || !/^[a-zA-Z\s]{3,}$/.test(userName.value.trim())) {
            nameError.textContent = "Enter a valid name (min 3 letters, letters only)";
            isValid = false;
        } else {
            nameError.textContent = "";
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailPattern.test(emailInput.value.trim())) {
            emailError.textContent = "Enter a valid email";
            isValid = false;
        } else {
            emailError.textContent = "";
        }

        if (!address.value.trim()) {
            addressError.textContent = "Address is required";
            isValid = false;
        } else {
            addressError.textContent = "";
        }

        return isValid;
    }

    async function fetchProfileDetails() {
        try {
            const profile = await fetchWithAuth(`${window.apiBaseUrl}/me?type=profile`);
            displayProfileDetails(profile);
        } catch (error) {
            console.error("Error fetching profile details:", error);
            showToast("error", error.message || "Failed to load profile details.");
        }
    }

    function displayProfileDetails(profile) {
        displayUserName.textContent = profile.name || "N/A";
        userName.value = profile.name || "";
        mobileInput.value = `+91 ${profile.phoneNumber}` || "N/A";
        emailInput.value = profile.email || "";
        alternateMobileNumber.value = profile.alternateMobileNumber || "";
        address.value = profile.address || "";

        if (profile.profileImageUrl) {
            let base64String = profile.profileImageUrl;
            if (!base64String.startsWith("data:image")) {
                base64String = `data:image/jpeg;base64,${base64String}`;
                profileImage.src = base64String;
                profileImage.onerror = () => {
                    base64String = `data:image/png;base64,${profile.profileImageUrl}`;
                    profileImage.src = base64String;
                    profileImage.onerror = () => {
                        profileImage.src = "/assesst/Images/profile.jpeg";
                    };
                };
            } else {
                profileImage.src = base64String;
            }
            if (navbarAvatar) navbarAvatar.src = profileImage.src;
        }
    }

    profileImageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImageBase64 = e.target.result;
                profileImage.src = profileImageBase64;
                if (navbarAvatar) navbarAvatar.src = profileImageBase64;
                localStorage.setItem("profileImage", profileImageBase64);
            };
            reader.readAsDataURL(file);
        }
    });

    updateProfileBtn.addEventListener("click", async () => {
        if (!validateInput()) return;

        const updatedProfile = {
            name: userName.value.trim(),
            email: emailInput.value.trim(),
            alternateMobileNumber: alternateMobileNumber.value.trim(),
            address: address.value.trim(),
            profileImageUrl: profileImageBase64
        };

        try {
            const response = await fetchWithAuth(`${window.apiBaseUrl}/update`, {
                method: "PUT",
                body: JSON.stringify(updatedProfile),
            });

            displayProfileDetails(response);
            showToast("success", "Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast("error", error.message || "Failed to update profile.");
        }
    });

    userName.addEventListener("input", validateInput);
    emailInput.addEventListener("input", validateInput);
    address.addEventListener("input", validateInput);

    fetchProfileDetails();
}

// Support Form
function setupSupportForm() {
    const supportForm = document.getElementById("supportForm");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const subjectInput = document.getElementById("subject");
    const messageInput = document.getElementById("message");
    const nameError = document.getElementById("namesError");
    const emailError = document.getElementById("emailsError");
    const subjectError = document.getElementById("subjectError");
    const messageError = document.getElementById("messageError");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showError(input, errorElement, message) {
        errorElement.textContent = message;
        errorElement.classList.remove("d-none");
        input.classList.add("is-invalid");
    }

    function clearError(input, errorElement) {
        errorElement.classList.add("d-none");
        input.classList.remove("is-invalid");
    }

    function validateName() {
        let nameValue = nameInput.value.trim();
        if (nameValue === "") {
            showError(nameInput, nameError, "Name is required.");
            return false;
        } else if (nameValue.length < 3) {
            showError(nameInput, nameError, "Name must be at least 3 characters long.");
            return false;
        }
        clearError(nameInput, nameError);
        return true;
    }

    function validateEmail() {
        let emailValue = emailInput.value.trim();
        if (emailValue === "") {
            showError(emailInput, emailError, "Email is required.");
            return false;
        } else if (!emailRegex.test(emailValue)) {
            showError(emailInput, emailError, "Enter a valid email address.");
            return false;
        }
        clearError(emailInput, emailError);
        return true;
    }

    function validateSubject() {
        let subjectValue = subjectInput.value.trim();
        if (subjectValue === "") {
            showError(subjectInput, subjectError, "Subject is required.");
            return false;
        } else if (subjectValue.length < 5) {
            showError(subjectInput, subjectError, "Subject must be at least 5 characters long.");
            return false;
        }
        clearError(subjectInput, subjectError);
        return true;
    }

    function validateMessage() {
        let messageValue = messageInput.value.trim();
        if (messageValue === "") {
            showError(messageInput, messageError, "Message cannot be empty.");
            return false;
        } else if (messageValue.length < 10) {
            showError(messageInput, messageError, "Message must be at least 10 characters long.");
            return false;
        }
        clearError(messageInput, messageError);
        return true;
    }

    nameInput.addEventListener("input", validateName);
    emailInput.addEventListener("input", validateEmail);
    subjectInput.addEventListener("input", validateSubject);
    messageInput.addEventListener("input", validateMessage);

    supportForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const isNameValid = validateName();
        const isEmailValid = validateEmail();
        const isSubjectValid = validateSubject();
        const isMessageValid = validateMessage();

        if (isNameValid && isEmailValid && isSubjectValid && isMessageValid) {
            showToast("success", "Message Sent Successfully!");
            supportForm.reset();
        }
    });
}

// Filter Controls
document.getElementById('apply-filters')?.addEventListener('click', () => {
    const filters = {
        name: document.getElementById('filter-name')?.value.trim() || '',
        category: document.getElementById('filter-category')?.value || '',
        sortDir: document.getElementById('price-sort')?.value || 'asc',
    };
    fetchPlans(filters);
});

document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.getElementById('filter-name').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('price-sort').value = 'asc';
    fetchPlans();
});

// Logout Function
function confirmLogout() {
    const logoutModal = new bootstrap.Modal(document.getElementById('logoutModal'));
    logoutModal.show();

    const confirmBtn = document.getElementById('confirmLogoutBtn');
    confirmBtn.onclick = async () => {
        try {
            const token = getToken();
            if (!token) throw new Error('No session token found');

            await fetchWithAuth(`${window.apiBaseUrl.replace('subscriber', 'auth')}/logout/subscriber`, {
                method: 'POST'
            });

            sessionStorage.removeItem('jwtToken');
            showToast('success', 'Logged out successfully!');
            logoutModal.hide();
            setTimeout(() => window.location.href = '/index.html',1000);
        } catch (error) {
            console.error('Logout error:', error);
            showToast('error', 'Failed to logout: ' + error.message);
        }
    };
}

// Set Avatar Tooltip
async function setAvatarTooltip() {
    try {
        const response = await fetchWithAuth(`${window.apiBaseUrl}/me`);
        const userName = response.name || 'User';
        document.getElementById('navbarAvatar').setAttribute('data-bs-title', userName);
        new bootstrap.Tooltip(document.getElementById('navbarAvatar'));
    } catch (error) {
        console.error('Error fetching user data:', error);
        document.getElementById('navbarAvatar').setAttribute('data-bs-title', 'User');
    }
}