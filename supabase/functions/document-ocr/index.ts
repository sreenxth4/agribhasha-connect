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
    const { file } = await req.json();
    
    if (!file) {
      throw new Error('File data is required');
    }

    const BHASHINI_API_KEY = Deno.env.get('BHASHINI_API_KEY');
    const BHASHINI_USER_ID = Deno.env.get('BHASHINI_USER_ID');

    if (!BHASHINI_API_KEY || !BHASHINI_USER_ID) {
      throw new Error('Bhashini credentials not configured');
    }

    console.log('Processing OCR request');

    // Use Bhashini Pipeline API format for OCR
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
            taskType: 'ocr',
            config: {
              language: {
                sourceLanguage: 'en' // OCR can detect language automatically
              },
              serviceId: 'ulca/ekstep/text-extraction--cpu-fsm'
            }
          }
        ],
        inputData: {
          image: [
            {
              imageContent: file
            }
          ]
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bhashini OCR error:', response.status, error);
      throw new Error(`OCR failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('OCR response received');

    // Extract text from pipeline response
    const extractedText = data.pipelineResponse?.[0]?.output?.[0]?.source || '';

    return new Response(
      JSON.stringify({ extractedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Document OCR error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
