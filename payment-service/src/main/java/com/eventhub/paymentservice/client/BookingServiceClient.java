package com.eventhub.paymentservice.client;

import com.eventhub.paymentservice.dto.BookingResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "BOOKING-SERVICE")
public interface BookingServiceClient {

    @GetMapping("/api/v1/bookings/{id}")
    BookingResponseDto getBookingById(@PathVariable("id") Long id);
}