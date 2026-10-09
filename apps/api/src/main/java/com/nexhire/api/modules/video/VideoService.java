package com.nexhire.api.modules.video;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Built-in interview video rooms on Daily.co (https://docs.daily.co/reference/rest-api).
 * Enabled when DAILY_API_KEY is set; otherwise interviews keep using pasted meeting links.
 * Rooms are private: joining needs a meeting token issued by NexHire to a participant.
 */
@Slf4j
@Service
public class VideoService {

    public static final String PROVIDER = "DAILY";

    private final String apiKey;
    private final RestClient client;

    public VideoService(@Value("${video.daily.api-key:}") String apiKey,
                        @Value("${video.daily.api-url:https://api.daily.co/v1}") String apiUrl) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        this.client = RestClient.builder()
            .baseUrl(apiUrl)
            .requestFactory(factory)
            .defaultHeader("Authorization", "Bearer " + this.apiKey)
            .build();
    }

    public boolean isEnabled() {
        return !apiKey.isEmpty();
    }

    /** Create a private room that can be joined between notBefore and expires. */
    public VideoRoom createRoom(String name, Instant notBefore, Instant expires) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("nbf", notBefore.getEpochSecond());
        properties.put("exp", expires.getEpochSecond());
        properties.put("eject_at_room_exp", true);
        properties.put("enable_prejoin_ui", true);
        properties.put("enable_chat", true);
        properties.put("enable_screenshare", true);
        properties.put("max_participants", 10);
        JsonNode room = call(() -> client.post().uri("/rooms")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("name", name, "privacy", "private", "properties", properties))
            .retrieve().body(JsonNode.class), "create the video room");
        return new VideoRoom(room.path("name").asText(name), room.path("url").asText());
    }

    /** Move the room's join window (after a reschedule). */
    public void updateWindow(String name, Instant notBefore, Instant expires) {
        if (!isEnabled()) return; // video was switched off since the room was made; nothing to keep in sync
        call(() -> client.post().uri("/rooms/{name}", name)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("properties", Map.of("nbf", notBefore.getEpochSecond(), "exp", expires.getEpochSecond())))
            .retrieve().body(JsonNode.class), "update the video room");
    }

    /** Best-effort delete (e.g. the interview was cancelled); expired rooms are cleaned up by Daily anyway. */
    public void deleteRoom(String name) {
        if (!isEnabled()) return;
        try {
            client.delete().uri("/rooms/{name}", name).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not delete video room {}: {}", name, e.getMessage());
        }
    }

    /** Short-lived token for one participant. Owners can manage the call (mute, remove, end). */
    public String createToken(String roomName, String userName, boolean owner, Instant expires) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("room_name", roomName);
        properties.put("user_name", userName);
        properties.put("is_owner", owner);
        properties.put("exp", expires.getEpochSecond());
        JsonNode token = call(() -> client.post().uri("/meeting-tokens")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("properties", properties))
            .retrieve().body(JsonNode.class), "start the video call");
        return token.path("token").asText();
    }

    private JsonNode call(java.util.function.Supplier<JsonNode> request, String action) {
        if (!isEnabled()) throw new VideoUnavailableException("Video calls aren't set up on this site");
        try {
            JsonNode body = request.get();
            if (body == null) throw new VideoUnavailableException("We couldn't " + action + ". Please try again.");
            return body;
        } catch (RestClientException e) {
            log.warn("Daily API error while trying to {}: {}", action, e.getMessage());
            throw new VideoUnavailableException("We couldn't " + action + ". Please try again, or use your own meeting link.");
        }
    }
}
