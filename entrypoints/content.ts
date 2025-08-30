import { browser } from "wxt/browser";
import { record } from "rrweb";
import {
  getRecordConsolePlugin,
  type Logger,
} from "@rrweb/rrweb-plugin-console-record";

async function main(ctx) {
  if (ctx.isInvalid) {
    return;
  }

  await injectScript("/captureConsole.js", {
    keepInDom: true,
  });
  await injectScript("/captureNetwork.js", {
    keepInDom: true,
  });
  listenToConsoleMessages();
  listenToNetworkLogs();

  type RecordHandler = () => void;

  let stopRecording: RecordHandler | null = null;
  let events: any[] = [];

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startRecording") {
      startRecording();
      (sendResponse as any)({ success: true, message: "Recording started" });
    } else if (message.action === "stopRecording") {
      const recordedEvents = stopRecordingAndGetEvents();
      (sendResponse as any)({ success: true, events: recordedEvents });
    } else if (message.action === "getRecordingStatus") {
      (sendResponse as any)({ isRecording: stopRecording !== null });
    }

    return true;
  });

  function startRecording() {
    if (stopRecording) {
      console.log("Recording is already in progress");
      return;
    }

    events = [];
    console.log("Starting recording...");

    const recordHandler = record({
      emit(event) {
        events.push(event);
      },
      recordCanvas: true,
      collectFonts: true,
      sampling: {
        scroll: 150,
        media: 800,
      },
      plugins: [
        getRecordConsolePlugin({
          level: ["info", "log", "warn", "error"],
          lengthThreshold: 10000,
          stringifyOptions: {
            stringLengthLimit: 1000,
            numOfKeysLimit: 100,
            depthOfLimit: 1,
          },
          logger: dummyLogger,
        }),
      ],
    });

    if (recordHandler) {
      stopRecording = recordHandler;
      console.log("Recording started successfully");
    } else {
      console.error("Failed to start recording");
    }
  }

  function stopRecordingAndGetEvents() {
    if (!stopRecording) {
      console.log("No recording in progress");
      return [];
    }

    console.log("Stopping recording...");
    stopRecording();
    stopRecording = null;

    const recordedEvents = [...events];
    events = [];

    console.log(`Recording stopped. Captured ${recordedEvents.length} events`);
    return recordedEvents;
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main,
});

function listenToConsoleMessages() {
  window.addEventListener("message", (event) => {
    if (event.source === window && event.data.source === "captureConsole") {
      //@ts-ignore
      dummyLogger[event.data.type](event.data.message);
    }
  });
}

function listenToNetworkLogs() {
  window.addEventListener("message", (event) => {
    if (event.source === window && event.data.source === "captureNetwork") {
      //@ts-ignore
      const { method, url, status, time, requestBody, responseBody } = event.data.message;
      record.addCustomEvent("network-log", { method, url, status, time, requestBody, responseBody });
    }
  });
}

class DummyLogger implements Logger {
  log(message: string) {

  }
  error(message: string) {

  }
  warn(message: string) {

  }
  info(message: string) {

  }
}

const dummyLogger = new DummyLogger();
