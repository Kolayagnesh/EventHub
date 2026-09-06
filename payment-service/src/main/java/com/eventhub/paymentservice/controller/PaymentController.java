package com.eventhub.paymentservice.controller;

import com.eventhub.paymentservice.model.Payment;
import com.eventhub.paymentservice.service.PaymentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<Payment> getPayment(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    @PostMapping("/verify")
    public ResponseEntity<Payment> verifyPayment(@RequestBody VerifyPaymentRequest request) {
        Payment payment = paymentService.verifyPayment(
                request.getBookingId(),
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/fail")
    public ResponseEntity<Payment> failPayment(@RequestBody FailPaymentRequest request) {
        Payment payment = paymentService.getPaymentByBookingId(request.getBookingId());
        return ResponseEntity.ok(paymentService.handlePaymentFailure(
                payment,
                request.getEventId(),
                request.getSeatIds(),
                request.getReason()
        ));
    }

    @Data
    public static class VerifyPaymentRequest {
        private Long bookingId;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }

    @Data
    public static class FailPaymentRequest {
        private Long bookingId;
        private Long eventId;
        private List<Long> seatIds;
        private String reason;
    }
}