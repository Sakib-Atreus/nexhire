package com.nexhire.api.modules.calendar;

import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.hiring.HiringService;
import com.nexhire.api.modules.hiring.InterviewResponse;
import com.nexhire.api.modules.hiring.InterviewStatus;
import com.nexhire.api.modules.hiring.InterviewType;
import com.nexhire.api.modules.hiring.dto.InterviewDTO;
import com.nexhire.api.modules.mail.MailService;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;

/** Personal iCalendar feed: subscribe once in Google/Apple/Outlook Calendar to see NexHire interviews. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalendarFeedService {

    private static final DateTimeFormatter ICS_TIME = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final HiringService hiringService;
    private final MailService mailService;

    /** The user's feed token, created on first use. */
    @Transactional
    public String token(User principal) {
        User user = load(principal);
        if (user.getCalendarToken() == null) {
            user.setCalendarToken(newToken());
            userRepository.save(user);
        }
        return user.getCalendarToken();
    }

    /** Invalidate the old link (e.g. if it was shared by mistake) and return a new token. */
    @Transactional
    public String reset(User principal) {
        User user = load(principal);
        user.setCalendarToken(newToken());
        userRepository.save(user);
        return user.getCalendarToken();
    }

    /** ICS document for the feed owner: interviews from 30 days ago to 180 days ahead. */
    public String feed(String token) {
        User user = userRepository.findByCalendarTokenAndEnabledTrue(token)
            .orElseThrow(() -> new ResourceNotFoundException("Calendar feed", "token", "…"));
        Instant now = Instant.now();
        List<InterviewDTO> interviews = hiringService.calendar(user, now.minus(30, ChronoUnit.DAYS), now.plus(70, ChronoUnit.DAYS));
        // calendar() caps ranges at 100 days, so fetch the far window separately.
        List<InterviewDTO> later = hiringService.calendar(user, now.plus(70, ChronoUnit.DAYS), now.plus(170, ChronoUnit.DAYS));

        StringBuilder ics = new StringBuilder();
        line(ics, "BEGIN:VCALENDAR");
        line(ics, "VERSION:2.0");
        line(ics, "PRODID:-//NexHire//Interviews//EN");
        line(ics, "CALSCALE:GREGORIAN");
        line(ics, "METHOD:PUBLISH");
        line(ics, "X-WR-CALNAME:" + escape("NexHire interviews"));
        line(ics, "REFRESH-INTERVAL;VALUE=DURATION:PT1H");
        line(ics, "X-PUBLISHED-TTL:PT1H");
        for (InterviewDTO i : interviews) event(ics, i, user, now);
        for (InterviewDTO i : later) event(ics, i, user, now);
        line(ics, "END:VCALENDAR");
        return ics.toString();
    }

    private void event(StringBuilder ics, InterviewDTO i, User owner, Instant now) {
        boolean candidate = owner.getRole() == Role.CANDIDATE;
        String summary = candidate
            ? "Interview: " + i.jobTitle() + " at " + i.companyName()
            : "Interview: " + i.candidateName() + " · " + i.jobTitle();
        String where = i.hasVideoRoom() ? "NexHire video call" : i.location();
        String link = mailService.link(candidate ? "/applications?application=" + i.applicationId() : "/jobs/" + i.jobId() + "/applicants");
        StringBuilder description = new StringBuilder(typeLabel(i.type())).append(" interview · ").append(i.durationMinutes()).append(" min");
        if (i.location() != null && !i.hasVideoRoom()) description.append("\n").append(i.location());
        if (i.hasVideoRoom()) description.append("\nJoin from NexHire: ").append(mailService.link("/interviews/" + i.id() + "/call"));
        if (i.message() != null) description.append("\n\n").append(i.message());
        description.append("\n\nOpen in NexHire: ").append(link);

        String status = i.status() == InterviewStatus.CANCELLED ? "CANCELLED"
            : i.response() == InterviewResponse.ACCEPTED ? "CONFIRMED" : "TENTATIVE";

        line(ics, "BEGIN:VEVENT");
        line(ics, "UID:" + i.id() + "@nexhire");
        line(ics, "DTSTAMP:" + ICS_TIME.format(now));
        line(ics, "DTSTART:" + ICS_TIME.format(i.scheduledAt()));
        line(ics, "DTEND:" + ICS_TIME.format(i.scheduledAt().plus(i.durationMinutes(), ChronoUnit.MINUTES)));
        line(ics, "SUMMARY:" + escape(summary));
        if (where != null) line(ics, "LOCATION:" + escape(where));
        line(ics, "DESCRIPTION:" + escape(description.toString()));
        line(ics, "URL:" + link);
        line(ics, "STATUS:" + status);
        // Sequence bumps when the interview changes so calendar apps replace the old copy.
        line(ics, "SEQUENCE:" + (i.invitedAt() != null ? i.invitedAt().getEpochSecond() / 60 % 100000 : 0));
        line(ics, "END:VEVENT");
    }

    /** RFC 5545: lines end with CRLF and are folded at 75 octets. */
    private static void line(StringBuilder sb, String content) {
        byte[] bytes = content.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (bytes.length <= 75) {
            sb.append(content).append("\r\n");
            return;
        }
        int count = 0;
        StringBuilder current = new StringBuilder();
        boolean first = true;
        for (int offset = 0; offset < content.length(); ) {
            int cp = content.codePointAt(offset);
            String ch = new String(Character.toChars(cp));
            int size = ch.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
            int limit = first ? 75 : 74;   // continuation lines start with a space
            if (count + size > limit) {
                sb.append(first ? "" : " ").append(current).append("\r\n");
                current.setLength(0);
                count = 0;
                first = false;
            }
            current.append(ch);
            count += size;
            offset += Character.charCount(cp);
        }
        sb.append(first ? "" : " ").append(current).append("\r\n");
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\r\n", "\\n").replace("\n", "\\n");
    }

    private static String typeLabel(InterviewType type) {
        return switch (type) {
            case VIDEO -> "Video";
            case PHONE -> "Phone";
            case ONSITE -> "On-site";
        };
    }

    private User load(User principal) {
        return userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    private static String newToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
