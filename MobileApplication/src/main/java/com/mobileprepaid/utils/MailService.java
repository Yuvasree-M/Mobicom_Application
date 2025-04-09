package com.mobileprepaid.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.mobileprepaid.entities.Transaction;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

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

    @Value("${app.mail.sender-name:Mobi.comm}")
    private String senderName;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendInvoiceEmail(String to, Transaction transaction) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        logger.info("Sending invoice email with sender: {} <{}>", senderName, fromEmail);
        try {
            helper.setFrom(fromEmail, senderName); // This can throw UnsupportedEncodingException
        } catch (UnsupportedEncodingException e) {
            logger.error("Unsupported encoding for sender name: {}. Falling back to email only: {}", senderName, fromEmail);
            helper.setFrom(fromEmail); // Fallback to email only
        }
        helper.setTo(to);
        helper.setSubject("Invoice for Your Recent Recharge - " + transaction.getTransactionId());
        helper.setText(generateInvoiceHtml(transaction), true);

        try {
            mailSender.send(message);
            logger.info("Invoice email sent successfully to {}", to);
        } catch (Exception e) {
            logger.error("Failed to send invoice email to {}: {}", to, e.getMessage());
            throw new MessagingException("Email sending failed", e);
        }
    }

    public void sendExpiryNotification(String name, String phone, String email, String expiryDate) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        logger.info("Sending expiry notification to email: {}", email);
        logger.info("Using sender: {} <{}>", senderName, fromEmail);

        // Parse expiry date (assuming format like "yyyy-MM-dd" or "dd-MM-yyyy")
        LocalDate expiry;
        try {
            if (expiryDate.contains("-") && expiryDate.split("-").length == 3) {
                String[] parts = expiryDate.split("-");
                if (parts[0].length() == 4) {
                    expiry = LocalDate.parse(expiryDate, DateTimeFormatter.ISO_LOCAL_DATE); // yyyy-MM-dd
                } else {
                    expiry = LocalDate.parse(expiryDate, DateTimeFormatter.ofPattern("dd-MM-yyyy")); // dd-MM-yyyy
                }
            } else {
                throw new IllegalArgumentException("Invalid expiry date format");
            }
        } catch (Exception e) {
            logger.error("Invalid expiry date: {}", expiryDate);
            throw new MessagingException("Invalid expiry date format", e);
        }

        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, expiry);

        String subject;
        String plainMessage;
        if (daysRemaining > 3) {
            subject = "Mobi.Comm Subscription Update";
            plainMessage = String.format("Dear %s, your subscription is still active and will expire in %d days.", name, daysRemaining);
        } else if (daysRemaining == 3) {
            subject = "Mobi.Comm Subscription Reminder: 3 Days Remaining";
            plainMessage = String.format("Dear %s, your subscription is nearing its expiry date. Only 3 days remaining! Please recharge soon.", name);
        } else if (daysRemaining == 2) {
            subject = "Mobi.Comm Subscription Reminder: 2 Days Remaining";
            plainMessage = String.format("Dear %s, your subscription expires in 2 days. Please recharge soon!", name);
        } else if (daysRemaining == 1) {
            subject = "Mobi.Comm Subscription Reminder: Expiring Tomorrow";
            plainMessage = String.format("Dear %s, your subscription expires tomorrow! Please recharge today to avoid interruption.", name);
        } else if (daysRemaining == 0) {
            subject = "Mobi.Comm Subscription Reminder: Expiring Today";
            plainMessage = String.format("Dear %s, your subscription expires today! Please recharge now to continue services.", name);
        } else {
            subject = "Mobi.Comm Subscription Expired";
            plainMessage = String.format("Dear %s, your subscription has expired. Please recharge to reactivate your plan.", name);
        }

        String htmlMessage = String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
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
                        <p>%s</p>
                        <p>Phone: %s</p>
                        <p>Email: %s</p>
                        <p>Expiry Date: %s</p>
                    </div>
                    <div class="footer">
                        <p>© %d Mobi.Comm. All rights reserved.</p>
                        <p>Contact us at support@mobicomm.com</p>
                    </div>
                </div>
            </body>
            </html>
            """, subject, plainMessage, phone, email != null ? email : "Not provided", expiryDate, LocalDate.now().getYear());

        try {
            helper.setFrom(fromEmail, senderName); // This can throw UnsupportedEncodingException
        } catch (UnsupportedEncodingException e) {
            logger.error("Unsupported encoding for sender name: {}. Falling back to email only: {}", senderName, fromEmail);
            helper.setFrom(fromEmail); // Fallback to email only
        }
        helper.setTo(email);
        helper.setSubject(subject);
        helper.setText(plainMessage, htmlMessage);

        try {
            mailSender.send(message);
            logger.info("Expiry notification sent successfully to {}", email);
        } catch (Exception e) {
            logger.error("Failed to send expiry notification to {}: {}", email, e.getMessage());
            throw new MessagingException("Email sending failed", e);
        }
    }

    private String generateInvoiceHtml(Transaction transaction) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; }
                    .header { text-align: center; background: #008080; color: white; padding: 10px; }
                    .details { margin: 20px 0; }
                    .details table { width: 100%%; border-collapse: collapse; }
                    .details th, .details td { padding: 8px; border: 1px solid #ddd; }
                    .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
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
                        <p>Thank you for choosing %s!</p>
                        <p>Contact us at support@mobicomm.com for any queries.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            senderName,
            safeString(transaction.getTransactionId()),
            safeString(transaction.getSubscriberName()),
            safeString(transaction.getSubscriberNumber()),
            safeString(transaction.getPlanName()),
            transaction.getPlanPrice() != null ? transaction.getPlanPrice() : 0.0,
            safeString(transaction.getPlanValidity() != null ? transaction.getPlanValidity().toString() : "N/A"),
            safeString(transaction.getPaymentMethod()),
            safeString(transaction.getRechargeDate() != null ? transaction.getRechargeDate().toString() : "N/A"),
            safeString(transaction.getStatus()),
            senderName
        );
    }

    private String safeString(Object value) {
        return value != null ? value.toString() : "N/A";
    }
}