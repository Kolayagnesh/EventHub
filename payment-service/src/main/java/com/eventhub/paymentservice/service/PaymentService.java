package com.eventhub.paymentservice.service;

import com.eventhub.paymentservice.client.BookingServiceClient;
import com.eventhub.paymentservice.dto.BookingResponseDto;
import com.eventhub.paymentservice.event.BookingCreatedEvent;
import com.eventhub.paymentservice.event.PaymentCompletedEvent;
import com.eventhub.paymentservice.event.PaymentFailedEvent;
import com.eventhub.paymentservice.model.Payment;
import com.eventhub.paymentservice.model.PaymentStatus;
import com.eventhub.paymentservice.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RazorpayClient razorpayClient;
    private final BookingServiceClient bookingServiceClient;
    @Value("${razorpay.key-secret}")
    private String keySecret;

    /**
     * 1. Consumes 'booking-created' and initializes an official Razorpay Order
     */
    @Transactional
    public Payment createRazorpayOrder(BookingCreatedEvent event) {
        if (paymentRepository.findByBookingId(event.getBookingId()).isPresent()) {
            return paymentRepository.findByBookingId(event.getBookingId()).get();
        }

        try {
            long amountInPaise = event.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_bkg_" + event.getBookingId());

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                    .bookingId(event.getBookingId())
                    .userId(event.getUserId())
                    .amount(event.getTotalAmount())
                    .status(PaymentStatus.PENDING)
                    .razorpayOrderId(razorpayOrderId)
                    .build();

            Payment saved = paymentRepository.save(payment);
            log.info("Initialized Razorpay Order {} for Booking ID: {}", razorpayOrderId, event.getBookingId());
            return saved;

        } catch (Exception e) {
            log.error("Failed to generate Razorpay order for booking ID {}: {}", event.getBookingId(), e.getMessage());
            throw new RuntimeException("Razorpay order generation failed", e);
        }
    }

    /**
     * 2. Verifies cryptographic signature after user pays on the modal
     */
    @Transactional
    public Payment verifyPayment(Long bookingId, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment record not found for booking: " + bookingId));

        // 1. Fetch eventId and seatIds from booking-service via Feign
        BookingResponseDto booking = bookingServiceClient.getBookingById(bookingId);
        Long eventId = booking.getEventId();
        List<Long> seatIds = (booking.getItems() != null)
                ? booking.getItems().stream().map(BookingResponseDto.BookingItemDto::getEventSeatId).toList()
                : Collections.emptyList();

        if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null || razorpaySignature.isBlank()) {
            return handlePaymentFailure(payment, eventId, seatIds, "Missing Razorpay verification parameters");
        }

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId.trim());
            options.put("razorpay_payment_id", razorpayPaymentId.trim());
            options.put("razorpay_signature", razorpaySignature.trim());

            boolean isValidSignature = Utils.verifyPaymentSignature(options, keySecret);

            if (isValidSignature) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setRazorpayPaymentId(razorpayPaymentId);
                payment.setRazorpaySignature(razorpaySignature);
                paymentRepository.save(payment);

                PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                        .bookingId(payment.getBookingId())
                        .paymentId(payment.getId())
                        .userId(payment.getUserId())
                        .eventId(eventId)
                        .seatIds(seatIds)
                        .amount(payment.getAmount())
                        .transactionId(razorpayPaymentId)
                        .build();

                kafkaTemplate.send("payment-completed", String.valueOf(payment.getBookingId()), event);
                log.info("Emitted 'payment-completed' for booking: {}", bookingId);
            } else {
                handlePaymentFailure(payment, eventId, seatIds, "Signature verification failed");
            }
        } catch (Exception e) {
            handlePaymentFailure(payment, eventId, seatIds, "Verification error: " + e.getMessage());
        }

        return payment;
    }

    @Transactional
    public Payment handlePaymentFailure(Payment payment, Long eventId, List<Long> seatIds, String reason) {
        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        paymentRepository.save(payment);

        PaymentFailedEvent event = PaymentFailedEvent.builder()
                .bookingId(payment.getBookingId())
                .eventId(eventId)
                .userId(payment.getUserId())
                .seatIds(seatIds)
                .reason(reason)
                .build();

        kafkaTemplate.send("payment-failed", String.valueOf(payment.getBookingId()), event);
        log.warn("Emitted 'payment-failed' for booking: {}", payment.getBookingId());
        return payment;
    }

    public Payment getPaymentByBookingId(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found for booking: " + bookingId));
    }
}