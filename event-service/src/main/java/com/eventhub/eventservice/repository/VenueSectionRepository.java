package com.eventhub.eventservice.repository;

import com.eventhub.eventservice.entity.VenueSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueSectionRepository extends JpaRepository<VenueSection, Long> {
    List<VenueSection> findByVenueId(Long venueId);
}