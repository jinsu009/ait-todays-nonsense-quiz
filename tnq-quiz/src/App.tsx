import { Button } from '@toss/tds-mobile'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { mockQuiz } from './quiz/mockQuiz'
import { remainingSubmissionChances } from './quiz/mockSubmissions'
import { SubmissionScreen } from './quiz/SubmissionScreen'
import './App.css'

export default function App() {
  const query = new URLSearchParams(location.search)
  const testing = import.meta.env.DEV && query.get('quiz-test') === '1'
  const previewFullPouch = import.meta.env.DEV && query.get('pouch-preview') === 'full'
  const [now, setNow] = useState(() => new Date())
  const [submitting, setSubmitting] = useState(false)
  const [testDay, setTestDay] = useState(() => {
    let day = 0
    while (testing && mockQuiz.view(new Date(Date.UTC(2026, 10, 21 + day, 0)), true).checked) day += 1
    return day
  })
  const [testFeedback, setTestFeedback] = useState('')
  const [testPhase, setTestPhase] = useState<'answering' | 'results'>('answering')
  const testDate = new Date(Date.UTC(2026, 10, 21 + testDay, testPhase === 'answering' ? 0 : 12))
  const quizClock = testing ? testDate : now
  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = window.setInterval(refresh, 1_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const quiz = mockQuiz.view(quizClock, testing)
  const availableChances = remainingSubmissionChances(quiz.correctCount, testing)
  if (submitting) {
    return (
      <main className="quiz">
        <SubmissionScreen correctCount={quiz.correctCount} testing={testing} onBack={() => setSubmitting(false)} />
      </main>
    )
  }

  return (
    <main className="quiz">
      <header className="quiz-header">
        <div>
          <h1>오늘의 넌센스 퀴즈</h1>
          <p>매일 오전 6시에 새 문제가 나와요.</p>
        </div>
        <FortunePouch correctCount={previewFullPouch ? 3 : quiz.correctCount} />
      </header>
      <QuizScreen
      key={quiz.date}
      quiz={quiz}
      testing={testing}
      availableChances={availableChances}
      onOpenSubmission={() => setSubmitting(true)}
      refresh={() => setNow(new Date())}
      update={(action, answer) => {
        const message = mockQuiz.update(action, quiz.date, answer, testing ? testDate : undefined)
        if (testing && action === 'submit' && !message) {
          setTestDay((day) => day + 1)
          setTestPhase('answering')
          setTestFeedback('정답으로 인정했어요. 다음 문제를 풀어 보세요.')
        }
        return message
      }}
      testControls={testing && (
        <div className="quiz-test-controls">
          <Button type="button" variant="weak" onClick={() => setTestPhase('results')} disabled={testPhase === 'results'}>
            오후 8시로 이동
          </Button>
          <Button type="button" variant="weak" onClick={() => { setTestDay(testDay + 1); setTestPhase('answering') }}>
            다음 날로 이동
          </Button>
        </div>
      )}
      />
      {testing && <p role="status">{testFeedback}</p>}
    </main>
  )
}

function QuizScreen({
  quiz,
  testing,
  availableChances,
  onOpenSubmission,
  refresh,
  update,
  testControls,
}: {
  quiz: ReturnType<typeof mockQuiz.view>
  testing: boolean
  availableChances: number
  onOpenSubmission: () => void
  refresh: () => void
  update: (action: 'submit' | 'hint' | 'check', answer?: string) => string
  testControls: React.ReactNode
}) {
  const [draft, setDraft] = useState(quiz.submitted ?? '')
  const [message, setMessage] = useState('')
  const answering = quiz.phase === 'answering'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    act('submit', draft)
  }

  function act(action: 'submit' | 'hint' | 'check', answer?: string) {
    setMessage(update(action, answer))
    refresh()
  }

  return (
    <>
      {testControls}

      {quiz.preparing && (
        <p className="notice">오늘 문제를 준비 중이에요. 어제 정답은 오전 6시 전까지 확인할 수 있어요.</p>
      )}

      <section className="question" aria-labelledby="question">
        <p className="state"><time dateTime={quiz.date}>{quiz.date}</time> · {answering ? '답안 접수 중' : '정답 공개'}</p>
        <h2 id="question">{quiz.question}</h2>
        {answering && <p>{testing ? '테스트 모드에서는 어떤 답안이든 정답으로 인정돼요.' : '정답은 오후 8시에 공개돼요.'}</p>}
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
            {!testing && <p className="help">{quiz.submitted !== undefined ? `저장된 답안: ${quiz.submitted}` : '오후 8시 전까지 답안을 수정할 수 있어요.'}</p>}
            <Button type="submit" disabled={!draft.trim() || (!testing && draft === quiz.submitted)}>
              {testing ? '제출하고 채점하기' : quiz.submitted === undefined ? '답안 저장' : '답안 수정'}
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
                <dt>남은 문제 등록 기회</dt><dd>{availableChances}회</dd>
              </dl>
            </div>
          ) : (
            <Button type="button" onClick={() => act('check')}>정답 확인</Button>
          )}
        </section>
      )}
      {availableChances > 0 && (
        <div className="quiz-submission-link">
          <Button type="button" variant="weak" onClick={onOpenSubmission}>문제등록하러가기</Button>
        </div>
      )}
      <p className="feedback" role="status">{message}</p>
    </>
  )
}

function FortunePouch({ correctCount }: { correctCount: number }) {
  const [open, setOpen] = useState(false)
  const filledSteps = correctCount === 0 ? 0 : ((correctCount - 1) % 3) + 1

  return (
    <div className="fortune-progress">
      <button type="button" className="fortune-toggle" aria-label="복주머니" aria-expanded={open} aria-controls="fortune-count" onClick={() => setOpen(!open)}>
        <span className="fortune-pouch" data-steps={filledSteps} aria-hidden="true">
          <span className="fortune-pouch__body">
            <span className="fortune-pouch__unfilled" style={{ height: `${(3 - filledSteps) / 3 * 100}%` }} />
          </span>
          <span className="fortune-pouch__tie" />
        </span>
      </button>
      <div id="fortune-count" className="fortune-count" hidden={!open} aria-live="polite">
        누적 정답 횟수 : {filledSteps}/3
        {correctCount > 3 && <span>총 {correctCount}회</span>}
      </div>
    </div>
  )
}
