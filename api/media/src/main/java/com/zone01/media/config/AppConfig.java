package com.zone01.media.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zone01.media.model.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;

@Configuration
@RequiredArgsConstructor
public class AppConfig {
    private final ObjectMapper jacksonObjectMapper;
    private final ReplyingKafkaTemplate<String, String, Response<?>> replyingAuthKafkaTemplate;

    @Bean
    public FilterRegistrationBean<AccessValidation> accessValidationFilter() {
        FilterRegistrationBean<AccessValidation> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new AccessValidation(jacksonObjectMapper, replyingAuthKafkaTemplate));
        registrationBean.addUrlPatterns("/api/v1/*");
        return registrationBean;
    }

}
