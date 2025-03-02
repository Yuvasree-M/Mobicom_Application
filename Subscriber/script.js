function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('onclick')?.includes(sectionId)) {
            link.classList.add('active');
        }
    });
}


document.addEventListener('DOMContentLoaded', function () {
    showSection('dashboard');
});

function confirmLogout() {
    $('#logoutModal').modal('show');
}

document.getElementById('confirmLogoutBtn').addEventListener('click', function() {
    window.location.href = '../index.html';
});

function goToNotifications() {
    showSection('notifications');
}

document.addEventListener("DOMContentLoaded", function () {
    let selectedPlan = document.querySelector(".plan-card"); 

    if (selectedPlan) {
        document.getElementById("currentPlanName").textContent = selectedPlan.getAttribute("data-name");
        document.getElementById("currentPlanPrice").textContent = "₹" + selectedPlan.getAttribute("data-price");
        document.getElementById("currentPlanValidity").textContent = selectedPlan.getAttribute("data-validity");
        document.getElementById("currentPlanCalls").textContent = selectedPlan.getAttribute("data-calls");
        document.getElementById("currentPlanSMS").textContent = selectedPlan.getAttribute("data-sms");
        document.getElementById("currentPlanData").textContent = selectedPlan.getAttribute("data-data");
    }
});

document.querySelector('.notification-icon').addEventListener('click', goToNotifications);

// Profile Management

document.addEventListener("DOMContentLoaded", function () {
    let profileImage = document.getElementById("profileImage");
    let profileImageInput = document.getElementById("profileImageInput");
    let userNameField = document.getElementById("userName");
    let displayUserName = document.getElementById("displayUserName");
    let addressField = document.getElementById("address");
    let paymentPreference = document.getElementById("paymentPreference");
    let updateBtn = document.getElementById("updateProfileBtn");

    let userNameMessage = document.getElementById("userNameMessage");
    let addressMessage = document.getElementById("addressMessage");
    let paymentMessage = document.getElementById("paymentMessage");

    let profileUpdated = {
        imageChanged: false,
        name: userNameField.value.trim(),
        address: addressField.value.trim(),
        payment: paymentPreference.value
    };

    // Profile Image Update
    profileImageInput.addEventListener("change", function (event) {
        let file = event.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function (e) {
                profileImage.src = e.target.result;
                profileUpdated.imageChanged = true;
            };
            reader.readAsDataURL(file);
        }
    });

    // Update Button Click Event
    updateBtn.addEventListener("click", function () {
        let updatedName = userNameField.value.trim();
        let updatedAddress = addressField.value.trim();
        let updatedPayment = paymentPreference.value;

        // Reset messages
        userNameMessage.style.display = "none";
        addressMessage.style.display = "none";
        paymentMessage.style.display = "none";

        let changesMade = false;

        // Name Update
        if (updatedName !== profileUpdated.name) {
            profileUpdated.name = updatedName;
            displayUserName.textContent = updatedName;
            userNameMessage.textContent = "✔ Name updated successfully!";
            userNameMessage.style.display = "block";
            changesMade = true;
        }

        // Address Update
        if (updatedAddress !== profileUpdated.address) {
            profileUpdated.address = updatedAddress;
            addressMessage.textContent = "✔ Address updated successfully!";
            addressMessage.style.display = "block";
            changesMade = true;
        }

        // Payment Preference Update
        if (updatedPayment !== profileUpdated.payment) {
            profileUpdated.payment = updatedPayment;
            paymentMessage.textContent = "✔ Payment preference updated successfully!";
            paymentMessage.style.display = "block";
            changesMade = true;
        }

        // Profile Image Update
        if (profileUpdated.imageChanged) {
            addressMessage.textContent += "\n✔ Profile picture updated successfully!";
            addressMessage.style.display = "block";
            changesMade = true;
        }

        if (!changesMade) {
            addressMessage.textContent = "No changes were made.";
            addressMessage.style.display = "block";
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const rechargeButtons = document.querySelectorAll(".recharge-btn");
    rechargeButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            let planCard = this.closest(".plan-card");
            let params = new URLSearchParams();
            Array.from(planCard.attributes).forEach(attr => {
                if (attr.name.startsWith("data-")) {
                    params.append(attr.name.substring(5), attr.value);
                }
            });
            window.location.href = `payment_simulation.html?${params.toString()}`;
        });
    });
});


// Add event listener to handle file selection for profile image update
profileImageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const imageUrl = URL.createObjectURL(file);
        profileImage.src = imageUrl;
        navbarAvatar.src = imageUrl;
        localStorage.setItem("profileImage", imageUrl);
    }
});




