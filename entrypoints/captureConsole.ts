function main() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    function sendMessage(type: string, args: any[]) {
        window.postMessage(
            {
                source: "captureConsole",
                type,
                message: args.map(arg => {
                    try {
                        return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
                    } catch {
                        return String(arg);
                    }
                }).join(" "),
            },
            "*"
        );
    }

    console.log = (...args) => {
        sendMessage("log", args);
        originalLog.apply(console, args);
    };
    console.error = (...args) => {
        sendMessage("error", args);
        originalError.apply(console, args);
    };
    console.warn = (...args) => {
        sendMessage("warn", args);
        originalWarn.apply(console, args);
    };
    console.info = (...args) => {
        sendMessage("info", args);
        originalInfo.apply(console, args);
    };
}

export default defineUnlistedScript(main);