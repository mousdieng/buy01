package com.buy01.order.config.kafka.base;


import com.buy01.order.model.Response;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.ConcurrentMessageListenerContainer;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;

import java.time.Duration;

@Configuration
public class ReplyingKafkaConfig {

    @Bean
    public ReplyingKafkaTemplate<String, String, Response<?>> replyingAuthKafkaTemplate(
            ProducerFactory<String, String> producerFactory,
            ConcurrentMessageListenerContainer<String, Response<?>> repliesAuthContainer) {
        ReplyingKafkaTemplate<String, String, Response<?>> replyingTemplate =
                new ReplyingKafkaTemplate<>(producerFactory, repliesAuthContainer);
        replyingTemplate.setDefaultReplyTimeout(Duration.ofSeconds(5));
        return replyingTemplate;
    }

    @Bean
    public ReplyingKafkaTemplate<String, Object, Response<?>> replyingProductKafkaTemplate(
            ProducerFactory<String, Object> producerFactory,
            ConcurrentMessageListenerContainer<String, Response<?>> repliesProductContainer) {
        ReplyingKafkaTemplate<String, Object, Response<?>> replyingTemplate =
                new ReplyingKafkaTemplate<>(producerFactory, repliesProductContainer);
        replyingTemplate.setDefaultReplyTimeout(Duration.ofSeconds(5));
        return replyingTemplate;
    }
}