# Hari & Prasanna — Wedding Invitation

A self-contained, mobile-first wedding invitation website for the wedding of
**Hari Krishna** & **Gnana Prasanna Lakshmi**.

**[invitation.html](./invitation.html)** is the finished page — a single
file with the couple's video, poster image, and all QR codes inlined as data
URIs / inline SVG. Just open it in a browser, or host it anywhere that serves
static files (no build step, no server, no dependencies at runtime).

## Features

- Animated "open the envelope" gate before the site reveals — tap or drag the
  card to open, with a skip link for accessibility
- English / Telugu language toggle (persisted per visitor)
- Live countdown to the Muhurtham and Reception, which automatically switches
  to a "Happening Now" badge during each event and a thank-you message once
  both are over, with a one-time celebration animation at the exact moment
- Embedded couple video, an "Our Moments" section
- "Add to Calendar" links, an inline map + "View on Map" button and a
  scannable QR code for each venue
- "Watch Live" section — ready for a YouTube link to be dropped in
- RSVP form, "Share this invite" (native share sheet / clipboard fallback),
  and a QR code linking back to the page itself
- Every QR code embedded in the page was generated from the actual target
  URL and decode-verified (not hand-drawn), so they're guaranteed to scan

## Project structure

```
invitation.html          the finished, self-contained page — open this
src/
  invitation_src.html     the editable source (has PLACEHOLDER tokens for the
                           assets below, filled in by build.js)
  build.js                inlines the assets into invitation_src.html to
                           produce invitation.html
  gen_qr_share.js          regenerates assets/qr-share.svg
  gen_qr_venues.js         regenerates the two venue QR codes
assets/
  couple.mp4               couple video (H.264, compressed for fast mobile load)
  poster.jpg                video poster frame
  qr-share.svg               QR linking to the published page
  qr-venue-muhurtham.svg     QR linking to the Muhurtham venue on Google Maps
  qr-venue-reception.svg     QR linking to the Reception venue on Google Maps
```

## Editing the content

1. Edit `src/invitation_src.html` (all the copy, styling, and behaviour live
   here — dates, venues, translations, etc.).
2. If you're changing the video/poster, replace the files in `assets/` (keep
   the same filenames, or update the paths in `src/build.js`).
3. Rebuild:

   ```bash
   npm install
   npm run build
   ```

   This regenerates `invitation.html` from the source + assets.

## Regenerating a QR code

If a target URL changes (e.g. a new live-stream link, a corrected map link),
edit the URL in `src/gen_qr_share.js` or `src/gen_qr_venues.js` and run:

```bash
npm run gen:qr:share
npm run gen:qr:venues
```

Each script rasterizes the QR it just generated and decodes it with `jsqr` to
confirm it actually points where it should before writing the file.

## Adding the live-stream link

Open `invitation.html` (or `src/invitation_src.html` + rebuild) and search for:

```js
const LIVE_STREAM_URL = "";
```

Paste the YouTube link in the quotes. The embedded player and "Watch on
YouTube" button appear automatically — nothing else needs to change.

## Adding background music

Same pattern — search for:

```js
const BACKGROUND_MUSIC_URL = "";
```

Paste a link or data URI to an instrumental track you have the rights to use,
and a mute/unmute toggle appears in the nav automatically.
