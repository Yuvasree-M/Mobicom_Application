# Mobi.comm – Mobile Prepaid Recharge Application

##  Overview

Mobi.comm is a full-stack mobile prepaid recharge platform that provides a seamless end-to-end user experience for browsing recharge plans, verifying users, and completing secure payments. The application is designed with scalable backend architecture and responsive UI for smooth interactions.

The system integrates secure payment processing using Razorpay, enabling real-time recharge transactions with strong validation and data protection.

---

##  Tech Stack

Frontend

* HTML5
* CSS3
* Bootstrap
* JavaScript
* Fetch API

Backend

* Java
* Spring Boot
* Spring MVC
* REST APIs

Database

* MySQL

Payment Integration

* Razorpay Payment Gateway

Tools

* Git & GitHub
* Postman

---

##  Features

* User registration and login
* Mobile number validation
* Recharge plan browsing
* Recharge processing workflow
* Secure payment integration
* Razorpay checkout integration
* Transaction success/failure handling
* Input validation and error handling
* Responsive UI design

---

##  Application Flow

1. User enters mobile number
2. System validates user details
3. Fetch available recharge plans
4. User selects recharge plan
5. Create payment order
6. Redirect to Razorpay checkout
7. Payment success/failure callback
8. Recharge confirmation displayed

---

##  Architecture

Controller → Service → Repository → Database

* Controller handles HTTP requests
* Service handles business logic
* Repository handles DB operations
* MySQL stores recharge & user data

---

##  Project Modules

* User Management
* Recharge Plan Module
* Payment Module
* Transaction Module
* Validation Module

---

##  Payment Integration

The application integrates Razorpay payment gateway for secure checkout and transaction handling. Razorpay supports multiple payment modes such as UPI, cards, and net banking, and can be integrated into Java/Spring Boot applications using SDK and REST APIs.

---

##  Run Locally

Clone repository
git clone https://github.com/Yuvasree-M/Mobicom_ApplicationPrepare

Navigate to project
cd Mobicom_ApplicationPrepare

Run Spring Boot application
mvn spring-boot:run

Open in browser
http://localhost:8080

---

##  Author

Yuvasree Mohanasundaram
Java Full Stack Developer

