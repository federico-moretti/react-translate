import React from 'react';
import get from 'lodash.get';
import merge from 'lodash.merge';

// TODO: add check if translation is valid

type TranslationBase = { [language: string]: string };
type TranslationWithPlural = { [language: string]: string[] };
export type Translation = TranslationBase | TranslationWithPlural;
export type Translations = { [key: string]: Translation | Translations };

type Dispatch = (language: string) => void;
type TranslateProviderProps = {
  translations: Translations;
  children: React.ReactNode;
  fallbackLanguage?: string;
  defaultLanguage?: string;
  suppressWarnings?: boolean;
};
type State = {
  language: string;
  translations: Translations;
  fallbackLanguage?: string;
  suppressWarnings?: boolean;
};

const TranslateStateContext = React.createContext<State | undefined>(undefined);
const TranslateDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

function TranslateProvider({
  defaultLanguage,
  fallbackLanguage,
  suppressWarnings,
  translations,
  children,
}: TranslateProviderProps) {
  defaultLanguage = defaultLanguage ?? window.navigator.language;
  const [language, setLanguage] = React.useState(defaultLanguage);

  return (
    <TranslateStateContext.Provider
      value={{ language, translations, fallbackLanguage, suppressWarnings }}
    >
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
  const {
    language,
    translations,
    fallbackLanguage,
    suppressWarnings,
  } = useTranslateState();
  const setLanguage = useTranslateDispatch();

  function withPrefix(prefix: string) {
    return (id: string, params?: Omit<TranslateParams, 'prefix'>) => {
      return t(id, { ...params, prefix });
    };
  }

  function t(id: string, params?: TranslateParams): string {
    const p = params?.prefix ? params.prefix + '.' : '';
    const translationObject = get(translations, p + id);
    let translation: string | undefined = undefined;

    if (isTranslation(translationObject, language)) {
      if (isTranslationBase(translationObject, language)) {
        translation = translationObject[language];
      } else if (params?.count && params.count > 1) {
        translation = translationObject[language][1];
      } else if (params?.count === 0) {
        translation = translationObject[language][2];
      } else {
        translation = translationObject[language][0];
      }
    } else if (
      fallbackLanguage &&
      isTranslation(translationObject, fallbackLanguage)
    ) {
      if (isTranslationBase(translationObject, fallbackLanguage)) {
        translation = translationObject[fallbackLanguage];
      } else if (params?.count && params.count > 1) {
        translation = translationObject[fallbackLanguage][1];
      } else if (params?.count === 0) {
        translation = translationObject[fallbackLanguage][2];
      } else {
        translation = translationObject[fallbackLanguage][0];
      }
    }

    return checkValueThenReturn(translation, id, suppressWarnings);
  }

  return { t, withPrefix, setLanguage, language };
}

function checkValueThenReturn(
  t: undefined | string,
  id: string,
  suppressWarnings?: boolean
) {
  if (t) return t;
  if (!suppressWarnings) console.warn(`[Translate] Missing id: ${id}`);
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
