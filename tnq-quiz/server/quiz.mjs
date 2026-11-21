import pg from 'pg'

export function createQuizRepository(connectionString) {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000 })

  return {
    close: () => pool.end(),
    async update(subject, action, expectedDate, answer = null) {
      if (!['submit', 'hint', 'check'].includes(action)) throw new Error('Invalid action')
      if (action === 'submit' && (typeof answer !== 'string' || !answer.trim() || answer.length > 80)) {
        throw new Error('Invalid answer')
      }

      const client = await pool.connect()
      try {
        await client.query('begin')
        const { rows: [clock] } = await client.query(`
          select (kst::date - (extract(hour from kst) < 6)::int)::text as date,
                 extract(hour from kst) between 6 and 19 as accepting
          from (select statement_timestamp() at time zone 'Asia/Seoul' as kst) clock
        `)
        if (clock.date !== expectedDate || clock.accepting === (action === 'check')) {
          throw new Error('Quiz window changed')
        }
        const { rows: [quiz] } = await client.query(
          'select answer, hints from tnq.quizzes where quiz_date = $1', [expectedDate],
        )
        if (!quiz) throw new Error('Quiz unavailable')
        const { rows: [user] } = await client.query(`
          insert into tnq.users (subject) values ($1)
          on conflict (subject) do update set subject = excluded.subject
          returning id
        `, [subject])
        const keys = [user.id, expectedDate]
        await client.query(`
          insert into tnq.attempts (user_id, quiz_date) values ($1, $2)
          on conflict (user_id, quiz_date) do nothing
        `, keys)

        if (action === 'submit') {
          await client.query(`
            update tnq.attempts set answer = $3
            where user_id = $1 and quiz_date = $2 and checked_at is null
          `, [...keys, answer])
        }
        if (action === 'hint') {
          await client.query(`
            update tnq.attempts set hints_opened = least(hints_opened + 1, $3::int)
            where user_id = $1 and quiz_date = $2
          `, [...keys, quiz.hints.length])
        }
        if (action === 'check') {
          await client.query(`
            update tnq.attempts
            set checked_at = statement_timestamp(),
                is_correct = coalesce(answer collate "C" = $3::text collate "C", false)
            where user_id = $1 and quiz_date = $2 and checked_at is null
          `, [...keys, quiz.answer])
        }

        const { rows: [attempt] } = await client.query(`
          select answer, hints_opened, checked_at, is_correct
          from tnq.attempts where user_id = $1 and quiz_date = $2
        `, keys)
        const { rows: [stats] } = await client.query(`
          select count(*) filter (where is_correct)::int as "correctCount",
                 count(answer)::int as "participationCount"
          from tnq.attempts where user_id = $1
        `, [user.id])
        await client.query('commit')

        return {
          ...stats,
          submitted: attempt.answer,
          hints: quiz.hints.slice(0, attempt.hints_opened),
          checked: attempt.checked_at !== null,
          correct: attempt.is_correct,
          answer: action === 'check' ? quiz.answer : undefined,
          earnedSubmissionChances: Math.floor(stats.correctCount / 3),
        }
      } catch (error) {
        await client.query('rollback')
        throw error
      } finally {
        client.release()
      }
    },
  }
}
