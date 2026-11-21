import { Button } from '@toss/tds-mobile'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { mockQuiz } from './quiz/mockQuiz'
import './App.css'

export default function App() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = window.setInterval(refresh, 1_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const quiz = mockQuiz.view(now)
  return <QuizScreen key={quiz.date} quiz={quiz} refresh={() => setNow(new Date())} />
}

function QuizScreen({
  quiz,
  refresh,
}: {
  quiz: ReturnType<typeof mockQuiz.view>
  refresh: () => void
}) {
  const [draft, setDraft] = useState(quiz.submitted ?? '')
  const [message, setMessage] = useState('')
  const answering = quiz.phase === 'answering'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    act('submit', draft)
  }

  function act(action: 'submit' | 'hint' | 'check', answer?: string) {
    setMessage(mockQuiz.update(action, quiz.date, answer))
    refresh()
  }

  return (
    <main className="quiz">
      <header>
        <h1>오늘의 넌센스 퀴즈</h1>
        <p>매일 오전 6시에 새 문제가 나와요.</p>
      </header>

      {quiz.preparing && (
        <p className="notice">오늘 문제를 준비 중이에요. 어제 정답은 오전 6시 전까지 확인할 수 있어요.</p>
      )}

      <section className="question" aria-labelledby="question">
        <p className="state"><time dateTime={quiz.date}>{quiz.date}</time> · {answering ? '답안 접수 중' : '정답 공개'}</p>
        <h2 id="question">{quiz.question}</h2>
        {answering && <p>정답은 오후 8시에 공개돼요.</p>}
      </section>

      {answering ? (
        <>
          <section aria-label="힌트" className="hints">
            <Button type="button" variant="weak" disabled={quiz.hints.length >= quiz.hintLimit} onClick={() => act('hint')}>
              힌트 확인 ({quiz.hints.length}/{quiz.hintLimit})
            </Button>
            <div aria-live="polite">
              {quiz.hints.length > 0 && <ol>{quiz.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol>}
            </div>
          </section>
          <form onSubmit={submit}>
            <label htmlFor="answer">내 답안</label>
            <input id="answer" value={draft} onChange={(event) => { setDraft(event.target.value); setMessage('') }} maxLength={80} autoComplete="off" placeholder="정답을 입력해 주세요" />
            <p className="help">{quiz.submitted !== undefined ? `저장된 답안: ${quiz.submitted}` : '오후 8시 전까지 답안을 수정할 수 있어요.'}</p>
            <Button type="submit" disabled={!draft.trim() || draft === quiz.submitted}>
              {quiz.submitted === undefined ? '답안 저장' : '답안 수정'}
            </Button>
          </form>
        </>
      ) : (
        <section className="result" aria-label="채점 결과">
          {quiz.checked ? (
            <div aria-live="polite">
              <h2>{quiz.submitted === undefined ? '정답을 확인했어요' : quiz.correct ? '정답이에요!' : '아쉬워요, 오답이에요'}</h2>
              <dl>
                <dt>최종 정답</dt><dd>{quiz.answer}</dd>
                <dt>내 답안</dt><dd>{quiz.submitted ?? '미참여'}</dd>
                <dt>누적 인정 정답</dt><dd>{quiz.correctCount}회</dd>
                <dt>받은 문제 등록 기회</dt><dd>{Math.floor(quiz.correctCount / 3)}회</dd>
              </dl>
            </div>
          ) : (
            <Button type="button" onClick={() => act('check')}>정답 확인</Button>
          )}
        </section>
      )}
      <p className="feedback" role="status">{message}</p>
    </main>
  )
}
