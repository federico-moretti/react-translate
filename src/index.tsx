import React from 'react';
import get from 'lodash.get';

type TranslationBase = { [language: string]: string };
type TranslationWithPlural = { [language: string]: string[] };
type Translation = TranslationBase | TranslationWithPlural;
type Translations = { [key: string]: Translation | Translations };

type Dispatch = (language: string) => void;
type TranslateProviderProps = {
  defaultLanguage?: string;
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
  defaultLanguage = defaultLanguage || window.navigator.language;
  defaultLanguage = defaultLanguage.substring(0, 2);
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

type TranslateParams = {
  count?: number;
};

function useTranslate() {
  const { language, translations } = useTranslateState();
  const setLanguage = useTranslateDispatch();

  function checkMissingTranslations(
    translations: unknown,
    languages: string[]
  ) {
    // TODO: check if the translations have the same keys
    return false;
  }

  function withPrefix(prefix: string) {
    return (id: string, params?: TranslateParams) => {
      return t(prefix + '.' + id, params);
    };
  }

  function t(id: string, params?: TranslateParams): string {
    const translation = get(translations, id);

    if (isTranslation(translation, language)) {
      if (isTranslationBase(translation, language)) {
        return checkValueThenReturn(translation[language], id);
      } else if (params && params.count && params.count > 1) {
        return checkValueThenReturn(translation[language][1], id);
      } else if (params && params.count === 0) {
        return checkValueThenReturn(translation[language][2], id);
      } else {
        return checkValueThenReturn(translation[language][0], id);
      }
    }

    return checkValueThenReturn(undefined, id);
  }

  return { t, withPrefix, setLanguage, checkMissingTranslations };
}

function checkValueThenReturn(t: undefined | string, id: string) {
  if (t) return t;
  console.warn(`[Translate] Missing id: ${id}`);
  return id;
}

function isTranslationBase(
  object: any,
  language: string
): object is TranslationBase {
  return Boolean(object) && typeof object[language] === 'string';
}

function isTranslation(object: any, language: string): object is Translation {
  return Boolean(object && object[language]);
}

export { TranslateProvider, useTranslate };
