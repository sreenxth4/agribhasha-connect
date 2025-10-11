import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service IDs for TTS models
const SERVICE_IDS = {
  tts: {
    te: 'bhashini/iitm/fastpitch-telugu_female-gpu--t4',
    hi: 'ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4',
    ta: 'bhashini/iitm/fastpitch-tamil_female-gpu--t4',
    kn: 'bhashini/iitm/fastpitch-kannada_female-gpu--t4',
    en: 'ai4bharat/indic-tts-coqui-misc-gpu--t4'
  }
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

    const lang = language || 'en';
    const serviceId = SERVICE_IDS.tts[lang as keyof typeof SERVICE_IDS.tts] || SERVICE_IDS.tts.en;

    console.log('Processing TTS request for language:', lang);

    // Use AnuvaadHub sandbox endpoint
    const response = await fetch('https://canvas.iiit.ac.in/sandboxbeprod/generate_tts/67b842f39c21bec07537674e', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BHASHINI_API_KEY,
        'userID': BHASHINI_USER_ID,
      },
      body: JSON.stringify({
        text: text,
        language: lang,
        gender: 'female'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bhashini TTS error:', response.status, error);
      throw new Error(`TTS failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('TTS response received');

    // Extract audio from AnuvaadHub response
    const audio = data.audio || data.audioContent || '';

    return new Response(
      JSON.stringify({ audio }),
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
