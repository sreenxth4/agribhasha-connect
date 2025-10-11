import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service IDs for different models
const SERVICE_IDS = {
  asr: {
    te: 'ai4bharat/conformer-multilingual-indo_aryan-gpu--t4',
    hi: 'ai4bharat/conformer-hi-gpu--t4',
    ta: 'bhashini/iitm/asr-dravidian--gpu--t4',
    kn: 'bhashini/iitm/asr-dravidian--gpu--t4',
    en: 'ai4bharat/whisper-medium-en--gpu--t4'
  }
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

    const lang = language || 'te';
    
    console.log('Processing ASR request for language:', lang);

    // Use AnuvaadHub sandbox endpoint
    const response = await fetch('https://canvas.iiit.ac.in/sandboxbeprod/infer_asr/67b840e29c21bec07537674b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BHASHINI_API_KEY,
        'userID': BHASHINI_USER_ID,
      },
      body: JSON.stringify({
        audio: audio,
        language: lang
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AnuvaadHub ASR error:', response.status, error);
      throw new Error(`ASR failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('ASR response received');

    // Extract text from AnuvaadHub response
    const text = data.text || data.transcription || '';

    return new Response(
      JSON.stringify({ text }),
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
