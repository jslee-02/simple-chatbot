import { IconHourglassHigh } from "@tabler/icons-react";

export const ChatLoader = () => {
  return (
    <div className="flex flex-col flex-start">
      <div
        className={`flex items-center bg-neutral-200 text-neutral-900 rounded-xl px-4 py-2 w-fit`}
        style={{ overflowWrap: "anywhere" }}
      >
        <IconHourglassHigh className="animate-pulse" />
      </div>
    </div>
  );
};
