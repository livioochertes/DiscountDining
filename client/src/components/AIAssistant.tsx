import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Bot, User, X, Minimize2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

interface AIAssistantProps {
  context?: {
    restaurants?: any[];
    customerPreferences?: {
      cuisine?: string;
      priceRange?: string;
      location?: string;
    };
  };
}

export function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const getWelcomeMessage = () => {
    const welcomeMessages = {
      'en': "Hi! I'm your EatOff dining assistant. I can help you discover restaurants, explain voucher packages, and find the perfect dining experience. What would you like to know?",
      'es': "¡Hola! Soy tu asistente gastronómico de EatOff. Puedo ayudarte a descubrir restaurantes, explicar paquetes de vouchers y encontrar la experiencia gastronómica perfecta. ¿Qué te gustaría saber?",
      'fr': "Salut! Je suis votre assistant culinaire EatOff. Je peux vous aider à découvrir des restaurants, expliquer les forfaits de bons et trouver l'expérience culinaire parfaite. Que souhaitez-vous savoir?",
      'de': "Hallo! Ich bin Ihr EatOff-Dining-Assistent. Ich kann Ihnen helfen, Restaurants zu entdecken, Voucher-Pakete zu erklären und das perfekte kulinarische Erlebnis zu finden. Was möchten Sie wissen?",
      'it': "Ciao! Sono il tuo assistente gastronomico EatOff. Posso aiutarti a scoprire ristoranti, spiegare i pacchetti voucher e trovare l'esperienza culinaria perfetta. Cosa vorresti sapere?",
      'ro': "Salut! Sunt asistentul tău culinar EatOff. Te pot ajuta să descoperi restaurante, să explic pachetele de vouchere și să găsești experiența culinară perfectă. Ce ai vrea să știi?"
    };
    return welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages['en'];
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  // Initialize welcome message when language changes
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
  }, [language]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: any }) => {
      const response = await apiRequest('POST', '/api/ai/chat', { 
        message, 
        context, 
        language: language || 'en' 
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Ensure content is always a string, not an object
      let content = data.response || "I'm here to help with your dining questions!";
      if (typeof content !== 'string') {
        content = JSON.stringify(content);
      }
      
      // Ensure suggestions are always strings and filter out objects
      const suggestions = (data.suggestions || [])
        .filter((suggestion: any) => suggestion !== null && suggestion !== undefined)
        .map((suggestion: any) => {
          if (typeof suggestion === 'string') {
            return suggestion;
          } else if (typeof suggestion === 'object') {
            // If it's an object, try to extract meaningful text or skip it
            if (suggestion.text || suggestion.name || suggestion.title) {
              return suggestion.text || suggestion.name || suggestion.title;
            }
            return null; // Skip objects without meaningful text
          } else {
            return String(suggestion);
          }
        })
        .filter((suggestion: string | null) => suggestion !== null && suggestion.length > 0);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: content,
        suggestions: suggestions,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "I'm having trouble right now, but I'm here to help! Please try asking me again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    chatMutation.mutate({ message, context });
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 shadow-xl z-50 transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-[500px]'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">EatOff Assistant</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-[400px]">
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex items-start gap-2 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[280px] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-8'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="ml-10 space-y-1">
                      <p className="text-xs text-muted-foreground">Quick suggestions:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => {
                          // Final safety check to ensure suggestion is a string
                          const suggestionText = typeof suggestion === 'string' ? suggestion : String(suggestion);
                          return (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                              onClick={() => handleSuggestionClick(suggestionText)}
                            >
                              {suggestionText}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <Separator className="my-3" />
          
          <div className="flex gap-2">
            <Input
              placeholder="Ask me about restaurants, vouchers, or recommendations..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              disabled={chatMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || chatMutation.isPending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}