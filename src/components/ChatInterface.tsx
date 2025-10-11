import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Volume2, User, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: "te", name: "Telugu - తెలుగు" },
  { code: "hi", name: "Hindi - हिन्दी" },
  { code: "ta", name: "Tamil - தமிழ்" },
  { code: "kn", name: "Kannada - ಕನ್ನಡ" },
  { code: "en", name: "English" },
];

interface Message {
  id: string;
  role: 'farmer' | 'expert';
  originalText: string;
  translatedText?: string;
  language: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [farmerLang, setFarmerLang] = useState("te");
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'farmer',
      originalText: inputText,
      language: farmerLang,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    setIsTranslating(true);

    try {
      // Translate farmer's message to English for expert
      const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-text', {
        body: { 
          text: inputText, 
          sourceLang: farmerLang, 
          targetLang: 'en' 
        }
      });

      if (translateError) throw translateError;

      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, translatedText: translateData.translatedText }
          : msg
      ));

      // Simulate expert reply (in a real app, this would come from a backend/AI)
      setTimeout(async () => {
        const expertReply = getExpertReply(translateData.translatedText);
        
        const expertMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'expert',
          originalText: expertReply,
          language: 'en',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, expertMessage]);

        // Translate expert reply back to farmer's language
        const { data: replyTranslate, error: replyError } = await supabase.functions.invoke('translate-text', {
          body: { 
            text: expertReply, 
            sourceLang: 'en', 
            targetLang: farmerLang 
          }
        });

        if (replyError) throw replyError;

        setMessages(prev => prev.map(msg => 
          msg.id === expertMessage.id 
            ? { ...msg, translatedText: replyTranslate.translatedText }
            : msg
        ));
      }, 1500);

    } catch (error) {
      console.error("Error translating:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate message",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const getExpertReply = (question: string): string => {
    // Simple keyword-based responses (in a real app, use AI)
    const lower = question.toLowerCase();
    
    if (lower.includes('fertilizer') || lower.includes('fertiliser')) {
      return "For paddy cultivation, I recommend using DAP (Diammonium Phosphate) before sowing at 50kg per acre, followed by Urea at 30kg per acre after 30 days. Also apply potash at 25kg per acre during flowering stage.";
    } else if (lower.includes('pest') || lower.includes('insect')) {
      return "To control pests organically, use neem oil spray (5ml per liter of water) every 10 days. For severe infestations, you can use approved pesticides like Chlorpyrifos, but always follow safety guidelines.";
    } else if (lower.includes('water') || lower.includes('irrigation')) {
      return "Paddy fields need to be flooded with 2-3 inches of water for most of the growing season. Drain the field 10-15 days before harvest. Ensure good drainage to prevent waterlogging during heavy rains.";
    } else if (lower.includes('seed') || lower.includes('variety')) {
      return "Popular high-yielding paddy varieties include BPT-5204, MTU-1010, and RNR-15048. Choose varieties suited to your soil type and water availability. Always use certified seeds for best results.";
    } else {
      return "Thank you for your question. For specific agricultural advice, please provide more details about your crop, soil type, and the issue you're facing. I'm here to help you improve your farming practices.";
    }
  };

  const speakMessage = async (text: string, language: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
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
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Farmer's Language</label>
          <Select value={farmerLang} onValueChange={setFarmerLang}>
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

        {/* Chat Messages */}
        <div className="space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto p-4 bg-muted/30 rounded-lg">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
              <p>Start a conversation with an agricultural expert</p>
              <p className="text-sm mt-2">Ask questions about crops, fertilizers, pests, or farming techniques</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'farmer' ? 'justify-start' : 'justify-end'}`}
              >
                {message.role === 'farmer' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
                
                <div className={`flex-1 max-w-[70%] space-y-2`}>
                  <div
                    className={`p-4 rounded-lg ${
                      message.role === 'farmer'
                        ? 'bg-card border border-border'
                        : 'bg-gradient-primary text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium opacity-80">
                        {message.role === 'farmer' ? 'Farmer' : 'Expert'} • {message.language.toUpperCase()}
                      </p>
                      {message.role === 'expert' && message.translatedText && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => speakMessage(message.translatedText!, message.role === 'farmer' ? 'en' : farmerLang)}
                          className="h-6 w-6 p-0 hover:bg-white/20"
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{message.originalText}</p>
                    {message.translatedText && message.translatedText !== message.originalText && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <p className="text-xs opacity-80 mb-1">Translation:</p>
                        <p className="text-sm">{message.translatedText}</p>
                      </div>
                    )}
                  </div>
                </div>

                {message.role === 'expert' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Type your message in ${LANGUAGES.find(l => l.code === farmerLang)?.name.split(' - ')[0]}...`}
            disabled={isTranslating}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputText.trim() || isTranslating}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Import missing icon
import { MessageSquare } from "lucide-react";

export default ChatInterface;
