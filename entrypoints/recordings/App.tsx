import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  ScrollArea,
} from "@/components/ui";
import {
  getRecordingsList,
  deleteRecording,
  saveRecording,
  saveRecordingListItem,
  type RecordingListItem,
  getRecording,
  RecordingData
} from "@/lib/db";
import {
  Play,
  Trash2,
  Upload,
  Calendar,
  Globe,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import { exportRecording } from "@/lib/utils";

function App() {
  const [recordings, setRecordings] = useState<RecordingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

    const loadRecordings = async () => {
    try {
      setLoading(true);
      const recordingsList = await getRecordingsList();
      setRecordings(recordingsList);
    } catch (error) {
      console.error("Error loading recordings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayRecording = async (recordingId: string) => {
    try {
      window.location.href = browser.runtime.getURL(`/replay.html?id=${recordingId}`);
    } catch (error) {
      console.error("Error opening replay:", error);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (window.confirm("Are you sure you want to delete this recording? This action cannot be undone.")) {
      try {
        await deleteRecording(recordingId);
        setRecordings(prev => prev.filter(r => r.id !== recordingId));
      } catch (error) {
        console.error("Error deleting recording:", error);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const text = await file.text();
      const data = JSON.parse(text);

      let events: any[];
      let networkEvents: any[] = [];
      let originalData: any = {};

      
      if (Array.isArray(data)) {
        
        events = data;
        originalData = { events: data };
      } else if (data.events && Array.isArray(data.events)) {
        
        events = data.events;
        networkEvents = data.networkEvents || [];
        originalData = data;
      } else {
        throw new Error("Invalid recording file: Expected either an events array or an object with an events property");
      }

      if (events.length === 0) {
        throw new Error("Invalid recording file: events array is empty");
      }

      
      const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      
      const recordingData: RecordingData = {
        id: recordingId,
        events: events,
      };

      await saveRecording(recordingData);
            
      await saveRecordingListItem({
        id: recordingId,
        timestamp: originalData.timestamp || Date.now(),
        url: originalData.url || "Uploaded Recording",
        title: originalData.title || file.name.replace('.json', ''),
        domain: originalData.domain || "uploaded",
        eventCount: events.length,
      } satisfies RecordingListItem);

      
      await loadRecordings();

      
      await handlePlayRecording(recordingId);
    } catch (error) {
      console.error("Error uploading recording:", error);
      alert("Error uploading recording: " + (error as Error).message);
    } finally {
      setUploading(false);
      
      event.target.value = "";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDomain = (domain?: string) => {
    if (!domain) return "Unknown";
    return domain.replace(/^www\./, "");
  };

  return (
    <div className="w-full h-full p-4 bg-background">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-row items-center gap-3">
              <img src="/icon/blackbox.png" className="h-10" alt="Blackbox icon" />
            <div>
              <CardTitle className="text-xl">Blackbox</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your saved recordings
              </p>
            </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecordings}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload JSON"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading recordings...</p>
              </div>
            </div>
          ) : recordings.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No recordings found</h3>
                <p className="text-muted-foreground mb-4">
                  Start recording or upload a JSON file to get started
                </p>
                <div className="relative inline-block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Recording
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {recordings.map((recording) => (
                  <Card key={recording.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium truncate">
                              {recording.title || "Untitled Recording"}
                            </h3>
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                              {recording.eventCount || 0} events
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(recording.timestamp)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {formatDomain(recording.domain)}
                            </div>
                          </div>
                          
                          {recording.url && recording.url !== "Uploaded Recording" && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {recording.url}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlayRecording(recording.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportRecording(recording.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRecording(recording.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
