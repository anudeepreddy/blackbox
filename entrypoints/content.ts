import { browser } from "wxt/browser";
import { record } from "rrweb";
import { ContentToInjectEvents, Events, InjectToContentEvents } from "@/lib/events";

async function main(ctx) {
  if (ctx.isInvalid) {
    return;
  }

  await injectScript("/inject.js", {
    keepInDom: true,
  });

  function sendMessage(event: any) {
    window.postMessage(
      {
        source: event,
      },
      "*"
    );
  }
  window.addEventListener("message", (event) => {
    if (event.source === window && event.data.source === InjectToContentEvents.onCdp) {
      //@ts-ignore
      const message = event.data.message;
      record.addCustomEvent("cdp", message);
    }
  });

  type RecordHandler = () => void;

  let stopRecording: RecordHandler | null = null;
  let events: any[] = [];

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === Events.startRecording) {
      startRecording();
      sendMessage(ContentToInjectEvents.startCdp);
      (sendResponse as any)({ success: true, message: "Recording started" });
    } else if (message.action === Events.stopRecording) {
      const recordedEvents = stopRecordingAndGetEvents();
      sendMessage(ContentToInjectEvents.startCdp);
      (sendResponse as any)({ success: true, events: recordedEvents });
    } else if (message.action === Events.getRecordingStatus) {
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