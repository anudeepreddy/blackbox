import { use, useEffect, useState } from "react";
import { browser } from 'wxt/browser';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Separator,
  Skeleton,
} from "@/components/ui";
import { saveRecording, saveRecordingListItem, cleanupOldRecordings, RecordingData, RecordingListItem } from "@/lib/db";
import { Events } from "@/lib/events";

function App() {

  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkRecordingStatus();
  },[]);

  const checkRecordingStatus = async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const response = await browser.tabs.sendMessage(tab.id, { action: Events.getRecordingStatus });
        setIsRecording(response?.isRecording || false);
      }
    } catch (error) {
      console.error("Error checking recording status:", error);
    }
  };

  const startRecording = async () => {
    try {
      setIsLoading(true);
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const response = await browser.tabs.sendMessage(tab.id, { action: Events.startRecording });
        if (response?.success) {
          setIsRecording(true);
        }
      }
    } catch (error) {
      console.error("Error starting recording:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsLoading(true);
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const response = await browser.tabs.sendMessage(tab.id, { action: Events.stopRecording });
        if (response?.success && response.events) {
          const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const recordingData: RecordingData = {
            id: recordingId,
            events: response.events,
          };
          
          await saveRecording(recordingData);
          
          await saveRecordingListItem({
            id: recordingId,
            timestamp: Date.now(),
            url: tab.url,
            title: tab.title,
            domain: new URL(tab.url || "about:blank").hostname,
            eventCount: response.events.length
          } satisfies RecordingListItem);
                    
          await browser.tabs.create({
            url: browser.runtime.getURL(`/replay.html?id=${recordingId}`),
          });
          setIsRecording(false);
          window.close();
        }
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openRecordings = async () => {
    try {
      await browser.tabs.create({
        url: browser.runtime.getURL('/recordings.html'),
      });
      window.close();
    } catch (error) {
      console.error("Error opening recordings page:", error);
    }
  };

  return (
    <div className="w-[340px] p-4 bg-background min-h-[340px]">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <img src="/icon/blackbox.png" className="h-10" alt="Blackbox icon" />
          <div>
            <CardTitle className="text-lg">Blackbox</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Capture and replay your page interactions
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="mt-4 flex flex-col items-center gap-4">
          <div className="w-full flex flex-col items-center gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isLoading}
                className="w-full"
                variant="default"
                size="lg"
              >
                {isLoading ? (
                  <Skeleton className="w-20 h-5" />
                ) : (
                  <>
                    <span className="mr-2">🔴</span> Start Recording
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                disabled={isLoading}
                className="w-full"
                variant="destructive"
                size="lg"
              >
                {isLoading ? (
                  <Skeleton className="w-20 h-5" />
                ) : (
                  <>
                    <span className="mr-2">⏹️</span> Stop Recording
                  </>
                )}
              </Button>
            )}
          </div>
          {isRecording && (
            <div className="flex items-center gap-2 text-destructive font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Recording in progress...
            </div>
          )}
          <Separator />
          <Button
            onClick={openRecordings}
            variant="default"
            className="w-full"
          >
            📁 View Recordings
          </Button>
          <Separator />
          <div className="text-xs text-muted-foreground text-center">
            <p>Click <b>Start Recording</b> to capture page interactions.</p>
            <p>Click <b>Stop Recording</b> to view the replay.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
