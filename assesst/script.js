
        document.addEventListener("DOMContentLoaded", function () {

            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            document.documentElement.style.setProperty('--scroll-padding', navbarHeight + 'px');

            document.getElementById('rechargeButton').addEventListener('click', function () {
                var mobileNumber = document.getElementById('mobileNumber').value;
                var errorMessage = document.getElementById('error-message');

                errorMessage.innerHTML = '';
                if (!mobileNumber) {
                    errorMessage.innerHTML = 'Please enter your mobile number.';
                    return;
                }
                var phoneRegex = /^\+91\s\d{5}\s\d{5}$/;
                if (!phoneRegex.test(mobileNumber)) {
                    errorMessage.innerHTML = 'Please enter a valid phone number (e.g., +91 XXXXX XXXXX).';
                    return;
                }

                window.location.href = 'subscriber/plans.html';
            });


            const rechargeButtons = document.querySelectorAll(".recharge-btn");
            rechargeButtons.forEach(btn => {
                btn.addEventListener("click", function () {
                    let planCard = this.closest(".plan-card");
                    let planData = {
                        price: planCard.dataset.price,
                        validity: planCard.dataset.validity,
                        data: planCard.dataset.data
                    };


                    window.location.href = `subscriber/payment_simulation.html?price=${planData.price}&validity=${planData.validity}&data=${planData.data}`;
                });
            });

            // Handle smooth scrolling for nav links with fixed navbar
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    this.classList.add('active');
                    const targetId = this.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
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

        // Function to update active nav item based on scroll position
        function updateActiveNavItem() {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const sections = ['home', 'offers', 'quick-recharge', 'plans', 'faq', 'contact'];
            const navLinks = document.querySelectorAll('.nav-link');

            let currentSection = '';

            sections.forEach(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= navbarHeight + 20 && rect.bottom >= navbarHeight + 20) {
                        currentSection = section;
                    }
                }
            });

            if (currentSection) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSection}`) {
                        link.classList.add('active');
                    }
                });
            }
        }

        document.addEventListener("DOMContentLoaded", function () {
            const plans = [
                { name: "Basic Plan", price: 299, validity: "28 Days", calls: "500 minutes", sms: "100", data: "1GB/day" },
                { name: "Unlimited Plan", price: 999, validity: "90 Days", calls: "Unlimited", sms: "100/day", data: "5GB/day" },
                { name: "Data Booster Plan", price: 599, validity: "28 Days", calls: "N/A", sms: "N/A", data: "2GB Total" },
                { name: "Basic Plan", price: 349, validity: "30 Days", calls: "600 minutes", sms: "150", data: "1.5GB/day" },
                { name: "Unlimited Plan", price: 1099, validity: "100 Days", calls: "Unlimited", sms: "120/day", data: "4GB/day" },
                { name: "Data Booster Plan", price: 699, validity: "35 Days", calls: "N/A", sms: "N/A", data: "3GB Total" },
                { name: "Basic Plan", price: 199, validity: "21 Days", calls: "400 minutes", sms: "80", data: "1GB/day" },
                { name: "Unlimited Plan", price: 1299, validity: "120 Days", calls: "Unlimited", sms: "150/day", data: "6GB/day" },
                { name: "Data Booster Plan", price: 799, validity: "42 Days", calls: "N/A", sms: "N/A", data: "5GB Total" }
            ];

            const plansContainer = document.getElementById("plans-container");
            let selectedPlan = {};

            plans.forEach(plan => {
                const planCard = document.createElement("div");
                planCard.classList.add("col-md-4", "mb-4");

                planCard.innerHTML = `
                    <div class="plan-card">
                        <h4>${plan.name} | ₹${plan.price}</h4>
                        <p>Validity: <strong> ${plan.validity} </strong></p>
                        <p>Calls: <strong> ${plan.calls}</strong></p>
                        <p>SMS: <strong> ${plan.sms}</strong></p>
                        <p>Data: <strong> ${plan.data}</strong></p>
                        <a class="btn btn-warning" href="subscriber/login.html">
                            Recharge
                        </a>
                    </div>
                `;

                plansContainer.appendChild(planCard);
            });

        });