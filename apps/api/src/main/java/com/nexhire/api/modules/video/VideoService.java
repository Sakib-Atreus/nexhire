package com.nexhire.api.modules.video;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Built-in interview video rooms on LiveKit (LiveKit Cloud's free plan, or a self-hosted LiveKit server).
 * Enabled when LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set; otherwise interviews keep
 * using pasted meeting links.
 *
 * LiveKit creates a room automatically when the first participant joins, so "creating" a room only
 * reserves its name. Access is controlled by NexHire: a join token is issued only to the candidate or
 * the hiring team, and only while the interview's join window is open (see HiringService#joinVideo).
 */
@Slf4j
@Service
public class VideoService {

    public static final String PROVIDER = "LIVEKIT";

    private final String serverUrl;
    private final String apiKey;
    private final String apiSecret;
    private final RestClient client;

    public VideoService(@Value("${video.livekit.url:}") String serverUrl,
                        @Value("${video.livekit.api-key:}") String apiKey,
                        @Value("${video.livekit.api-secret:}") String apiSecret) {
        this.serverUrl = serverUrl == null ? "" : serverUrl.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.apiSecret = apiSecret == null ? "" : apiSecret.trim();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        // Server API (Twirp) lives on the same host over http(s): wss://x.livekit.cloud -> https://x.livekit.cloud
        this.client = RestClient.builder()
            .baseUrl(this.serverUrl.replaceFirst("^ws", "http"))
            .requestFactory(factory)
            .build();
    }

    /** WebSocket URL the browser connects to, e.g. wss://your-project.livekit.cloud */
    public String serverUrl() {
        return serverUrl;
    }

    public boolean isEnabled() {
        return !serverUrl.isEmpty() && !apiKey.isEmpty() && !apiSecret.isEmpty();
    }

    /** Reserve a room for an interview. LiveKit creates it on the first join; no network call needed. */
    public VideoRoom createRoom(String name, Instant notBefore, Instant expires) {
        if (!isEnabled()) throw new VideoUnavailableException("Video calls aren't set up on this site");
        return new VideoRoom(name, serverUrl);
    }

    /** Join windows are enforced when tokens are issued, so a reschedule needs nothing on LiveKit's side. */
    public void updateWindow(String name, Instant notBefore, Instant expires) {
        // Nothing to sync.
    }

    /** Best-effort: close the room if it's live (e.g. the interview was cancelled), disconnecting everyone. */
    public void deleteRoom(String name) {
        if (!isEnabled()) return;
        try {
            client.post().uri("/twirp/livekit.RoomService/DeleteRoom")
                .header("Authorization", "Bearer " + serverToken(name))
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("room", name))
                .retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            // A room that was never joined doesn't exist on LiveKit yet; that's fine.
            log.debug("LiveKit room {} not deleted: {}", name, e.getMessage());
        }
    }

    /**
     * Join token for one participant, valid until {@code expires}. Owners (the hiring team) get room-admin
     * rights so they can mute or remove participants.
     */
    public String createToken(String roomName, String identity, String userName, boolean owner, Instant expires) {
        if (!isEnabled()) throw new VideoUnavailableException("Video calls aren't set up on this site");
        Map<String, Object> video = new LinkedHashMap<>();
        video.put("room", roomName);
        video.put("roomJoin", true);
        video.put("canPublish", true);
        video.put("canSubscribe", true);
        video.put("canPublishData", true);
        if (owner) video.put("roomAdmin", true);
        Instant now = Instant.now();
        return Jwts.builder()
            .issuer(apiKey)
            .subject(identity)
            .claim("name", userName)
            .claim("video", video)
            .notBefore(Date.from(now.minus(1, ChronoUnit.MINUTES))) // tolerate small clock differences
            .issuedAt(Date.from(now))
            .expiration(Date.from(expires))
            .signWith(signingKey(), Jwts.SIG.HS256) // LiveKit verifies HS256; jjwt would otherwise pick HS384/512 for long secrets
            .compact();
    }

    /** Short-lived token for server API calls on one room. */
    private String serverToken(String roomName) {
        Instant now = Instant.now();
        return Jwts.builder()
            .issuer(apiKey)
            .subject("nexhire-server")
            .claim("video", Map.of("room", roomName, "roomAdmin", true, "roomCreate", true))
            .notBefore(Date.from(now.minus(1, ChronoUnit.MINUTES)))
            .expiration(Date.from(now.plus(5, ChronoUnit.MINUTES)))
            .signWith(signingKey(), Jwts.SIG.HS256) // LiveKit verifies HS256; jjwt would otherwise pick HS384/512 for long secrets
            .compact();
    }

    private SecretKey signingKey() {
        // LiveKit secrets are long random strings; HS256 needs at least 32 bytes.
        byte[] bytes = apiSecret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new VideoUnavailableException("The video service is misconfigured (API secret too short)");
        return Keys.hmacShaKeyFor(bytes);
    }
}
