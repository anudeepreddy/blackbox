async function main() {
  const chobitsu = (await import("chobitsu")).default;
  let id = 0;
  const sendToChobitsu = (message) => {
    message.id = "tmp" + ++id;
    chobitsu.sendRawMessage(JSON.stringify(message));
  };

  function sendMessage(data: any) {
    window.postMessage(
      {
        source: "chobitsu",
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

  sendToChobitsu({ method: "Network.enable" });
  sendToChobitsu({ method: "Runtime.enable" });
}

export default defineUnlistedScript(main);
