package com.nexhire.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NexHireApplication {

    public static void main(String[] args) {
        SpringApplication.run(NexHireApplication.class, args);
    }
}
