export const Events = {
    startRecording: "blackbox.startRecording",
    stopRecording: "blackbox.stopRecording",
    getRecordingStatus:  "blackbox.getRecordingStatus",
}

export const ContentToInjectEvents = {
    startCdp: 'blackbox.startCDP',
    stopCdp: 'blackbox.stopCDP'
}

export const InjectToContentEvents = {
    onCdp: 'blackbox.onCdp'
}