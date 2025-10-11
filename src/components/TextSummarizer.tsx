import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Copy, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi - हिन्दी" },
  { code: "bn", name: "Bengali - বাংলা" },
  { code: "te", name: "Telugu - తెలుగు" },
  { code: "mr", name: "Marathi - मराठी" },
  { code: "ta", name: "Tamil - தமிழ்" },
  { code: "gu", name: "Gujarati - ગુજરાતી" },
  { code: "ur", name: "Urdu - اردو" },
  { code: "kn", name: "Kannada - ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam - മലയാളം" },
  { code: "pa", name: "Punjabi - ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia - ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese - অসমীয়া" },
  { code: "mai", name: "Maithili - मैथिली" },
  { code: "sa", name: "Sanskrit - संस्कृतम्" },
  { code: "kok", name: "Konkani - कोंकणी" },
  { code: "sd", name: "Sindhi - سنڌي" },
  { code: "ne", name: "Nepali - नेपाली" },
  { code: "mni", name: "Manipuri - ꯃꯩꯇꯩꯂꯣꯟ" },
  { code: "brx", name: "Bodo - बर'" },
];

const TextSummarizer = () => {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryLength, setSummaryLength] = useState("medium");
  const [targetLang, setTargetLang] = useState("en");
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to summarize",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSummary("");
    setTranslatedSummary("");

    try {
      // Step 1: Generate summary
      toast({
        title: "Summarizing...",
        description: "Creating a concise summary of your text",
      });

      const { data: summaryData, error: summaryError } = await supabase.functions.invoke('summarize-text', {
        body: { 
          text: inputText,
          length: summaryLength
        }
      });

      if (summaryError) throw summaryError;
      const generatedSummary = summaryData.summary;
      setSummary(generatedSummary);

      // Step 2: Translate if not English
      if (targetLang !== 'en') {
        toast({
          title: "Translating...",
          description: "Converting summary to target language",
        });

        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-text', {
          body: { 
            text: generatedSummary, 
            sourceLang: 'en', 
            targetLang 
          }
        });

        if (translateError) throw translateError;
        setTranslatedSummary(translateData.translatedText);
      }

      toast({
        title: "Success!",
        description: "Summary generated successfully",
      });
    } catch (error) {
      console.error("Error summarizing:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copySummary = () => {
    const textToCopy = translatedSummary || summary;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard",
    });
  };

  const speakSummary = async () => {
    const textToSpeak = translatedSummary || summary;
    const language = translatedSummary ? targetLang : 'en';

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: textToSpeak, language }
      });

      if (error) throw error;

      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      toast({
        title: "Playback Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 shadow-soft">
      <div className="space-y-6">
        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Summary Length</label>
            <Select value={summaryLength} onValueChange={setSummaryLength}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (2-3 sentences)</SelectItem>
                <SelectItem value="medium">Medium (5-7 sentences)</SelectItem>
                <SelectItem value="long">Long (Detailed)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Translate to</label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Input Text */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Enter Text to Summarize
          </label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type your text here... (Articles, documents, reports, etc.)"
            className="min-h-[200px] bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {inputText.length} characters
          </p>
        </div>

        {/* Summarize Button */}
        <Button
          onClick={handleSummarize}
          disabled={!inputText.trim() || isProcessing}
          className="w-full bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Generate Summary
            </>
          )}
        </Button>

        {/* Results */}
        {summary && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-primary">
                  {translatedSummary ? "Translated Summary" : "Summary"}
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={speakSummary}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copySummary}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {translatedSummary || summary}
              </p>
            </div>

            {translatedSummary && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Original Summary (English)</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TextSummarizer;
