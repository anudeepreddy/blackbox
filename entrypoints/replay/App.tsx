import { useEffect, useRef, useState } from "react";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui";
import { Filter, Download, RefreshCw, ChevronsUpDown } from "lucide-react";
import { getRecording } from "@/lib/db";
import { exportRecording } from "@/lib/utils";

function getRecordingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}
type RRWebEvent = any;
interface ReplayData {
  events: RRWebEvent[];
  logs?: string[];
  network?: {
    url: string;
    method: string;
    status: number;
    time: number;
    requestBody: any;
    responseBody?: any;
  }[];
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const devtoolsRef = useRef<HTMLIFrameElement>(null);
  const [responseData, setResponseData] = useState({});

  const sendToDevtools = (message) => {
    devtoolsRef.current?.contentWindow?.postMessage(
      JSON.stringify(message),
      "*"
    );
  };

  useEffect(() => {
    function handleMessage(event) {
      const cdpMessage = JSON.parse(event.data);
      if (cdpMessage.method === "Runtime.enable") {
        sendToDevtools({
          method: "Runtime.executionContextCreated",
          params: {
            context: {
              id: 1,
              name: "top",
              origin: location.origin,
            },
          },
        });
      } else if (cdpMessage.method === "Page.getResourceTree") {
        sendToDevtools({
          id: cdpMessage.id,
          result: {
            frameTree: {
              frame: {
                id: "1",
                mimeType: "text/html",
                securityOrigin: location.origin,
                url: location.origin,
              },
              resources: [],
            },
          },
        });
      } else if(cdpMessage.method === 'Network.getResponseBody') {
        sendToDevtools({
          id: cdpMessage.id,
          result: responseData[cdpMessage.params.requestId]
        })
      } else {
        sendToDevtools({
          id: cdpMessage.id,
          result: {},
        });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [responseData]);

  useEffect(() => {
    handlePlay();
  }, []);

  const handlePlay = async () => {
    const recordingId = getRecordingIdFromUrl();
    if (!recordingId) {
      return;
    }

    try {
      const data = await getRecording(recordingId);
      if (data) {
        const container = containerRef.current;
        if (container && Array.isArray(data.events) && data.events.length > 0) {
          container.innerHTML = "";
          const replayer = new rrwebPlayer({
            target: container,
            props: {
              events: data.events,
              maxScale: 0,
            },
          });
          setResponseData(data.responseDataMap);
          replayer.play();

          replayer.addEventListener("custom-event", (events) => {
            console.log("custom-event", events);
            if (events.data.tag === "cdp") {
              devtoolsRef.current?.contentWindow?.postMessage(
                events.data.payload,
                "*"
              );
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading recording:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex flex-row items-center gap-3">
          <img src="/icon/blackbox.png" className="h-8" alt="Blackbox icon" />
          <h1 className="text-lg font-semibold">Blackbox</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => exportRecording(getRecordingIdFromUrl() as string)}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </header>
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={70} minSize={40}>
          <div
            ref={containerRef}
            className="flex-1 min-h-0 bg-muted"
            style={{ height: "100%", display: "grid", placeItems: "center" }}
          ></div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={30}
          minSize={20}
          className="flex flex-col border-l bg-muted"
        >
          <DevToolsPanel
            onReady={() => { }}
            ref={devtoolsRef}
          ></DevToolsPanel>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
