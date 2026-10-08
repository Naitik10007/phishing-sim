# Audio assets

This build ships without generated voice recordings — plain JS running in a
browser can't synthesize or record natural human speech. The game is not
silent while you wait to add real audio: every line is always shown as an
on-screen caption, and short synthesized UI blips (WebAudio, not a voice)
back click/success/warning/ring feedback.

Drop `.mp3` files into the folders below using these exact filenames
(matched to `clipId` in `js/scenario.js`); `js/audio.js` requests
`audio/<role>/<clipId>.mp3` and silently skips anything missing.

```
audio/
  victim/
    confused.mp3

  scammer/
    courier_intro.mp3
    investigation.mp3
    digital_arrest.mp3
    do_not_disconnect.mp3
    isolation_warrant.mp3
    isolation_family.mp3
    isolation_camera.mp3
    isolation_cooperate.mp3
    money_demand.mp3
    money_return.mp3
    money_now.mp3

  narrator/
    reveal_stop.mp3
    reveal_manipulated.mp3
    reveal_scam.mp3
    reveal_no_such_process.mp3
    reveal_no_requirement.mp3

  sfx/      (not auto-loaded yet — wire up calls in js/audio.js if you add these)
    ringtone.mp3
    message.mp3
    call_connect.mp3

  music/    (not auto-loaded yet — same as above)
    calm.mp3
    tension.mp3
    resolution.mp3
```

## Voice direction

- **Victim** — young Indian-English male, natural conversational voice. Arc: relaxed → confused → worried → frightened → hesitant → relieved.
- **Scammer** — adult male, not a cartoon villain. Arc: calm/professional → serious → threatening → manipulative.
- **Narrator** — professional cybersecurity-awareness presenter. Calm, clear, educational.

`js/app.js`'s dialogue stepper starts playback for the current line as soon
as it appears and drives the character's mouth-talk + speaking-bar
animation for an estimated natural-speech duration — it never auto-advances
the scene. The player always clicks Next/Continue.
