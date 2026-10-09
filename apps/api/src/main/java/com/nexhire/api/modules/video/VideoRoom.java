package com.nexhire.api.modules.video;

/** A provider room: its name (id) and the URL participants join with a token. */
public record VideoRoom(String name, String url) {}
