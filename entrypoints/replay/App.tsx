import { useEffect, useRef, useState } from "react";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { Filter, Download, RefreshCw, ChevronsUpDown } from "lucide-react";
import { getRecording } from "@/lib/db";
import { exportRecording } from "@/lib/utils";
import { getReplayConsolePlugin } from "@rrweb/rrweb-plugin-console-replay";
import { type LogData } from "@rrweb/rrweb-plugin-console-record";

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
  const [logs, setLogs] = useState<LogData[]>([]);
  const [network, setNetwork] = useState<ReplayData["network"]>([]);

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
          setLogs([]);
          const replayer = new rrwebPlayer({
            target: container,
            props: {
              events: data.events,
              plugins: [
                getReplayConsolePlugin({
                  replayLogger: {
                    log: (logData) => setLogs((prev) => [...prev, logData]),
                    error: (logData) => setLogs((prev) => [...prev, logData]),
                    warn: (logData) => setLogs((prev) => [...prev, logData]),
                    info: (logData) => setLogs((prev) => [...prev, logData]),
                    debug: (logData) => setLogs((prev) => [...prev, logData]),
                  },
                }),
              ],
              maxScale: 0,
            },
          });
          replayer.play();

          replayer.addEventListener("custom-event", (events) => {
            console.log("custom-event", events);
            if (events.data.tag === "network-log") {
              setNetwork((prev) => [...(prev ?? []), events.data.payload]);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading recording:", error);
    }
  };

  function getRequestContent(responseBody: any): string | React.ReactNode {
    if (!responseBody) {
      return "No content";
    }
    try {
      const json = JSON.parse(responseBody);
      return <pre>{JSON.stringify(json, null, 2)}</pre>;
    } catch {
      return responseBody;
    }
  }

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
          <Tabs defaultValue="console" className="flex flex-col h-full">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="console" className="flex-1">
                <Filter className="w-4 h-4 mr-2" /> Console
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" /> Network
              </TabsTrigger>
            </TabsList>
            <TabsContent value="console" className="flex-1 overflow-auto p-2">
              <ScrollArea className="h-full">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground text-sm py-4 text-center">
                    No console logs
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <Collapsible key={idx} className="mb-2">
                      <div className="flex items-center justify-between gap-4 px-4">
                        <div>
                          <Badge variant="outline" className="mr-2 lowercase">
                            {log.level}
                          </Badge>
                          <span className="break-all">
                            {log.payload?.join?.(" ") ?? String(log.payload)}
                          </span>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <ChevronsUpDown />
                            <span className="sr-only">Toggle</span>
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>{log.trace}</CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="network" className="flex-1 overflow-auto p-2">
              <ScrollArea className="h-full">
                {network?.map((req, idx) => (
                  <Card
                    key={idx}
                    className="mb-2 hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant={
                            req.method === "GET"
                              ? "outline"
                              : req.method === "POST"
                              ? "secondary"
                              : "default"
                          }
                          className="uppercase"
                        >
                          {req.method}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {req.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono ${
                            req.status >= 400
                              ? "text-destructive"
                              : "text-green-600"
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {req.time}ms
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title="View details"
                            >
                              <ChevronsUpDown className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="flex flex-col gap-4">
                            <DialogHeader>
                              <DialogTitle className="truncate">
                                {req.url}
                              </DialogTitle>
                              <DialogDescription>
                                <span className="font-mono text-xs">
                                  {req.method} &mdash; {req.status} &mdash;{" "}
                                  {req.time}ms
                                </span>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col">
                              <div>
                                <h3 className="font-medium mb-2 text-sm">
                                  Request Body
                                </h3>
                                <div className="max-h-48 overflow-auto bg-gray-100 p-2 rounded text-xs border">
                                  {getRequestContent(req.requestBody)}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-medium mb-2 text-sm">
                                  Response Body
                                </h3>
                                <div className="max-h-48 overflow-auto bg-gray-100 p-2 rounded text-xs border">
                                  {getRequestContent(req.responseBody)}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
