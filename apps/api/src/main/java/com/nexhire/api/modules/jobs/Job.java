package com.nexhire.api.modules.jobs;

import com.nexhire.api.modules.users.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "company_logo_url")
    private String companyLogoUrl;

    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", length = 20)
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level", length = 20)
    private ExperienceLevel experienceLevel;

    @Column(name = "salary_min", precision = 12, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 12, scale = 2)
    private BigDecimal salaryMax;

    @Builder.Default
    @Column(name = "salary_currency")
    private String salaryCurrency = "USD";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private JobStatus status = JobStatus.DRAFT;

    private String tags;

    private LocalDate deadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_id", nullable = false)
    private User recruiter;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
