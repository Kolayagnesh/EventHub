package com.eventhub.notificationservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendPaymentSuccessEmail(String toEmail, Long bookingId, BigDecimal amount, String transactionId) {
        String subject = "Payment Confirmed - Booking #" + bookingId;
        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2e7d32;">Payment Received Successfully!</h2>
                <p>Thank you for booking with <strong>EventHub</strong>.</p>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <table style="width: 100%%; text-align: left;">
                    <tr><td><strong>Booking ID:</strong></td><td>#%d</td></tr>
                    <tr><td><strong>Amount Paid:</strong></td><td>₹%s</td></tr>
                    <tr><td><strong>Transaction Reference:</strong></td><td>%s</td></tr>
                </table>
                <p style="margin-top: 20px;">Your ticket passes are currently being generated and will be sent shortly.</p>
            </div>
            """.formatted(bookingId, amount.toPlainString(), transactionId);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendPaymentFailedEmail(String toEmail, Long bookingId, String reason) {
        String subject = "Payment Failed - Booking #" + bookingId;
        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #c62828;">Payment Could Not Be Completed</h2>
                <p>We were unable to process payment for Booking <strong>#%d</strong>.</p>
                <p><strong>Reason:</strong> %s</p>
                <p style="color: #555;">Any temporary seat locks have been released. Please return to the event page to reserve your tickets again.</p>
            </div>
            """.formatted(bookingId, reason);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendTicketPassesEmail(String toEmail, Long bookingId, List<String> ticketCodes) {
        StringBuilder codesHtml = new StringBuilder();
        for (String code : ticketCodes) {
            codesHtml.append("<li style='font-size: 16px; font-weight: bold; padding: 4px 0;'>").append(code).append("</li>");
        }

        String subject = "Your Event Tickets - Booking #" + bookingId;
        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #1565c0;">Your Event Passes Are Ready!</h2>
                <p>Your tickets for Booking <strong>#%d</strong> have been generated.</p>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <h3>Active Pass Codes:</h3>
                <ul>
                    %s
                </ul>
                <p>You can also view and present your digital QR codes by opening your EventHub portal.</p>
            </div>
            """.formatted(bookingId, codesHtml.toString());

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("Email successfully sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }
}