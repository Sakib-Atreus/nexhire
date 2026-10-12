package com.nexhire.api.video;

import com.nexhire.api.modules.video.VideoService;
import com.nexhire.api.modules.video.VideoUnavailableException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VideoServiceTest {

    private static final String SECRET = "a-livekit-api-secret-that-is-long-enough-for-hmac-signing";
    private final VideoService video = new VideoService("wss://test.livekit.cloud", "APIkey123", SECRET);

    @Test
    void joinToken_isHs256WithLiveKitGrants() {
        Instant expires = Instant.now().plus(1, ChronoUnit.HOURS).truncatedTo(ChronoUnit.SECONDS);
        String token = video.createToken("nexhire-abc", "user-1", "Rex (Acme)", true, expires);

        Jws<Claims> jws = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).build()
            .parseSignedClaims(token);
        assertThat(jws.getHeader().getAlgorithm()).isEqualTo("HS256");
        Claims c = jws.getPayload();
        assertThat(c.getIssuer()).isEqualTo("APIkey123");
        assertThat(c.getSubject()).isEqualTo("user-1");
        assertThat(c.get("name", String.class)).isEqualTo("Rex (Acme)");
        assertThat(c.getExpiration().toInstant()).isEqualTo(expires);
        @SuppressWarnings("unchecked")
        Map<String, Object> grants = c.get("video", Map.class);
        assertThat(grants).containsEntry("room", "nexhire-abc").containsEntry("roomJoin", true).containsEntry("roomAdmin", true);
    }

    @Test
    void candidateToken_hasNoAdminRights() {
        String token = video.createToken("nexhire-abc", "user-2", "Cara", false, Instant.now().plus(1, ChronoUnit.HOURS));
        Claims c = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).build()
            .parseSignedClaims(token).getPayload();
        assertThat(c.get("video", Map.class)).doesNotContainKey("roomAdmin");
    }

    @Test
    void disabledWithoutCredentials() {
        VideoService off = new VideoService("", "", "");
        assertThat(off.isEnabled()).isFalse();
        assertThatThrownBy(() -> off.createToken("r", "u", "n", false, Instant.now())).isInstanceOf(VideoUnavailableException.class);
    }
}
