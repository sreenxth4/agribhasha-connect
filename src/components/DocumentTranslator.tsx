import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: "te", name: "Telugu - తెలుగు" },
  { code: "hi", name: "Hindi - हिन्दी" },
  { code: "ta", name: "Tamil - தமிழ்" },
  { code: "kn", name: "Kannada - ಕನ್ನಡ" },
  { code: "en", name: "English" },
];

const DocumentTranslator = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState("en");
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload JPG, PNG, or PDF files only",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setExtractedText("");
    setTranslatedText("");
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      reader.onloadend = async () => {
        const base64File = reader.result?.toString().split(',')[1];
        
        if (!base64File) {
          throw new Error("Failed to read file");
        }

        // Step 1: OCR to extract text
        toast({
          title: "Extracting Text...",
          description: "Reading document content",
        });

        const { data: ocrData, error: ocrError } = await supabase.functions.invoke('document-ocr', {
          body: { file: base64File }
        });

        if (ocrError) throw ocrError;
        const extracted = ocrData.extractedText;
        setExtractedText(extracted);

        // Step 2: Translate
        toast({
          title: "Translating...",
          description: "Converting to target language",
        });

        // Detect source language (simple heuristic - could be improved)
        const sourceLang = /[ఁ-౯]/.test(extracted) ? 'te' 
                          : /[ँ-ॿ]/.test(extracted) ? 'hi'
                          : /[ஂ-௺]/.test(extracted) ? 'ta'
                          : /[ಀ-ೲ]/.test(extracted) ? 'kn'
                          : 'en';

        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-text', {
          body: { 
            text: extracted, 
            sourceLang, 
            targetLang 
          }
        });

        if (translateError) throw translateError;
        setTranslatedText(translateData.translatedText);

        toast({
          title: "Success!",
          description: "Document processed successfully",
        });
      };
    } catch (error) {
      console.error("Error processing document:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTranslation = () => {
    if (!translatedText) return;

    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Translation saved to file",
    });
  };

  return (
    <Card className="p-6 shadow-soft">
      <div className="space-y-6">
        {/* Language Selection */}
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

        {/* File Upload */}
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <input
            type="file"
            id="file-upload"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, or PDF (max 5MB)
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Process Button */}
        {selectedFile && (
          <Button
            onClick={processDocument}
            disabled={isProcessing}
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
                Extract & Translate
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {extractedText && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Extracted Text</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{extractedText}</p>
            </div>

            {translatedText && (
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-primary">Translated Text</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={downloadTranslation}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{translatedText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentTranslator;
