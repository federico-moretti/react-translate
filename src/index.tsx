import React from 'react';
import get from 'lodash.get';
import merge from 'lodash.merge';

// TODO: add check if translation is valid

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
  defaultLanguage = defaultLanguage ?? window.navigator.language;
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

  function withPrefix(prefix: string) {
    return (id: string, params?: Omit<TranslateParams, 'prefix'>) => {
      return t(id, { ...params, prefix });
    };
  }

  function t(id: string, params?: TranslateParams): string {
    const p = params?.prefix ? params.prefix + '.' : '';
    const translation = get(translations, p + id);

    if (isTranslation(translation, language)) {
      if (isTranslationBase(translation, language)) {
        return checkValueThenReturn(translation[language], id);
      } else if (params?.count && params.count > 1) {
        return checkValueThenReturn(translation[language][1], id);
      } else if (params?.count === 0) {
        return checkValueThenReturn(translation[language][2], id);
      } else {
        return checkValueThenReturn(translation[language][0], id);
      }
    }

    return checkValueThenReturn(undefined, id);
  }

  return { t, withPrefix, setLanguage };
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
  return Boolean(object?.[language]);
}

type TProps = {
  id: string;
  type?: keyof React.ReactHTML;
  prefix?: string;
} & TranslateParams;
function T(props: TProps) {
  const { id, type = React.Fragment, ...params } = props;
  const { t } = useTranslate();
  return React.createElement(type, undefined, t(id, params));
}

type TranslationsWithoutLanguage =
  | string
  | string[]
  | { [key: string]: TranslationsWithoutLanguage };
function addLanguageToTranslations(
  translations: TranslationsWithoutLanguage,
  language: string
) {
  const obj: Translations = {};
  Object.entries(translations).forEach(([key, value]) => {
    obj[key] = {};
    if (typeof value === 'string' || Array.isArray(value)) {
      obj[key][language] = value;
    } else if (typeof value === 'object') {
      obj[key] = addLanguageToTranslations(value, language);
    }
  });
  return obj;
}

function mergeTranslations(
  array: {
    language: string;
    translations: TranslationsWithoutLanguage;
  }[]
) {
  const res = array.map(({ language, translations }) =>
    addLanguageToTranslations(translations, language)
  );
  return res.reduce((acc, rec) => (acc = merge(acc, rec)), {});
}

export { TranslateProvider, useTranslate, T, mergeTranslations };
