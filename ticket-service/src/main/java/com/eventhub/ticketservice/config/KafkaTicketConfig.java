package com.eventhub.ticketservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTicketConfig {

    public static final String TICKET_GENERATED_TOPIC = "ticket-generated";

    @Bean
    public NewTopic ticketGeneratedTopic() {
        return TopicBuilder.name(TICKET_GENERATED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}