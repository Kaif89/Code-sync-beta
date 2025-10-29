import { corsHeaders } from '../_shared/cors.ts';

const PISTON_API = 'https://emkc.org/api/v2/piston';

// Language mapping to Piston API format
const languageMap: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  python: { language: 'python', version: '3.10.0' },
  java: { language: 'java', version: '15.0.2' },
  cpp: { language: 'c++', version: '10.2.0' },
  go: { language: 'go', version: '1.16.2' },
  rust: { language: 'rust', version: '1.68.2' },
  php: { language: 'php', version: '8.2.3' },
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language } = await req.json();

    console.log('Executing code:', { language, codeLength: code?.length });

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const pistonLanguage = languageMap[language];
    
    if (!pistonLanguage) {
      return new Response(
        JSON.stringify({ error: `Language ${language} is not supported for execution` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calling Piston API with:', pistonLanguage);

    // Call Piston API to execute code
    const response = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: pistonLanguage.language,
        version: pistonLanguage.version,
        files: [
          {
            name: 'main',
            content: code,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Piston API error:', errorText);
      throw new Error(`Piston API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Execution result:', result);

    return new Response(
      JSON.stringify({
        output: result.run?.output || result.compile?.output || 'No output',
        stderr: result.run?.stderr || result.compile?.stderr || '',
        stdout: result.run?.stdout || result.compile?.stdout || '',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error executing code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to execute code';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
