import { IconTrash } from "@tabler/icons-react";

export const ChatBubble = ({ message, onClear, last }) => {
  return (
    <div
      className={`flex flex-col ${
        /* message.role 이 assistant 인 경우 좌측 정렬, 그 외에는 우측 정렬 */
        message.role === "assistant" ? "items-start" : "items-end"
      }`}
    >
      <div
        className={`flex items-center ${
          message.role === "assistant"
            ? "bg-neutral-200 text-neutral-900"
            : "bg-green-500 text-white"
        } rounded-xl px-3 py-2 max-w-[67%] whitespace-pre-wrap`}
        style={{ overflowWrap: "anywhere" }}
      >
        {message.content}
      </div>
      {(last && message.role === "assistant") && (
        <div className="mt-2">
          <button onClick={() => onClear()}>
            <IconTrash className="h-8 w-16 hover:cursor-pointer rounded-full p-1 bg-red-500 text-white hover:opacity-80" />
          </button>
        </div>
      )}
    </div>
  );
};
