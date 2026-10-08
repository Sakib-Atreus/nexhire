package com.nexhire.api.modules.companies;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.admin.AuditAction;
import com.nexhire.api.modules.admin.AuditService;
import com.nexhire.api.modules.companies.dto.*;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.jobs.JobService;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobService jobService;
    private final AuditService auditService;

    // ─── Public ─────────────────────────────────────────────────────────────

    public Page<CompanyDTO> search(String q, Boolean verified, Pageable pageable) {
        String query = q == null || q.isBlank() ? null : q.trim();
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
            Sort.by(Sort.Order.desc("verified"), Sort.Order.asc("name")));
        return companyRepository.search(query, verified, sorted).map(this::toDTO);
    }

    public CompanyProfileDTO profile(String slug) {
        Company company = companyRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "slug", slug));
        var jobs = jobRepository
            .findTop50ByCompanyIdAndStatusAndHiddenFalseOrderByFeaturedDescCreatedAtDesc(company.getId(), JobStatus.OPEN)
            .stream().map(j -> jobService.toDTO(j, null)).toList();
        return new CompanyProfileDTO(toDTO(company), jobs);
    }

    // ─── Recruiter: my company ──────────────────────────────────────────────

    public Optional<MyCompanyDTO> mine(User user) {
        UUID companyId = currentCompanyId(user);
        if (companyId == null) return Optional.empty();
        return companyRepository.findById(companyId).map(c -> myCompany(c, user));
    }

    @Transactional
    public MyCompanyDTO create(CompanyRequest request, User user) {
        User fresh = load(user);
        if (fresh.getRole() != Role.RECRUITER) throw new ForbiddenException("Only recruiters can create a company");
        if (fresh.getCompanyId() != null) throw new BadRequestException("You already belong to a company");
        String name = request.name().trim();
        if (companyRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("A company called \"" + name + "\" already exists. Ask its owner to add you to the team.");
        }
        Company company = Company.builder().slug(uniqueSlug(name)).ownerId(fresh.getId()).build();
        apply(company, request);
        company = companyRepository.save(company);
        fresh.setCompanyId(company.getId());
        userRepository.save(fresh);
        return myCompany(company, fresh);
    }

    @Transactional
    public MyCompanyDTO update(CompanyRequest request, User user) {
        Company company = requireMyCompany(user);
        String name = request.name().trim();
        if (!name.equalsIgnoreCase(company.getName()) && companyRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Another company is already called \"" + name + "\"");
        }
        apply(company, request);
        companyRepository.save(company);
        jobRepository.syncCompanyDetails(company.getId(), company.getName(), company.getLogoUrl());
        return myCompany(company, user);
    }

    @Transactional
    public MyCompanyDTO addMember(String email, User user) {
        Company company = requireOwner(user);
        User member = userRepository.findByEmail(email.trim())
            .orElseThrow(() -> new BadRequestException("No account uses " + email.trim() + ". Ask them to sign up as a recruiter first."));
        if (member.getRole() != Role.RECRUITER) throw new BadRequestException("Only recruiter accounts can join a company");
        if (company.getId().equals(member.getCompanyId())) throw new BadRequestException(member.getFullName() + " is already on your team");
        if (member.getCompanyId() != null) throw new BadRequestException(member.getFullName() + " already belongs to another company");
        member.setCompanyId(company.getId());
        userRepository.save(member);
        return myCompany(company, user);
    }

    @Transactional
    public MyCompanyDTO removeMember(UUID memberId, User user) {
        Company company = requireOwner(user);
        if (memberId.equals(user.getId())) throw new BadRequestException("Transfer ownership before leaving the company");
        User member = userRepository.findById(memberId)
            .filter(u -> company.getId().equals(u.getCompanyId()))
            .orElseThrow(() -> new ResourceNotFoundException("Team member", "id", memberId));
        member.setCompanyId(null);
        userRepository.save(member);
        return myCompany(company, user);
    }

    @Transactional
    public MyCompanyDTO transferOwnership(UUID memberId, User user) {
        Company company = requireOwner(user);
        User member = userRepository.findById(memberId)
            .filter(u -> company.getId().equals(u.getCompanyId()))
            .orElseThrow(() -> new ResourceNotFoundException("Team member", "id", memberId));
        company.setOwnerId(member.getId());
        companyRepository.save(company);
        return myCompany(company, user);
    }

    @Transactional
    public void leave(User user) {
        Company company = requireMyCompany(user);
        if (user.getId().equals(company.getOwnerId())) {
            throw new BadRequestException("You manage this company. Transfer ownership to a teammate before leaving.");
        }
        User fresh = load(user);
        fresh.setCompanyId(null);
        userRepository.save(fresh);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    @Transactional
    public CompanyDTO setVerified(UUID id, boolean verified, User admin) {
        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));
        if (company.isVerified() != verified) {
            company.setVerified(verified);
            companyRepository.save(company);
            auditService.record(admin, verified ? AuditAction.COMPANY_VERIFIED : AuditAction.COMPANY_UNVERIFIED,
                AuditService.TARGET_COMPANY, company.getId(), company.getName(), null);
        }
        return toDTO(company);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    public CompanyDTO toDTO(Company c) {
        return new CompanyDTO(c.getId(), c.getSlug(), c.getName(), c.getLogoUrl(), c.getWebsite(), c.getSize(),
            c.getIndustry(), c.getHeadquarters(), c.getDescription(), c.isVerified(),
            jobRepository.countByCompanyIdAndStatusAndHiddenFalse(c.getId(), JobStatus.OPEN),
            userRepository.countByCompanyId(c.getId()), c.getCreatedAt());
    }

    private MyCompanyDTO myCompany(Company company, User user) {
        List<CompanyMemberDTO> members = userRepository.findByCompanyIdOrderByCreatedAtAsc(company.getId()).stream()
            .map(u -> new CompanyMemberDTO(u.getId(), u.getFullName(), u.getEmail(), u.getAvatarUrl(), u.getHeadline(),
                u.getId().equals(company.getOwnerId()), u.getCreatedAt()))
            .toList();
        return new MyCompanyDTO(toDTO(company), members, user.getId().equals(company.getOwnerId()));
    }

    /** Reads the company id from the database: the principal may be stale after joining/leaving. */
    private UUID currentCompanyId(User user) {
        return userRepository.findById(user.getId()).map(User::getCompanyId).orElse(null);
    }

    private Company requireMyCompany(User user) {
        UUID companyId = currentCompanyId(user);
        if (companyId == null) throw new BadRequestException("You don't belong to a company yet");
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Company", "id", companyId));
    }

    private Company requireOwner(User user) {
        Company company = requireMyCompany(user);
        if (!user.getId().equals(company.getOwnerId())) {
            throw new ForbiddenException("Only the company owner can manage the team");
        }
        return company;
    }

    private User load(User user) {
        return userRepository.findById(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", user.getId()));
    }

    private void apply(Company c, CompanyRequest r) {
        c.setName(r.name().trim());
        c.setLogoUrl(url(r.logoUrl(), "Logo URL"));
        c.setWebsite(url(r.website(), "Website"));
        String size = blank(r.size());
        if (size != null && !CompanySizes.ALL.contains(size)) throw new BadRequestException("Choose a company size from the list");
        c.setSize(size);
        c.setIndustry(blank(r.industry()));
        c.setHeadquarters(blank(r.headquarters()));
        c.setDescription(blank(r.description()));
    }

    private static String url(String value, String label) {
        String v = blank(value);
        if (v != null && !v.matches("(?i)^https?://\\S+$")) {
            throw new BadRequestException(label + " must be a full URL starting with https://");
        }
        return v;
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private String uniqueSlug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
        if (base.isEmpty()) base = "company";
        if (base.length() > 70) base = base.substring(0, 70);
        String slug = base;
        for (int i = 2; companyRepository.existsBySlug(slug); i++) slug = base + "-" + i;
        return slug;
    }
}
