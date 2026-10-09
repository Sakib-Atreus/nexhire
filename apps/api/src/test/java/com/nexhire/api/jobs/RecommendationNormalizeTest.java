package com.nexhire.api.jobs;

import com.nexhire.api.modules.jobs.RecommendationService;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class RecommendationNormalizeTest {

    private static String normalize(String s) throws Exception {
        Method m = RecommendationService.class.getDeclaredMethod("normalize", String.class);
        m.setAccessible(true);
        return (String) m.invoke(null, s);
    }

    @Test
    void skillNamesMatchRegardlessOfCaseSpacingAndPunctuation() throws Exception {
        assertThat(normalize("Node.js")).isEqualTo(normalize("nodejs"));
        assertThat(normalize("Spring Boot")).isEqualTo(normalize("spring-boot"));
        assertThat(normalize("C++")).isNotEqualTo(normalize("C#"));
        assertThat(normalize("TypeScript")).isEqualTo("typescript");
    }
}
