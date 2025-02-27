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

document.addEventListener("DOMContentLoaded", function () {
    // Handle Recharge Button Click
    document.querySelectorAll(".recharge-btn").forEach(button => {
        button.addEventListener("click", function () {
            const selectedPlan = {
                name: this.closest('.plan-card').getAttribute("data-name"),
                price: this.closest('.plan-card').getAttribute("data-price"),
                validity: this.closest('.plan-card').getAttribute("data-validity"),
                calls: this.closest('.plan-card').getAttribute("data-calls"),
                sms: this.closest('.plan-card').getAttribute("data-sms"),
                data: this.closest('.plan-card').getAttribute("data-data")
            };

            // Show modal with plan details
            document.getElementById("modal-plan-details").innerHTML = `
                <strong>${selectedPlan.name}</strong> <br>
                Price: ₹${selectedPlan.price} <br>
                Validity: ${selectedPlan.validity} <br>
                Calls: ${selectedPlan.calls} <br>
                SMS: ${selectedPlan.sms} <br>
                Data: ${selectedPlan.data}
            `;
            new bootstrap.Modal(document.getElementById("confirmationModal")).show();
            
            // Store selected plan for confirmation button
            document.getElementById("confirmRecharge").setAttribute("data-plan", JSON.stringify(selectedPlan));
        });
    });

    // Confirm Recharge and Redirect
    document.getElementById("confirmRecharge").addEventListener("click", function () {
        const selectedPlan = JSON.parse(this.getAttribute("data-plan"));
        window.location.href = `payment_simulation.html?name=${encodeURIComponent(selectedPlan.name)}&price=${selectedPlan.price}&validity=${encodeURIComponent(selectedPlan.validity)}&calls=${encodeURIComponent(selectedPlan.calls)}&sms=${encodeURIComponent(selectedPlan.sms)}&data=${encodeURIComponent(selectedPlan.data)}`;
    });
    
    // Smooth scrolling for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 70,
                behavior: 'smooth'
            });
            
            // Update active link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.plan-section');
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= (sectionTop - 100)) {
                current = '#' + section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === current) {
                link.classList.add('active');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    showSection('dashboard');
});


document.getElementById("logoutBtn").addEventListener("click", function () {
    // localStorage.removeItem("loggedInNumber");
    window.location.href = "login.html";
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





 // Show/hide home button based on scroll position
 window.addEventListener("scroll", function () {
    let homeButton = document.getElementById("homeButton");
    if (window.scrollY > 200) {
        homeButton.style.display = "block";
    } else {
        homeButton.style.display = "none";
    }
    updateActiveNavItem();
});

document.getElementById("homeButton").addEventListener("click", function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


