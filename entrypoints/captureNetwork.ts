function main() {
  function sendMessage(data: any) {
    window.postMessage(
      {
        source: "captureNetwork",
        message: data,
      },
      "*"
    );
  }
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  const originalFetch = window.fetch;

  XMLHttpRequest.prototype.open = function (
    method,
    url,
    async,
    user,
    password
  ) {
    this._method = method;
    this._url = url;
    this._requestStartTime = performance.now();

    originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const xhr = this;
    const method = xhr._method || "GET";
    const url = xhr._url || "UNKNOWN_URL";
    const startTime = xhr._requestStartTime;

    xhr.addEventListener("loadend", function () {
      const duration = (performance.now() - startTime).toFixed(2);

      sendMessage({
        method,
        url,
        status: xhr.status,
        time: Number(duration),
        requestBody: body,
        responseBody: xhr.responseText,
      });
    });

    xhr.addEventListener("error", function () {
      const duration = (performance.now() - startTime).toFixed(2);
      sendMessage({
        method,
        url,
        status: xhr.status,
        time: Number(duration),
        requestBody: body,
      });
    });

    xhr.addEventListener("abort", function () {
      const duration = (performance.now() - startTime).toFixed(2);
      sendMessage({
        method,
        url,
        status: xhr.status,
        time: Number(duration),
        requestBody: body,
      });
    });

    originalXhrSend.apply(this, arguments);
  };

  window.fetch = function (input, init) {
    const url =
      typeof input === "string"
        ? input
        : input && input.url
        ? input.url
        : "UNKNOWN_URL";
    const method = init && init.method ? init.method : "GET";
    const startTime = performance.now();

    return originalFetch
      .apply(this, arguments)
      .then((response) => {
        const duration = (performance.now() - startTime).toFixed(2);

        sendMessage({
          method,
          url,
          status: response.status,
          time: Number(duration),
          requestBody: init?.body,
          responseBody: response.clone().text(),
        });

        return response;
      })
      .catch((error) => {
        const duration = (performance.now() - startTime).toFixed(2);
        sendMessage({
          method,
          url,
          status: 0,
          time: Number(duration),
          requestBody: init?.body,
        });
        throw error;
      });
  };
}

export default defineUnlistedScript(main);
