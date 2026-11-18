# Music

Drop your background music (`.mp3` files) into this folder, then list them in
`playlist.json` next to this file:

```json
{ "tracks": ["cozy-jazz-1.mp3", "cozy-jazz-2.mp3"] }
```

- File names are relative to this `music/` folder.
- Tracks play in a shuffled loop with a gentle fade between songs.
- Music starts after the first tap (browser autoplay rules) and pauses when the
  tab is hidden. Players can turn it off or change the volume in Settings.
- If the list is empty or a file is missing, the game simply plays no music.
