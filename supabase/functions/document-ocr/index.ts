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

    // Call Bhashini OCR endpoint
    const response = await fetch('https://canvas.iiit.ac.in/sandboxbeprod/check_ocr_status_and_infer/6711fe751595b8ffe97adc1f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BHASHINI_API_KEY}`,
        'x-user-id': BHASHINI_USER_ID,
      },
      body: JSON.stringify({
        file: file,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bhashini OCR error:', error);
      throw new Error(`OCR failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('OCR response received');

    return new Response(
      JSON.stringify({ 
        extractedText: data.extracted_text || data.text || data.output || '' 
      }),
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
