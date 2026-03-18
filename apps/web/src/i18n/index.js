import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English namespaces
import enCommon from './en/common.json';
import enHome from './en/home.json';
import enAbout from './en/about.json';
import enIdeas from './en/ideas.json';
import enFlybot from './en/flybot.json';
import enPrompts from './en/prompts.json';
import enAuth from './en/auth.json';
import enScoring from './en/scoring.json';
import enLibrary from './en/library.json';
import enExplore from './en/explore.json';
import enTemplates from './en/templates.json';

// Portuguese namespaces
import ptCommon from './pt-BR/common.json';
import ptHome from './pt-BR/home.json';
import ptAbout from './pt-BR/about.json';
import ptIdeas from './pt-BR/ideas.json';
import ptFlybot from './pt-BR/flybot.json';
import ptPrompts from './pt-BR/prompts.json';
import ptAuth from './pt-BR/auth.json';
import ptScoring from './pt-BR/scoring.json';
import ptLibrary from './pt-BR/library.json';
import ptExplore from './pt-BR/explore.json';
import ptTemplates from './pt-BR/templates.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        about: enAbout,
        ideas: enIdeas,
        flybot: enFlybot,
        prompts: enPrompts,
        auth: enAuth,
        scoring: enScoring,
        library: enLibrary,
        explore: enExplore,
        templates: enTemplates,
      },
      'pt-BR': {
        common: ptCommon,
        home: ptHome,
        about: ptAbout,
        ideas: ptIdeas,
        flybot: ptFlybot,
        prompts: ptPrompts,
        auth: ptAuth,
        scoring: ptScoring,
        library: ptLibrary,
        explore: ptExplore,
        templates: ptTemplates,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
    // Map pt, pt-BR, pt-PT all to pt-BR
    load: 'currentOnly',
    supportedLngs: ['en', 'pt-BR'],
    nonExplicitSupportedLngs: false,
  });

// Normalize any Portuguese variant to pt-BR
const lang = i18n.language;
if (lang && lang.startsWith('pt') && lang !== 'pt-BR') {
  i18n.changeLanguage('pt-BR');
}

// Set html lang attribute on init and language change
function updateHtmlLang(lng) {
  document.documentElement.lang = lng === 'pt-BR' ? 'pt-BR' : 'en';
}
updateHtmlLang(i18n.language);
i18n.on('languageChanged', updateHtmlLang);

export default i18n;
