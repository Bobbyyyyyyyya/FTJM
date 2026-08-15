# Audio Bestanden Map (Ringtones & Berichten Geluiden)

Hier kun je eigen audiobestanden (zoals `.mp3`, `.wav`, `.ogg`, `.m4a`) uploaden en toevoegen aan het project.

## Mappenstructuur:

- `public/audio/ringtones/`
  - **Doel**: Beltonen voor inkomende en uitgaande oproepen.
  - **Bestaande voorbeelden**: `classic.mp3`, `ringtone1.mp3`, `ringtone2.mp3`, `nokia.mp3`, `digital.mp3`, `synthesizer.mp3`, `zen.mp3`, `siren.mp3`.
  - **Gebruik**: Te bereiken in de browser via `/audio/ringtones/<jouw-bestand>.mp3`.

- `public/audio/sounds/`
  - **Doel**: Notificatie- en berichtengeluiden voor chat, berichten en forum.
  - **Bestaande voorbeelden**: `ping.mp3`, `notification.mp3`, `chime.mp3`, `alert.wav`, `pop.mp3`, `success.mp3`, `bling.mp3`.
  - **Gebruik**: Te bereiken in de browser via `/audio/sounds/<jouw-bestand>.mp3`.

- `public/audio/calls/`
  - **Doel**: Systeemaudio voor bellen (`dial.mp3`, `hangup.mp3`, `connect.mp3`).

---

### Hoe toe te voegen aan de app:
1. **Bestanden slepen / uploaden**: Sleep je `.mp3` of `.wav` bestanden rechtstreeks in de gewenste map in de bestandsverkenner links.
2. **Koppelen in de code**: Open `src/constants/index.ts` en voeg je nieuwe bestand toe aan `SOUND_OPTIONS` of `RINGTONE_OPTIONS`:
```ts
export const SOUND_OPTIONS = [
  ...
  { name: 'Mijn Eigen Geluid', url: '/audio/sounds/mijn-geluid.mp3' },
];

export const RINGTONE_OPTIONS = [
  ...
  { name: 'Mijn Eigen Ringtone', url: '/audio/ringtones/mijn-ringtone.mp3' },
];
```
3. **In-app Upload**: Gebruikers kunnen via het **Instellingen (Meldingen & Geluiden)** scherm ook rechtstreeks lokale audiobestanden (tot 4 MB) uploaden zonder code aan te passen!
