const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const key = fs.readFileSync('/home/user/uploads/Gemini_api.txt','utf8').trim();
const genAI = new GoogleGenerativeAI(key);
const cfg = { temperature: 0.2, maxOutputTokens: 128, responseMimeType: 'application/json' };
const candidates = ['gemini-3.8-flash','gemini-flash-latest','gemini-3.5-flash','gemini-2.5-flash-lite','gemini-3.1-flash-lite','gemini-3.6-flash','gemini-3.7-flash'];
(async () => {
  for (const m of candidates) {
    const model = genAI.getGenerativeModel({ model: m });
    const t0 = Date.now();
    try {
      const r = await model.generateContent({ contents:[{ role:'user', parts:[{ text:'Return JSON {"ok":true,"model":"'+m+'"}' }] }], generationConfig: cfg });
      const txt = r.response.text().replace(/\s+/g,' ');
      console.log(`OK    ${m} (${Date.now()-t0}ms) -> ${txt.slice(0,90)}`);
    } catch (e) {
      const msg = String(e.message).replace(/\s+/g,' ');
      const code = (msg.match(/\[(\d{3})[^\]]*\]/) || [])[1] || '?';
      console.log(`FAIL  ${m} (${Date.now()-t0}ms) [${code}] ${msg.slice(msg.indexOf(']')+1, 200)}`);
    }
  }
})();
