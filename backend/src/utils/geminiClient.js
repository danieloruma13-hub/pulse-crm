const { gemini } = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

async function generateText({ systemInstruction, prompt, temperature = 0.7 }) {
  if (!gemini.apiKey) {
    throw new AppError('GEMINI_API_KEY is not configured on the server', 500);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${gemini.model}:generateContent?key=${gemini.apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API error:', res.status, errText);
    if (res.status === 429) {
      throw new AppError('AI request limit reached, try again shortly', 429);
    }
    throw new AppError('AI request failed', 502);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) throw new AppError('AI returned an empty response', 502);
  return text.trim();
}

async function callGemini(contents, systemInstruction, tools, temperature) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${gemini.model}:generateContent?key=${gemini.apiKey}`;

  const body = {
    contents,
    generationConfig: { temperature },
  };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
  if (tools) body.tools = tools;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API error:', res.status, errText);
    if (res.status === 429) throw new AppError('AI request limit reached, try again shortly', 429);
    throw new AppError('AI request failed', 502);
  }

  return res.json();
}

async function generateWithTools({ systemInstruction, prompt, tools, executeFunction, history = [], temperature = 0.4, maxSteps = 5 }) {
  if (!gemini.apiKey) {
    throw new AppError('GEMINI_API_KEY is not configured on the server', 500);
  }

  const historyContents = history.map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));

  const contents = [...historyContents, { role: 'user', parts: [{ text: prompt }] }];
  const actionsTaken = [];

  for (let step = 0; step < maxSteps; step++) {
    const data = await callGemini(contents, systemInstruction, tools, temperature);
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCallPart = parts.find((p) => p.functionCall);

    if (!functionCallPart) {
      const text = parts.map((p) => p.text).filter(Boolean).join('').trim();
      return { reply: text || 'Done.', actionsTaken };
    }

    const { name, args } = functionCallPart.functionCall;
    let result;
    try {
      result = await executeFunction(name, args || {});
      actionsTaken.push({ name, args, success: true });
    } catch (err) {
      result = { error: err.message || 'Action failed' };
      actionsTaken.push({ name, args, success: false, error: err.message });
    }

    contents.push({ role: 'model', parts: candidate.content.parts });
    contents.push({
      role: 'user',
      parts: [{ functionResponse: { name, response: { result } } }],
    });
  }

  return { reply: 'I performed several actions but ran out of steps before summarizing. Check your CRM to confirm the results.', actionsTaken };
}

module.exports = { generateText, generateWithTools };
