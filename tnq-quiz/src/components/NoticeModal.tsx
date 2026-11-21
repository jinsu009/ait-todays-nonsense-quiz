import { Button } from "@toss/tds-mobile";
import { useEffect, useId, useRef } from "react";
import "./NoticeModal.css";

export function NoticeModal({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="notice-modal"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onClose={onClose}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={messageId}>{message}</p>
      <Button type="button" onClick={() => dialog.current?.close()}>
        확인
      </Button>
    </dialog>
  );
}
