import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, FileText, MessageSquare, Sprout, FileCheck } from "lucide-react";
import VoiceTranslator from "@/components/VoiceTranslator";
import DocumentTranslator from "@/components/DocumentTranslator";
import ChatInterface from "@/components/ChatInterface";
import TextSummarizer from "@/components/TextSummarizer";

const Index = () => {
  const [activeTab, setActiveTab] = useState("voice");

  return (
    <div className="min-h-screen bg-gradient-earth">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AgriBasha</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Multilingual Agriculture Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card shadow-soft">
            <TabsTrigger 
              value="voice" 
              className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <Mic className="w-5 h-5" />
              <span className="text-sm font-medium">Voice</span>
            </TabsTrigger>
            <TabsTrigger 
              value="document"
              className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Document</span>
            </TabsTrigger>
            <TabsTrigger 
              value="chat"
              className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium">Chat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="brief"
              className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <FileCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Brief</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="animate-fade-in">
            <VoiceTranslator />
          </TabsContent>

          <TabsContent value="document" className="animate-fade-in">
            <DocumentTranslator />
          </TabsContent>

          <TabsContent value="chat" className="animate-fade-in">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="brief" className="animate-fade-in">
            <TextSummarizer />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-border bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Bhashini API • Connecting farmers with agricultural experts</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
