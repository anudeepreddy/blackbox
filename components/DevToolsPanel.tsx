export function DevToolsPanel({
  onReady,
  ref,
}: {
  onReady: () => void;
  ref: React.Ref<HTMLIFrameElement>;
}) {
  const devtoolsSrc = browser.runtime.getURL(
    `/devtools.html#?embedded=${encodeURIComponent(location.origin)}`
  );

  return (
    <iframe
      src={devtoolsSrc}
      onLoad={onReady}
      ref={ref}
      height="100%"
      width="100%"
    ></iframe>
  );
}
