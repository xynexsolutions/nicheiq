export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { system, messages, max_tokens } = req.body;

  try {
    // Convert messages to Gemini format
    const contents = messages.map((msg, idx) => {
      let role = msg.role === 'user' ? 'user' : 'model';
      
      // Add system message to first user message if provided
      let text = msg.content;
      if (system && idx === 0 && msg.role === 'user') {
        text = `${system}\n\n${msg.content}`;
      }
      
      return {
        role,
        parts: [{ text }]
      };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: max_tokens || 1600,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ result: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}