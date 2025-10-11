import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: "te", name: "Telugu - తెలుగు" },
  { code: "hi", name: "Hindi - हिन्दी" },
  { code: "ta", name: "Tamil - தமிழ்" },
  { code: "kn", name: "Kannada - ಕನ್ನಡ" },
  { code: "en", name: "English" },
];

const VoiceTranslator = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState("te");
  const [targetLang, setTargetLang] = useState("en");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording...",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to use voice translation",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setSourceText("");
    setTranslatedText("");

    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to convert audio");
        }

        // Step 1: Speech to Text
        toast({
          title: "Processing...",
          description: "Converting speech to text",
        });

        const { data: asrData, error: asrError } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64Audio, language: sourceLang }
        });

        if (asrError) throw asrError;
        const transcribedText = asrData.text;
        setSourceText(transcribedText);

        // Step 2: Translate
        toast({
          title: "Translating...",
          description: "Converting to target language",
        });

        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-text', {
          body: { 
            text: transcribedText, 
            sourceLang, 
            targetLang 
          }
        });

        if (translateError) throw translateError;
        const translated = translateData.translatedText;
        setTranslatedText(translated);

        // Step 3: Text to Speech
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
          body: { text: translated, language: targetLang }
        });

        if (ttsError) throw ttsError;
        
        // Play audio
        const audioBase64 = ttsData.audio;
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audio.play();

        toast({
          title: "Success!",
          description: "Translation complete",
        });
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakTranslation = async () => {
    if (!translatedText) return;

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: translatedText, language: targetLang }
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
        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">From</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
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
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">To</label>
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

        {/* Recording Button */}
        <div className="flex justify-center py-8">
          <Button
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`
              relative w-24 h-24 rounded-full transition-all
              ${isRecording 
                ? 'bg-destructive hover:bg-destructive/90 shadow-glow' 
                : 'bg-gradient-primary hover:opacity-90 shadow-soft'
              }
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isRecording ? (
              <>
                <div className="absolute inset-0 rounded-full bg-destructive pulse-ring" />
                <MicOff className="w-10 h-10 text-white relative z-10" />
              </>
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </Button>
        </div>

        {/* Status Text */}
        <p className="text-center text-sm text-muted-foreground">
          {isRecording 
            ? "Listening... Tap to stop" 
            : isProcessing 
            ? "Processing your speech..." 
            : "Tap microphone to start speaking"}
        </p>

        {/* Results */}
        {sourceText && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Original</h3>
              <p className="text-foreground">{sourceText}</p>
            </div>

            {translatedText && (
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-primary">Translated</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={speakTranslation}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                </div>
                <p className="text-foreground">{translatedText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default VoiceTranslator;
