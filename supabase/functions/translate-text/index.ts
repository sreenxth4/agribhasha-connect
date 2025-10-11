import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service IDs for translation models
const SERVICE_IDS = {
  translation: 'ai4bharat/indictrans-v2-all-gpu--t4'
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

    // Use Bhashini Pipeline API format
    const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BHASHINI_API_KEY,
        'userID': BHASHINI_USER_ID,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
              },
              serviceId: SERVICE_IDS.translation
            }
          }
        ],
        inputData: {
          input: [
            {
              source: text
            }
          ]
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bhashini Translation error:', response.status, error);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Translation response received');

    // Extract translated text from pipeline response
    const translatedText = data.pipelineResponse?.[0]?.output?.[0]?.target || text;

    return new Response(
      JSON.stringify({ translatedText }),
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
