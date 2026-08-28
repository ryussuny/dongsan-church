/* ===========================================================
   updatedAt 은 "만든 시각"이 아니라 "내용이 바뀐 시각"이어야 한다.

   왜 필요한가
     오늘의 말씀은 하루에 여러 번 만들어질 수 있다(예약이 밀렸을 때를 대비해
     그물을 여러 번 던져 두었다). 그런데 updatedAt 에 그때그때의 시각을 넣으면,
     말씀 내용이 한 글자도 다르지 않은데 파일은 매번 달라진다.
     그러면 "변경 없음이면 게시하지 않는다"는 약속이 무너지고,
     내용은 같은데 시각만 바뀐 커밋이 하루에 몇 개씩 쌓인다.

   그래서 내용이 지난번과 같으면 지난번 시각을 그대로 물려준다.
   파일이 글자 하나 다르지 않게 되어, 바뀐 게 없으면 정말로 없는 것이 된다.
   =========================================================== */
const fs = require('fs');

/* payload 는 updatedAt 을 뺀 알맹이. 지난 파일의 알맹이와 같으면
   지난 updatedAt 을, 다르면 지금 시각을 돌려준다. */
function keepTimeIfSame(file, payload) {
  const now = new Date().toISOString();
  let prev;
  try {
    prev = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return now;                    /* 파일이 없거나 깨졌으면 새로 찍는다 */
  }
  const prevTime = prev.updatedAt;
  if (typeof prevTime !== 'string') return now;

  delete prev.updatedAt;
  return JSON.stringify(prev) === JSON.stringify(payload) ? prevTime : now;
}

module.exports = { keepTimeIfSame };
