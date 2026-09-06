package com.eventhub.userservice.service;

import com.eventhub.userservice.dto.UserProfileRequest;
import com.eventhub.userservice.entity.Address;
import com.eventhub.userservice.entity.User;
import com.eventhub.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getProfileByAuthId(Long authUserId) {
        return userRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("User profile not found for auth ID: " + authUserId));
    }

    @Transactional
    public User createOrUpdateProfile(Long authUserId, UserProfileRequest request) {
        User user = userRepository.findByAuthUserId(authUserId)
                .orElse(User.builder().authUserId(authUserId).build());

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());

        if (request.getStreet() != null || request.getCity() != null) {
            Address address = user.getAddresses().isEmpty() ? new Address() : user.getAddresses().get(0);
            address.setUser(user);
            address.setStreet(request.getStreet());
            address.setCity(request.getCity());
            address.setState(request.getState());
            address.setZipCode(request.getZipCode());

            if (user.getAddresses().isEmpty()) {
                user.getAddresses().add(address);
            }
        }

        return userRepository.save(user);
    }
}