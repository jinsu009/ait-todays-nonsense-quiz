-- Local development data. Run after the migration on a development database.
insert into tnq.quizzes (quiz_date, question, answer, hints)
select day::date, '왕이 넘어지면?', '킹콩',
       array['왕을 영어로 바꿔 보세요.', '넘어질 때 나는 소리를 붙여 보세요.']
from generate_series(
  timezone('Asia/Seoul', now())::date - 1,
  timezone('Asia/Seoul', now())::date,
  interval '1 day'
) as dates(day)
on conflict (quiz_date) do nothing;
