# Developer Interview Prep

Offline-first interview reference for SQL, .NET, JavaScript, behavioral questions, and developer terminology.

## Features

- Left-side question navigation
- Search across titles, keywords, summaries, and full answers
- Clickable keyword filters
- Category filters
- Bookmarks
- Device-local notes
- Position-requirements analyzer and local prep deck
- Shared vocabulary profile showing:
  - approximate receptive vocabulary estimate
  - developer terminology score
  - current unfamiliar-term queue
- Developer Vocabulary Lab for general and technical terminology assessment
- Vocabulary profile included in backup/restore exports
- Dark mode
- Adjustable text size
- Mobile layout
- Offline caching through a service worker
- Installable as a PWA when served over HTTPS or localhost

## Vocabulary integration

The app reads the shared browser profile stored under `gs_vocab_profile_v1`. The same profile is used by Vocabulary Expander and FieldKit when those applications run on the same origin/browser.

Open `vocabulary/index.html` to take the developer terminology assessment or collect unfamiliar terms from a job description or technical passage.

## Run locally

From this folder:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Install on iPhone/iPad

The app must first be hosted on HTTPS.

1. Open the hosted URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch from the home-screen icon.
5. After the first successful load, it works offline.

## Install on Android/Desktop Chrome

1. Open the hosted HTTPS URL.
2. Use Install App / Add to Home Screen.
3. After the first load, it works offline.

## Add more questions

Edit `data.js`. Each item has:

- `id`
- `category`
- `subcategory`
- `title`
- `keywords`
- `short`
- `answer`

Change the cache name in `service-worker.js` after a major update so installed copies refresh.
