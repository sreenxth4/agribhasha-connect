import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const BHASHINI_API_KEY = Deno.env.get('BHASHINI_API_KEY');
    const BHASHINI_USER_ID = Deno.env.get('BHASHINI_USER_ID');

    if (!BHASHINI_API_KEY || !BHASHINI_USER_ID) {
      throw new Error('Bhashini credentials not configured');
    }

    console.log('Processing TTS request for language:', language);

    // Call Bhashini TTS endpoint
    const response = await fetch('https://canvas.iiit.ac.in/sandboxbeprod/generate_tts/67b842f39c21bec07537674e', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BHASHINI_API_KEY}`,
        'x-user-id': BHASHINI_USER_ID,
      },
      body: JSON.stringify({
        text: text,
        language: language || 'en',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bhashini TTS error:', error);
      throw new Error(`TTS failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('TTS response received');

    return new Response(
      JSON.stringify({ audio: data.audio || data.output || '' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Text-to-speech error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
