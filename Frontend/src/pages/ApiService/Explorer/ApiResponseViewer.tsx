type APIResponseViewerProps = {
  response: unknown;
};

export default function APIResponseViewer({ response }: APIResponseViewerProps) {
  if (!response) return <div>No response</div>;
  // If response is object, stringify
  return (
    <div className="bg-white p-4 rounded mt-4 shadow flex flex-col gap-3 max-w-xl w-full">
      {typeof response === "object"
        ? <pre>{JSON.stringify(response, null, 2)}</pre>
        : String(response)}
    </div>
  );
}
