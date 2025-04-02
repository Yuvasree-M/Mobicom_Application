
document.addEventListener("DOMContentLoaded", function () {

    const navbarHeight = document.querySelector('.navbar').offsetHeight;
    document.documentElement.style.setProperty('--scroll-padding', navbarHeight + 'px');
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
document.getElementById('mobileNumber').addEventListener('input', function() {
    let value = this.value.replace(/[^0-9+]/g, '');
    if (!value.startsWith('+91')) value = '+91 ' + value.replace('+91', '').trim();
    this.value = value.slice(0, 14);
    document.getElementById('error-message').textContent = '';
});

document.getElementById('rechargeButton').addEventListener('click', async () => {
    const mobileNumber = document.getElementById('mobileNumber').value.trim();
    const normalizedNumber = mobileNumber.replace('+91', '').trim();

    if (!/^\d{10}$/.test(normalizedNumber)) {
        document.getElementById('error-message').textContent = 'Please enter a valid 10-digit mobile number';
        return;
    }

    try {
        const response = await fetch('http://localhost:8083/quick/recharge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber: normalizedNumber })
        });
        const result = await response.json();
        if (result.status === 'SUCCESS') {
            sessionStorage.setItem('jwtToken', result.token);
            window.location.href = `subscriber/plans.html?mobileNumber=${normalizedNumber}`;
        } else {
            document.getElementById('error-message').textContent = result.message;
        }
    } catch (error) {
        document.getElementById('error-message').textContent = 'Failed to validate number.';
    }
});