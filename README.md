# Blackbox

**Blackbox** is a web extension that records user interactions, console logs, and network requests on websites. It provides a seamless way to capture, review, and share browser sessions for debugging, QA, or user experience analysis.

<p align="center">
    <a href="https://www.loom.com/share/584ea05284b246cda642cf77d4953579">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/584ea05284b246cda642cf77d4953579-e5f5346ba93bd031-full-play.gif">
    </a>
  </p>
  
  ## Features

- **User Interaction Recording:** Captures clicks, typing, and other user events.
- **Console Logs & Network Requests:** Records JavaScript console output and network activity during sessions, giving complete insight into runtime behavior.
- **Save & Export Recordings:** Save sessions locally and export them as JSON for archiving or sharing.
- **Replay Functionality:** Import exported JSONs and play them back on the Replay page—complete with page interactions, network requests, and logs.

## Getting Started

### Installation

#### Prebuilt

1. Get the latest release from: https://github.com/anudeepreddy/blackbox/releases
2. Unzip the downloaded file
3. Open Chrome and go to chrome://extensions/
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" button
6. Select the folder where you extracted the extension
7. The extension will load and appear in your list

#### From Source

1. **Clone the Repo:**
   ```bash
   git clone https://github.com/anudeepreddy/blackbox.git
   cd blackbox
   ```

2. **Build & Load Extension:**
   ```bash
   npm run build
   ```
3. Open Chrome and go to chrome://extensions/
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" button
6. Select the folder `.output/chrome-mv3`
7. The extension will load and appear in your list

### Usage

1. **Start Recording:**  
   Click the Blackbox extension icon and start recording your session.

2. **Interact with the Page:**  
   All your actions, console logs, and network requests are tracked.
3. **Stop Recording:**  
   Click on Blackbox extension icon and Stop recording.
4. **Replay:**  
   Replay page should automatically open once the recording is stopped. View a playback of the session, including user actions, logs, and network requests.

## Contributing

Pull requests and issues are welcome!  
- Bug reports, feature suggestions, and improvements are appreciated.
- Please follow the existing code style and add tests when appropriate.

## License

MIT

## Maintainer

- [anudeepreddy](https://github.com/anudeepreddy)

---
