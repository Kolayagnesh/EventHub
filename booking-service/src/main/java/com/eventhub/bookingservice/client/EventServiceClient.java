package com.eventhub.bookingservice.client;

import com.eventhub.bookingservice.dto.EventSeatDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "EVENT-SERVICE")
public interface EventServiceClient {

    @GetMapping("/api/v1/events/{eventId}/seats")
    List<EventSeatDto> getSeatsForEvent(@PathVariable("eventId") Long eventId);
}