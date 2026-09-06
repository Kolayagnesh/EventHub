package com.eventhub.bookingservice.service;

import com.eventhub.bookingservice.client.EventServiceClient;
import com.eventhub.bookingservice.dto.CreateBookingRequest;
import com.eventhub.bookingservice.dto.EventSeatDto;
import com.eventhub.bookingservice.entity.Booking;
import com.eventhub.bookingservice.entity.BookingItem;
import com.eventhub.bookingservice.entity.BookingStatus;
import com.eventhub.bookingservice.event.BookingCreatedEvent;
import com.eventhub.bookingservice.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatLockService seatLockService;
    private final EventServiceClient eventServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public Booking createPendingBooking(Long userId, CreateBookingRequest request) {
        // 1. Fetch live seat layout from Event Service via OpenFeign
        List<EventSeatDto> availableSeats = eventServiceClient.getSeatsForEvent(request.getEventId());
        Map<Long, EventSeatDto> seatMap = availableSeats.stream()
                .collect(Collectors.toMap(EventSeatDto::getId, seat -> seat));

        // Validate that all requested seat IDs exist and are currently AVAILABLE
        for (Long requestedSeatId : request.getSeatIds()) {
            EventSeatDto seat = seatMap.get(requestedSeatId);
            if (seat == null) {
                throw new IllegalArgumentException("Seat ID " + requestedSeatId + " does not exist for this event");
            }
            if (!"AVAILABLE".equalsIgnoreCase(seat.getStatus())) {
                throw new IllegalStateException("Seat " + seat.getFullSeatCode() + " is already booked");
            }
        }

        // 2. Attempt atomic distributed locking in Redis (5-minute lease)
        boolean lockAcquired = seatLockService.acquireLocks(request.getEventId(), request.getSeatIds(), userId);
        if (!lockAcquired) {
            throw new IllegalStateException("One or more selected seats are currently locked by another customer. Please try again.");
        }

        // 3. Compute total amount
        BigDecimal totalAmount = request.getSeatIds().stream()
                .map(seatId -> seatMap.get(seatId).getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Create PENDING Booking in MySQL
        Booking booking = Booking.builder()
                .userId(userId)
                .eventId(request.getEventId())
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        List<BookingItem> items = request.getSeatIds().stream().map(seatId -> BookingItem.builder()
                .booking(booking)
                .eventSeatId(seatId)
                .price(seatMap.get(seatId).getPrice())
                .build()
        ).toList();

        booking.setItems(items);
        Booking savedBooking = bookingRepository.save(booking);
        log.info("Created PENDING booking {} for user {} with total amount {}", savedBooking.getId(), userId, totalAmount);
        BookingCreatedEvent event = BookingCreatedEvent.builder()
                .bookingId(savedBooking.getId())
                .userId(savedBooking.getUserId())
                .eventId(savedBooking.getEventId())
                .totalAmount(savedBooking.getTotalAmount())
                .seatIds(request.getSeatIds())
                .build();

        kafkaTemplate.send("booking-created", String.valueOf(savedBooking.getId()), event);
        log.info("Published BookingCreatedEvent to Kafka for booking ID: {}", savedBooking.getId());

        return savedBooking;
    }

    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));
    }

    public List<Booking> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    @Transactional
    public void confirmBooking(Long bookingId) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);
            log.info("Booking ID {} updated to CONFIRMED", bookingId);
        });
    }

    @Transactional
    public void cancelBookingAndReleaseSeats(Long bookingId, Long eventId, List<Long> seatIds) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);

            // Release Redis locks so seats are immediately available to other users
            seatLockService.releaseLocks(eventId, seatIds);
            log.warn("Saga Compensation: Booking ID {} marked CANCELLED and Redis seat locks released", bookingId);
        });
    }
}