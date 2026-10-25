# AimTrain

AimTrain is a lightweight, browser-based aim trainer. It gives players a quick place to practise clicking targets, track their accuracy, and see whether their aim is improving over time.

This README describes the intended first version of the project. The implementation should follow this document; update it as product decisions change.

## What you can do

- Start a 30-second target practice session.
- Click targets that appear at varied positions inside the play area.
- See your score, hits, misses, and accuracy during and after a session.
- Start another session without reloading the page.
- Review a small history of recent results saved in the browser.
- Use the interface on desktop and mobile-sized screens.

The first version is intentionally focused on one simple practice mode. Accounts, online leaderboards, multiplayer, and advanced analytics are outside the initial scope.

## How a session works

1. Open AimTrain and select **Start training**.
2. For 30 seconds, click each target as it appears.
3. A successful click adds one hit and replaces the target at a new position.
4. Clicking elsewhere in the play area counts as a miss.
5. When time runs out, the results screen shows hits, misses, and accuracy.
6. The result is saved locally in the browser, and you can start again.

Accuracy is calculated as `hits / (hits + misses) * 100`. If there are no shots, accuracy is 0%.

## Technology

The starter implementation is intended to use:

- HTML for page structure
- CSS for layout, responsive styling, and target appearance
- JavaScript modules for session logic and interaction
- `localStorage` for recent session history

This keeps the first version easy to run and understand without a framework, server, account system, or third-party service. If the implementation later adopts a build tool or framework, update the setup steps and architecture to match.

## Run locally

The initial project can be run as a static site. From the project folder, open `index.html` in a modern browser. If browser restrictions prevent module loading from a local file, use any simple static HTTP server from the project folder, then open the local address it prints.

There are no package installation steps in the proposed vanilla JavaScript version. If a `package.json` is added later, document its actual scripts here rather than inventing commands.

## Controls

- **Start training**: begin a new 30-second session.
- **Target click**: record a hit and show the next target.
- **Play-area click outside the target**: record a miss.
- **Play again**: return to a fresh session.

The target should be usable with mouse, touch, and keyboard activation. The interface should show visible focus and avoid relying on color alone to communicate state.

## Results and saved history

Each completed session should include its completion time, duration, hits, misses, and accuracy. AimTrain stores recent results in the browser on the current device. The initial history should be capped at 10 sessions so it stays small and easy to manage.

Saved results are local to the browser and are not synced between devices. Clearing site data removes them.

## Project structure

```text
AimTrain/
├── index.html           # Page shell and accessible app regions
├── styles/
│   └── main.css         # Layout, visual states, and responsive rules
├── src/
│   ├── main.js          # App startup and wiring between UI and session logic
│   ├── game.js          # Session state, timer, hit/miss, and scoring rules
│   ├── ui.js            # Rendering and user-interface event handling
│   └── storage.js       # Safe load/save of recent results in localStorage
├── assets/              # Optional local images, icons, or fonts
├── README.md
└── ARCHITECTURE.md
```

Keep the structure small while the application is small. Add files when a real responsibility emerges, rather than splitting code into empty or one-use modules.

## Design goals

- Start a practice session quickly, with no account or setup flow.
- Keep the play area and current stats easy to read at a glance.
- Make hit, miss, countdown, and completion states clear.
- Keep the app usable with keyboard, mouse, and touch input.
- Treat saved history as optional: the trainer should still work if browser storage is unavailable.

## Future ideas

These are possible later additions, not part of the first version:

- Adjustable session duration and target size
- Additional practice modes
- Personal bests and trend summaries
- Sound and reduced-motion preferences
- Export or reset of local history

## License

No license has been selected yet. Add a `LICENSE` file and update this section before distributing the project.
