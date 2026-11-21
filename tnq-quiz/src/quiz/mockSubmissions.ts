type QuizDraft = {
  question: string
  answer: string
  hint1: string
  hint2: string
}

type QuizSubmission = {
  question: string
  answer: string
  hints: string[]
  status: 'pending'
  submittedAt: string
}

function storageKey(testing: boolean) {
  return testing ? 'tnq-quiz:submissions:v1:test' : 'tnq-quiz:submissions:v1'
}

function readSubmissions(testing: boolean): QuizSubmission[] {
  return JSON.parse(localStorage.getItem(storageKey(testing)) ?? '[]') as QuizSubmission[]
}

export function remainingSubmissionChances(correctCount: number, testing: boolean) {
  try {
    return Math.max(0, Math.floor(correctCount / 3) - readSubmissions(testing).length)
  } catch {
    return 0
  }
}

export function saveSubmission(draft: QuizDraft, correctCount: number, testing: boolean) {
  const question = draft.question.trim()
  const answer = draft.answer.trim()
  const hints = [draft.hint1.trim(), draft.hint2.trim()].filter(Boolean)
  if (!question || !answer) {
    return '문제와 답변을 모두 입력해 주세요.'
  }

  try {
    const submissions = readSubmissions(testing)
    if (submissions.length >= Math.floor(correctCount / 3)) {
      return '사용할 수 있는 문제 등록 기회가 없어요.'
    }
    submissions.push({
      question,
      answer,
      hints,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    })
    localStorage.setItem(storageKey(testing), JSON.stringify(submissions))
    return ''
  } catch {
    return '문제를 저장할 수 없어요. 브라우저 저장 설정을 확인해 주세요.'
  }
}
