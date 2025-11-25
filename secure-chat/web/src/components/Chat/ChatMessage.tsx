type ChatMessageProps = {
  from: "own" | "other";
  text: string;
  time: string;
  isPhoto?: boolean;
  fileUrl?: string;
  fileName?: string;
  onLongPress?: () => void;
};

function ChatMessage({
  from,
  text,
  time,
  isPhoto,
  fileUrl,
  fileName,
  onLongPress,
}: ChatMessageProps) {
  const isOwn = from === "own";

  let pressTimer: number | undefined;

  const handlePressStart = () => {
    if (!onLongPress) return;
    pressTimer = window.setTimeout(() => {
      onLongPress();
    }, 500);
  };

  const clearTimer = () => {
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      pressTimer = undefined;
    }
  };

  return (
    <div
      className={`message-row ${isOwn ? "own" : "other"}`}
      onMouseDown={handlePressStart}
      onMouseUp={clearTimer}
      onMouseLeave={clearTimer}
      onTouchStart={handlePressStart}
      onTouchEnd={clearTimer}
    >
      <div
        className={`bubble ${isOwn ? "bubble-own" : "bubble-other"}`}
      >
        {fileUrl ? (
          <div className="file-box">
            {fileName && (
              <div className="file-name">{fileName}</div>
            )}
            {fileUrl.toLowerCase().endsWith(".pdf") ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="file-open-btn"
              >
                PDFを開く
              </a>
            ) : (
              <img src={fileUrl} className="photo-thumb" />
            )}
          </div>
        ) : (
          <div className="bubble-text">
            {isPhoto ? "[写真プレビュー]" : text}
          </div>
        )}
        <div className="bubble-time">{time}</div>
      </div>
    </div>
  );
}

export default ChatMessage;

