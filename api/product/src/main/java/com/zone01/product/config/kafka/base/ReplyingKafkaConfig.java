package com.zone01.product.config.kafka.base;


import com.zone01.product.model.Response;
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
    public ReplyingKafkaTemplate<String, Object, Response<?>> replyingMediaKafkaTemplate(
            ProducerFactory<String, Object> producerFactory,
            ConcurrentMessageListenerContainer<String, Response<?>> repliesMediaContainer) {
        ReplyingKafkaTemplate<String, Object, Response<?>> replyingTemplate =
                new ReplyingKafkaTemplate<>(producerFactory, repliesMediaContainer);
        replyingTemplate.setDefaultReplyTimeout(Duration.ofSeconds(5));
        return replyingTemplate;
    }
}