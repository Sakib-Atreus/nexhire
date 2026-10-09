package com.nexhire.api.modules.video;

import com.nexhire.api.exception.BadRequestException;

/** The video provider isn't configured or didn't respond; surfaced to the user as a 400 with a clear message. */
public class VideoUnavailableException extends BadRequestException {
    public VideoUnavailableException(String message) {
        super(message);
    }
}
