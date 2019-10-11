import * as React from 'react';

type Translations = Record<
  string,
  Record<string, string | Record<string, string>>
>;
type Dispatch = (language: string) => void;
type TranslateProviderProps = {
  defaultLanguage: string;
  translations: Translations;
  children: React.ReactNode;
};
type State = {
  language: string;
  translations: Translations;
};

const TranslateStateContext = React.createContext<State | undefined>(undefined);
const TranslateDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

function TranslateProvider({
  defaultLanguage,
  translations,
  children,
}: TranslateProviderProps) {
  const [language, setLanguage] = React.useState(defaultLanguage);

  return (
    <TranslateStateContext.Provider value={{ language, translations }}>
      <TranslateDispatchContext.Provider value={setLanguage}>
        {children}
      </TranslateDispatchContext.Provider>
    </TranslateStateContext.Provider>
  );
}

function useTranslateState() {
  const context = React.useContext(TranslateStateContext);
  if (context === undefined) {
    throw new Error(
      'useTranslateState must be used within a TranslateProvider'
    );
  }
  return context;
}

function useTranslateDispatch() {
  const context = React.useContext(TranslateDispatchContext);
  if (context === undefined) {
    throw new Error(
      'useTranslateDispatch must be used within a TranslateProvider'
    );
  }
  return context;
}

function useTranslate() {
  const { language, translations } = useTranslateState();
  const setLanguage = useTranslateDispatch();

  function checkMissingTranslations(translations: Translations) {
    // TODO: check if the translations have the same keys
    return true;
  }

  function t(id: string) {
    const idSplit = id.split('.');
    const componentName = translations[language][idSplit[0]];
    if (idSplit.length === 2 && typeof componentName !== 'string') {
      return componentName[idSplit[1]];
    }
    return translations[language][id];
  }
  return { t, setLanguage, checkMissingTranslations };
}

export { TranslateProvider, useTranslate };
