// api/chat.js — Vercel 서버리스 함수 (API 키는 여기서만 사용)
const SYSTEM_PROMPT =
  "너는 고등학생을 돕는 의약품 공공데이터 설명 도우미야. " +
  "아래 [데이터]에 있는 내용만 근거로 3~4문장 이내로 친근한 존댓말로 답해. " +
  "특정 약을 먹으라고 권하거나 복용량, 진단 같은 의학적 조언은 절대 하지 마. " +
  "데이터에 없는 내용은 모른다고 말해. " +
  "답변 끝에는 항상 '실제 복용은 약사·의사와 상담하세요.'를 붙여.";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 받아요." });
  }

  const { question, data } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "질문이 비어 있어요." });
  }

  const q = String(question).slice(0, 300);                 // 질문 길이 제한
  const context = JSON.stringify(data || {}).slice(0, 6000); // 데이터 길이 제한

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `[데이터]\n${context}\n\n[질문]\n${q}` }],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: result.error?.message || "AI 요청 실패" });
    }
    return res.status(200).json({ answer: result.content[0].text });
  } catch (err) {
    return res.status(500).json({ error: "서버 오류: " + err.message });
  }
};
