package com.eventhub.bookingservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeatLockService {

    private final StringRedisTemplate redisTemplate;
    private static final long LOCK_TTL_SECONDS = 300; // 5 minutes

    /**
     * Tries to lock all requested seats atomically.
     * If any seat is already locked, releases already acquired locks and returns false.
     */
    public boolean acquireLocks(Long eventId, List<Long> seatIds, Long userId) {
        List<String> acquiredKeys = new ArrayList<>();

        for (Long seatId : seatIds) {
            String lockKey = buildLockKey(eventId, seatId);
            Boolean success = redisTemplate.opsForValue()
                    .setIfAbsent(lockKey, String.valueOf(userId), Duration.ofSeconds(LOCK_TTL_SECONDS));

            if (Boolean.TRUE.equals(success)) {
                acquiredKeys.add(lockKey);
            } else {
                log.warn("Seat {} for event {} is already locked by another customer", seatId, eventId);
                // Rollback previously acquired locks in this attempt
                releaseLocksByKeys(acquiredKeys);
                return false;
            }
        }
        return true;
    }

    public void releaseLocks(Long eventId, List<Long> seatIds) {
        List<String> keys = seatIds.stream().map(seatId -> buildLockKey(eventId, seatId)).toList();
        releaseLocksByKeys(keys);
    }

    private void releaseLocksByKeys(List<String> keys) {
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private String buildLockKey(Long eventId, Long seatId) {
        return "lock:event:" + eventId + ":seat:" + seatId;
    }
}