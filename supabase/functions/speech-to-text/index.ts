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
    const { audio, language } = await req.json();
    
    if (!audio) {
      throw new Error('Audio data is required');
    }

    const BHASHINI_API_KEY = Deno.env.get('BHASHINI_API_KEY');
    const BHASHINI_USER_ID = Deno.env.get('BHASHINI_USER_ID');

    if (!BHASHINI_API_KEY || !BHASHINI_USER_ID) {
      throw new Error('Bhashini credentials not configured');
    }

    console.log('Processing ASR request for language:', language);

    // Call Bhashini ASR endpoint
    const response = await fetch('https://canvas.iiit.ac.in/sandboxbeprod/infer_asr/67b840e29c21bec07537674b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BHASHINI_API_KEY}`,
        'x-user-id': BHASHINI_USER_ID,
      },
      body: JSON.stringify({
        audio: audio,
        language: language || 'te',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bhashini ASR error:', error);
      throw new Error(`ASR failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('ASR response received');

    return new Response(
      JSON.stringify({ text: data.text || data.output || '' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
