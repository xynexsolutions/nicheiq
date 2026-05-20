export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { system, messages, max_tokens } = req.body;

  try {
    // Convert messages to Groq format (OpenAI compatible)
    const groqMessages = messages.map((msg) => {
      let role = msg.role === 'user' ? 'user' : 'assistant';
      return {
        role,
        content: msg.content
      };
    });

    // Add system message if provided
    const allMessages = system 
      ? [{ role: 'system', content: system }, ...groqMessages]
      : groqMessages;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: allMessages,
        max_tokens: max_tokens || 1600,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }
    
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ result: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
