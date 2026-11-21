import { quizWindow } from './schedule'

const questions = [
  { question: '왕이 넘어지면?', answer: '킹콩', hints: ['왕을 영어로 바꿔 보세요.', '넘어질 때 나는 소리를 붙여 보세요.'] },
  { question: '자동차가 깜짝 놀라면?', answer: '카놀라유', hints: ['자동차는 영어로 car예요.', '요리할 때 쓰는 기름 이름이에요.'] },
  { question: '신발이 화가 나면?', answer: '신발끈', hints: ['화를 참을 때 쓰는 표현을 떠올려 보세요.', '운동화에 달려 있어요.'] },
] as const

type Entry = { answer?: string; hints: number; checked?: boolean; correct?: boolean }
type Entries = Record<string, Entry>
const storageKey = 'tnq-quiz:mock:v1'

function read(): Entries {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Entries
  } catch {
    return {}
  }
}

function model(now: Date) {
  const window = quizWindow(now)
  const index = Math.floor(window.day / 86_400_000) % questions.length
  return { window, quiz: questions[index] }
}

export const mockQuiz = {
  view(now: Date) {
    const { window, quiz } = model(now)
    const entries = read()
    const entry = entries[window.date] ?? { hints: 0 }
    const correctCount = Object.values(entries).filter((item) => item.correct).length
    return {
      ...window,
      question: quiz.question,
      hints: quiz.hints.slice(0, entry.hints),
      hintLimit: quiz.hints.length,
      submitted: entry.answer,
      checked: entry.checked,
      correct: entry.correct,
      answer: entry.checked && window.phase === 'results' ? quiz.answer : undefined,
      correctCount,
    }
  },
  update(action: 'submit' | 'hint' | 'check', expectedDate: string, answer?: string) {
    const { window, quiz } = model(new Date())
    if (window.date !== expectedDate || (action === 'check') !== (window.phase === 'results')) {
      return '퀴즈 시간이 바뀌었어요. 지금 화면을 확인해 주세요.'
    }
    const entries = read()
    const entry = entries[window.date] ?? { hints: 0 }
    if (action === 'submit') {
      if (!answer?.trim() || answer.length > 80) return '정답을 1~80자로 입력해 주세요.'
      entry.answer = answer
    }
    if (action === 'hint') entry.hints = Math.min(entry.hints + 1, quiz.hints.length)
    if (action === 'check' && !entry.checked) {
      entry.checked = true
      entry.correct = entry.answer === quiz.answer
    }
    entries[window.date] = entry
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries))
    } catch {
      return '브라우저에 저장할 수 없어요. 저장 설정을 확인해 주세요.'
    }
    return action === 'submit' ? '답안을 저장했어요.' : ''
  },
}
