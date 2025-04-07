package com.mobileprepaid.utils;

import com.mobileprepaid.entities.Transaction;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Service
public class MailService {

    private static final Logger logger = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.sender-name:MobiComm}")
    private String senderName;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    public void logMailConfig() {
        logger.info("✅ Mail configuration loaded - From: {} <{}>", senderName, fromEmail);
    }

    public void sendInvoiceEmail(String to, Transaction transaction) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        try {
            helper.setFrom(fromEmail, senderName);
        } catch (UnsupportedEncodingException e) {
            logger.warn("⚠️ Unsupported sender name encoding, fallback to plain email");
            helper.setFrom(fromEmail);
        }

        helper.setTo(to);
        helper.setSubject("Invoice for Your Recent Recharge - " + transaction.getTransactionId());
        helper.setText(generateInvoiceHtml(transaction), true);

        try {
            mailSender.send(message);
            logger.info("📧 Invoice email sent to {}", to);
        } catch (Exception e) {
            logger.error("❌ Failed to send invoice email to {}: {}", to, e.getMessage());
            throw new MessagingException("Email sending failed", e);
        }
    }

    public void sendExpiryNotification(String name, String phone, String email, String expiryDate) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        logger.info("📨 Preparing expiry notification for {}", email);

        LocalDate expiry = parseExpiryDate(expiryDate);
        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, expiry);

        String subject;
        String plainMessage;
        if (daysRemaining > 3) {
            subject = "MobiComm Subscription Update";
            plainMessage = String.format("Dear %s, your subscription is active and expires in %d days.", name, daysRemaining);
        } else if (daysRemaining == 3) {
            subject = "Reminder: 3 Days Left - Recharge Soon!";
            plainMessage = String.format("Dear %s, your subscription expires in 3 days. Recharge soon!", name);
        } else if (daysRemaining == 2) {
            subject = "Reminder: 2 Days Left";
            plainMessage = String.format("Dear %s, your subscription expires in 2 days. Please recharge.", name);
        } else if (daysRemaining == 1) {
            subject = "Expiring Tomorrow!";
            plainMessage = String.format("Dear %s, your subscription expires tomorrow. Recharge to avoid interruption.", name);
        } else if (daysRemaining == 0) {
            subject = "Expiring Today!";
            plainMessage = String.format("Dear %s, your subscription expires today. Recharge now to stay connected.", name);
        } else {
            subject = "Subscription Expired";
            plainMessage = String.format("Dear %s, your subscription has expired. Recharge to resume service.", name);
        }

        String htmlMessage = buildHtmlExpiryMessage(subject, plainMessage, phone, email, expiryDate);

        try {
            helper.setFrom(fromEmail, senderName);
        } catch (UnsupportedEncodingException e) {
            logger.warn("⚠️ Sender name encoding issue, using plain email.");
            helper.setFrom(fromEmail);
        }

        helper.setTo(email);
        helper.setSubject(subject);
        helper.setText(plainMessage, htmlMessage);

        try {
            mailSender.send(message);
            logger.info("✅ Expiry notification sent to {}", email);
        } catch (Exception e) {
            logger.error("❌ Failed to send expiry email to {}: {}", email, e.getMessage());
            throw new MessagingException("Email sending failed", e);
        }
    }

    private LocalDate parseExpiryDate(String expiryDate) throws MessagingException {
        try {
            if (expiryDate.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return LocalDate.parse(expiryDate, DateTimeFormatter.ISO_LOCAL_DATE); // yyyy-MM-dd
            } else if (expiryDate.matches("\\d{2}-\\d{2}-\\d{4}")) {
                return LocalDate.parse(expiryDate, DateTimeFormatter.ofPattern("dd-MM-yyyy")); // dd-MM-yyyy
            } else {
                throw new IllegalArgumentException("Invalid expiry date format: " + expiryDate);
            }
        } catch (Exception e) {
            logger.error("⚠️ Date parsing failed: {}", expiryDate);
            throw new MessagingException("Invalid expiry date format", e);
        }
    }

    private String buildHtmlExpiryMessage(String subject, String body, String phone, String email, String expiryDate) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>%s</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    .header { background: #26A69A; padding: 20px; color: white; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                    .content { padding: 20px; color: #333; }
                    .footer { background: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>MobiComm Prepaid Service</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <p><strong>Phone:</strong> %s</p>
                        <p><strong>Email:</strong> %s</p>
                        <p><strong>Expiry Date:</strong> %s</p>
                    </div>
                    <div class="footer">
                        <p>© %d MobiComm. All rights reserved.</p>
                        <p>Contact us at support@mobicomm.com</p>
                    </div>
                </div>
            </body>
            </html>
        """, subject, body, phone, email, expiryDate, LocalDate.now().getYear());
    }

    private String generateInvoiceHtml(Transaction t) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; }
                    .header { text-align: center; background: #008080; color: white; padding: 10px; }
                    .details table { width: 100%%; border-collapse: collapse; }
                    .details th, .details td { padding: 8px; border: 1px solid #ccc; }
                    .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>%s</h2>
                        <p>Your Recharge Invoice</p>
                    </div>
                    <div class="details">
                        <table>
                            <tr><th>Transaction ID</th><td>%s</td></tr>
                            <tr><th>Subscriber Name</th><td>%s</td></tr>
                            <tr><th>Subscriber Number</th><td>%s</td></tr>
                            <tr><th>Plan Name</th><td>%s</td></tr>
                            <tr><th>Amount</th><td>₹%.2f</td></tr>
                            <tr><th>Validity</th><td>%s days</td></tr>
                            <tr><th>Payment Method</th><td>%s</td></tr>
                            <tr><th>Issue Date</th><td>%s</td></tr>
                            <tr><th>Status</th><td>%s</td></tr>
                        </table>
                    </div>
                    <div class="footer">
                        <p>Thanks for choosing %s!</p>
                        <p>Contact: support@mobicomm.com</p>
                    </div>
                </div>
            </body>
            </html>
        """,
            senderName,
            safe(t.getTransactionId()),
            safe(t.getSubscriberName()),
            safe(t.getSubscriberNumber()),
            safe(t.getPlanName()),
            t.getPlanPrice() != null ? t.getPlanPrice() : 0.0,
            safe(t.getPlanValidity() != null ? t.getPlanValidity().toString() : "N/A"),
            safe(t.getPaymentMethod()),
            safe(t.getRechargeDate() != null ? t.getRechargeDate().toString() : "N/A"),
            safe(t.getStatus()),
            senderName
        );
    }

    private String safe(Object val) {
        return val != null ? val.toString() : "N/A";
    }
}
