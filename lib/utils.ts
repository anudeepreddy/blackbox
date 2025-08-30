import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getRecording, getRecordingsListEntry } from "@/lib/db";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const exportRecording = async (recordingId: string) => {
    try {
      const recordingData = await getRecording(recordingId);
      const recordingEntry = await getRecordingsListEntry(recordingId);
      if (!recordingData || !recordingEntry) {
        alert("Recording not found");
        return;
      }

      
      const dataStr = JSON.stringify(recordingData.events, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recording_${recordingEntry.title || "untitled"}_${
        new Date(recordingEntry.timestamp).toISOString().split("T")[0]
      }.json`;

      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting recording:", error);
      alert("Error exporting recording: " + (error as Error).message);
    }
  };