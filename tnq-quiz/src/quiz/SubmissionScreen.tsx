import { Button } from "@toss/tds-mobile";
import { useState } from "react";
import type { FormEvent } from "react";
import { NoticeModal } from "../components/NoticeModal";
import { saveSubmission } from "./mockSubmissions";

export function SubmissionScreen({
  correctCount,
  testing,
  onBack,
}: {
  correctCount: number;
  testing: boolean;
  onBack: () => void;
}) {
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saved) return;
    const fields = new FormData(event.currentTarget);
    const error = saveSubmission(
      {
        question: String(fields.get("question") ?? ""),
        answer: String(fields.get("answer") ?? ""),
        hint1: String(fields.get("hint1") ?? ""),
        hint2: String(fields.get("hint2") ?? ""),
      },
      correctCount,
      testing,
    );

    if (error) {
      setMessage(error);
      return;
    }
    setMessage("");
    setSaved(true);
  }

  return (
    <>
      <div className="submission-back">
        <button type="button" onClick={onBack}>
          <span>뒤로가기</span>
        </button>
      </div>
      <h1>문제 등록</h1>
      <form onSubmit={submit}>
        <label htmlFor="submission-question">
          문제 <span className="required-mark" aria-hidden="true">*</span>
        </label>
        <input
          id="submission-question"
          name="question"
          required
          maxLength={200}
        />
        <label htmlFor="submission-answer">
          답변 <span className="required-mark" aria-hidden="true">*</span>
        </label>
        <input id="submission-answer" name="answer" required maxLength={80} />
        <label htmlFor="submission-hint1">힌트 1</label>
        <input id="submission-hint1" name="hint1" maxLength={200} />
        <label htmlFor="submission-hint2">힌트 2</label>
        <input id="submission-hint2" name="hint2" maxLength={200} />
        <Button type="submit">저장</Button>
        {message && <p role="alert">{message}</p>}
      </form>
      {saved && (
        <NoticeModal
          title="문제를 저장했어요"
          message="관리자 검수후 등록됩니다. 기간은 3-4일 소요됩니다."
          onClose={onBack}
        />
      )}
    </>
  );
}
