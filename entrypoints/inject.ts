import { ContentToInjectEvents, Events, InjectToContentEvents } from "@/lib/events";

async function main() {
  let isCdpEnabled = false;
  const chobitsu = (await import("chobitsu")).default;
  let id = 0;
  const sendToChobitsu = (message) => {
    message.id = "tmp" + ++id;
    chobitsu.sendRawMessage(JSON.stringify(message));
  };

  function sendMessage(data: any) {
    if(!isCdpEnabled) return;
    window.postMessage(
      {
        source: InjectToContentEvents.onCdp,
        message: data,
      },
      "*"
    );
  }
  chobitsu.setOnMessage((message) => {
    if (message.includes('"id":"tmp')) return;
    const parsedMsg = JSON.parse(message);
    if (parsedMsg.method === "Network.responseReceived") {
      sendMessage(message);
      setTimeout(() => {
        const response = chobitsu
          .domain("Network")
          .getResponseBody({requestId: parsedMsg.params.requestId});

        if (response.data) {
          sendMessage(
            JSON.stringify({
              method: "Network.dataReceived",
              params: {
                requestId: parsedMsg.params.requestId,
                timestamp: parsedMsg.params.timestamp,
                dataLength: response.data.length,
                encodedDataLength: parsedMsg.params.response?.encodedDataLength,
                body: Buffer.from(response.data).toString('base64'),
              },
            })
          );
        }
      }, 1000);
    }
    sendMessage(message);
  });

  window.addEventListener("message", (event) => {
    if(event.source === window && event.data.source === ContentToInjectEvents.startCdp) {
      isCdpEnabled = true;
      return;
    }
    if(event.source === window && event.data.source === ContentToInjectEvents.stopCdp) {
      isCdpEnabled = false;
      return;
    }
  });

  sendToChobitsu({ method: "Network.enable" });
  sendToChobitsu({ method: "Runtime.enable" });
}

export default defineUnlistedScript(main);
