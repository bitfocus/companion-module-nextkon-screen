## NextKon Screen

[NextKon Screen](https://nextkon.de/screen/) shows digital name signs on lecterns, panel tables (e.g. ASUS ProArt strips) and door screens. Any screen with a browser can be a player. This module switches the signs from Companion / Stream Deck and shows on every button what is currently on air.

### Setup

1. In the NextKon Screen management (screen.nextkon.de/verwaltung) open the tab **Links** → **Companion / Stream Deck**.
2. Copy the **control key**, or simply the complete control URL. The module takes the key from the URL.
3. Add a connection **NextKon: Screen** in Companion and paste it into **Control key**.
4. Keep the server address `https://screen.nextkon.de`. Use `http://<IP of the ProPlayer>` only if you run a _ProPlayer Backup_ in the venue network.

The connection turns green as soon as an event is active. It follows changes by itself: new names, screens or a different active event update the drop-downs, variables and presets within about a second.

Renewing the control key in the management disconnects all Companion buttons. Paste the new key into the connection; the buttons keep working.

### Presets

- **General:** event status (title and screens online), and per room or for all rooms _EMPTY_ / _black_ at once.
- **One section per screen:** _EMPTY_ (logo only), _black_, online state and one button for each name that fits the screen. Lectern screens get lectern signs (orange) and ProArt screens get moderation signs (blue). Names assigned to another room are left out.
- A button turns **green** while its screen shows exactly that sign.

### Actions

| Action                                | Description                                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Show sign on screen                   | Name, EMPTY or black on one screen. Custom values: a name as written in NextKon Screen, `EMPTY` or `BLACK`, so variables and expressions work. |
| Swap two screens                      | Exchanges the signs, e.g. after two speakers changed seats.                                                                                    |
| All screens of a room: EMPTY or black | For the end of a session or a break.                                                                                                           |
| Reload names and screens              | Normally not needed.                                                                                                                           |

### Feedbacks

- **Screen shows sign**: true while the screen shows that name, EMPTY or black.
- **Screen offline**: true while no player shows the screen (browser closed, device off, no network).

### Variables

- `event_title`, `screens_online`, `screens_total`
- per screen `screen_<id>_name`, `screen_<id>_shows` (name, `EMPTY` or `BLACK`), `screen_<id>_line2`, `screen_<id>_online`

### Notes

- The server enforces the sign rules: a moderation-only sign is refused on a lectern screen and vice versa. Refusals are written to the connection log.
- If the network drops, every screen keeps showing its last sign.
- Support: [support@nextkon.de](mailto:support@nextkon.de) · Manual: [nextkon.de/screen/anleitung](https://nextkon.de/screen/anleitung/)
