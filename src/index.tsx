import * as React from 'react';

type Translation = {
  default: string;
  plural: string;
};

type Translations = Record<
  string,
  Record<string, Translation | string | Record<string, string | Translation>>
>;

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
  prefix?: string;
};

function useTranslate() {
  const { language, translations } = useTranslateState();
  const setLanguage = useTranslateDispatch();

  function checkMissingTranslations(translations: Translations) {
    // TODO: check if the translations have the same keys
    return false;
  }

  function withPrefix(prefix: string) {
    return (id: string, params?: TranslateParams) => {
      prefix = (params && params.prefix) || prefix;
      return t(id, { count: params && params.count, prefix });
    };
  }

  function t(id: string, params?: TranslateParams): string {
    const base = translations[language];
    const baseWithId = base[id];

    if (typeof baseWithId === 'string') {
      return baseWithId;
    } else if (isTranslation(baseWithId)) {
      if (params && params.count && params.count > 1) {
        return baseWithId.plural;
      }
      return baseWithId.default;
    }

    if (params && params.prefix && base[params.prefix]) {
      const baseWithPrefix = base[params.prefix];

      if (
        typeof baseWithPrefix !== 'string' &&
        !isTranslation(baseWithPrefix)
      ) {
        const baseWithPrefixAndId = baseWithPrefix[id];
        if (typeof baseWithPrefixAndId === 'string') {
          return baseWithPrefixAndId;
        } else {
          if (params && params.count && params.count > 1) {
            return baseWithPrefixAndId.plural;
          }
          return baseWithPrefixAndId.default;
        }
      }
    }

    console.warn(`[Translate] Missing id: ${id}`);
    return id;
  }

  return { t, withPrefix, setLanguage, checkMissingTranslations };
}

function isTranslation(object: any): object is Translation {
  return Boolean(object && object.default);
}

export { TranslateProvider, useTranslate };
