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
    const { text, sourceLang, targetLang } = await req.json();
    
    if (!text || !sourceLang || !targetLang) {
      throw new Error('Text, source language, and target language are required');
    }

    const BHASHINI_API_KEY = Deno.env.get('BHASHINI_API_KEY');
    const BHASHINI_USER_ID = Deno.env.get('BHASHINI_USER_ID');

    if (!BHASHINI_API_KEY || !BHASHINI_USER_ID) {
      throw new Error('Bhashini credentials not configured');
    }

    console.log(`Translating from ${sourceLang} to ${targetLang}`);

    // Call Bhashini MT endpoint
    const response = await fetch('https://canvas.iiit.ac.in/sandboxbeprod/check_model_status_and_infer/67b86729b5cc0eb923163869', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BHASHINI_API_KEY}`,
        'x-user-id': BHASHINI_USER_ID,
      },
      body: JSON.stringify({
        text: text,
        source_language: sourceLang,
        target_language: targetLang,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bhashini MT error:', error);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Translation response received');

    return new Response(
      JSON.stringify({ translatedText: data.translated_text || data.output || text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
