# AimTrain

AimTrain is a browser-based aim trainer built with HTML, CSS, and JavaScript. It runs in the browser without an account, backend, or third-party game library.

## Features

- Two practice modes: **Classic** and **Precision**
- Three difficulty levels: Easy, Medium, and Hard
- 60-second rounds with live score, misses, accuracy, and hits-per-second stats
- A saved best score and saved settings using browser storage
- Preset color themes: Tactical, Arctic, and Ember
- Interface size, target-size variation, blur, and sound settings
- A three-second restart countdown with an option to exit to the pre-game screen
- Responsive layout, keyboard-operable buttons, and reduced-motion support

## Practice modes

### Classic

Click targets as they appear. Target size and respawn speed depend on the selected difficulty. Target size can be set to vary between 75% and 100% of its normal size, or remain fixed.

### Precision

Precision targets are fixed at 75% of their normal difficulty size. Each target expires if it is not hit in time, and counts as a miss. New targets try to appear at least a set distance from the previous target.

| Difficulty | Target lifetime | Minimum distance from previous target |
| --- | ---: | ---: |
| Easy | 1.1 seconds | 100 pixels |
| Medium | 0.8 seconds | 140 pixels |
| Hard | 0.55 seconds | 180 pixels |

If the play area is too small to meet the minimum distance after several attempts, the game uses the last position it tried.

## How to play

1. Choose a mode and difficulty.
2. Select **Start 60-second session**.
3. Click each target before it disappears.
4. Click an empty part of the practice area to record a miss.
5. When the timer ends, review your results and choose **Play again**.

The accuracy percentage is calculated as:

`hits / (hits + misses) × 100`

Hits per second is calculated from the number of hits and the elapsed round time.

## Settings and saved data

Settings include theme, interface size, target-size variation, background blur, and hit sound. The **Restore default settings** button resets these preferences.

AimTrain saves settings and the best score in the browser’s local storage. This data stays in the current browser on the current device. It is not sent to a server or shared between devices. Clearing browser site data may remove it.

## Run locally

1. Open the AimTrain folder in Visual Studio Code.
2. Open `index.html` with the VS Code **Live Server** extension.
3. Use the browser tab that Live Server opens.

No packages or build step are required.

## Project structure

```text
AimTrain/
├── index.html
├── styles/
│   └── main.css
├── src/
│   ├── game.js
│   └── main.js
├── ARCHITECTURE.md
└── README.md
```

- `index.html` contains the page structure and controls.
- `styles/main.css` contains the layout, themes, target appearance, and responsive styles.
- `src/main.js` connects the page controls to the game and settings.
- `src/game.js` manages the session timer, score, misses, and session state.
- `ARCHITECTURE.md` describes the project design and structure.

## Technology

- HTML
- CSS
- JavaScript modules
- Browser `localStorage`

## Project scope

AimTrain is a small client-side project. It has no accounts, online leaderboard, multiplayer, or cloud-synced data.
```