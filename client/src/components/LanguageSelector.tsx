import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, languageNames, type Language } from '@/contexts/LanguageContext';

const languageFlags: Record<Language, string> = {
  en: '🇬🇧',
  es: '🇪🇸', 
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  ro: '🇷🇴'
};

interface LanguageSelectorProps {
  variant?: 'header' | 'profile';
}

export default function LanguageSelector({ variant = 'header' }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  if (variant === 'profile') {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.language}</label>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center">
                <span className="text-lg mr-2">{languageFlags[language]}</span>
                {languageNames[language]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-full z-[60] language-selector-dropdown">
            {Object.entries(languageNames).map(([code, name]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => handleLanguageChange(code as Language)}
                className={language === code ? 'bg-gray-100' : ''}
              >
                <span className="flex items-center">
                  <span className="text-lg mr-2">{languageFlags[code as Language]}</span>
                  {name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
          <span className="text-lg">{languageFlags[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[60] language-selector-dropdown">
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className={language === code ? 'bg-gray-100' : ''}
          >
            <span className="flex items-center">
              <span className="text-lg mr-2">{languageFlags[code as Language]}</span>
              {name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}