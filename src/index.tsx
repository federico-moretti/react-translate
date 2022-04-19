import React from 'react';
import get from 'lodash.get';
import merge from 'lodash.merge';

// TODO: add check if translation is valid

type TranslationBase = { [language: string]: string };
type TranslationWithPlural = { [language: string]: string[] };
export type Translation = TranslationBase | TranslationWithPlural;
export type Translations = { [key: string]: Translation | Translations };

type Dispatch = { setLanguage: (language: string) => void };
type TranslateProviderProps = {
  translations: Translations;
  children: React.ReactNode;
  fallbackLanguage?: string;
  defaultLanguage?: string;
  suppressWarnings?: boolean;
  showIds?: boolean;
};
type State = {
  language: string;
  translations: Translations;
  fallbackLanguage?: string;
  suppressWarnings?: boolean;
  showIds?: boolean;
};

const TranslateStateContext = React.createContext<State | undefined>(undefined);
const TranslateDispatchContext = React.createContext<Dispatch | undefined>(undefined);

function TranslateProvider({
  defaultLanguage,
  fallbackLanguage,
  suppressWarnings,
  showIds,
  translations,
  children,
}: TranslateProviderProps) {
  defaultLanguage = defaultLanguage ?? window.navigator.language;
  const [language, setLanguage] = React.useState(defaultLanguage);

  return (
    <TranslateStateContext.Provider
      value={{
        language,
        translations,
        fallbackLanguage,
        suppressWarnings,
        showIds,
      }}
    >
      <TranslateDispatchContext.Provider value={{ setLanguage }}>{children}</TranslateDispatchContext.Provider>
    </TranslateStateContext.Provider>
  );
}

function useTranslateState() {
  const context = React.useContext(TranslateStateContext);
  if (context === undefined) {
    throw new Error('useTranslateState must be used within a TranslateProvider');
  }
  return context;
}

function useTranslateDispatch() {
  const context = React.useContext(TranslateDispatchContext);
  if (context === undefined) {
    throw new Error('useTranslateDispatch must be used within a TranslateProvider');
  }
  return context;
}

type TranslateParams<R extends boolean = true> = {
  count?: number;
  prefix?: string;
  returnIdIfMissing?: boolean;
};

type TranslateFunctionParams<R extends boolean = true> = {
  id: string;
  language: string;
  translations: Translations;
  params?: TranslateParams<R>;
  fallbackLanguage?: string;
  suppressWarnings?: boolean;
  showIds?: boolean;
};

function translate(all: TranslateFunctionParams<false>): string | undefined;
function translate(all: TranslateFunctionParams<true>): string;
function translate({
  id,
  language,
  translations,
  params,
  fallbackLanguage,
  suppressWarnings,
  showIds,
}: TranslateFunctionParams): string | undefined;

function translate({
  id,
  language,
  translations,
  params,
  fallbackLanguage,
  suppressWarnings,
  showIds,
}: TranslateFunctionParams): string | undefined {
  const p = params?.prefix ? params.prefix + '.' : '';

  const returnId = params?.returnIdIfMissing ?? true;

  const countId = params?.count !== undefined ? ` (n. ${params.count})` : '';
  if (showIds) {
    return `${p}${id}${countId}`;
  }

  const translationObject = get(translations, p + id);
  let translation: string | undefined = undefined;
  let usingFallbackLanguage = false;

  if (isTranslation(translationObject, language)) {
    if (isTranslationBase(translationObject, language)) {
      translation = translationObject[language];
    } else if (params?.count && params.count > 1) {
      translation = translationObject[language][1];
      if (translation.includes('%n')) {
        translation = translation.replace(/%n/g, params.count.toString());
      }
    } else if (params?.count === 0) {
      translation = translationObject[language][2];
    } else {
      translation = translationObject[language][0];
    }
  } else if (fallbackLanguage) {
    usingFallbackLanguage = true;
    if (isTranslation(translationObject, fallbackLanguage)) {
      if (isTranslationBase(translationObject, fallbackLanguage)) {
        translation = translationObject[fallbackLanguage];
      } else if (params?.count && params.count > 1) {
        translation = translationObject[fallbackLanguage][1];
        if (translation.includes('%n')) {
          translation = translation.replace(/%n/g, params.count.toString());
        }
      } else if (params?.count === 0) {
        translation = translationObject[fallbackLanguage][2];
      } else {
        translation = translationObject[fallbackLanguage][0];
      }
    }
  }

  checkForWarnings(
    translation,
    p + id,
    language,
    usingFallbackLanguage,
    params?.count,
    fallbackLanguage,
    suppressWarnings
  );

  if (translation) {
    return translation;
  }

  return returnId ? `${p}${id}${countId}` : undefined;
}

interface UseTranslate {
  t(id: string): string;
  t(id: string, params?: TranslateParams<true>): string;
  t(id: string, params?: TranslateParams<false>): string | undefined;
  t(id: string, params?: TranslateParams<boolean>): string | undefined;
  withPrefix(prefix: string): (id: string, params?: Omit<TranslateParams, 'prefix'>) => string | undefined;
  withPrefix(prefix: string): (id: string, params?: Omit<TranslateParams<false>, 'prefix'>) => string | undefined;
  withPrefix(prefix: string): (id: string, params?: Omit<TranslateParams<true>, 'prefix'>) => string;
  setLanguage: (lang: string) => void;
  language: string;
}

function useTranslate(): UseTranslate {
  const { language, translations, fallbackLanguage, suppressWarnings, showIds } = useTranslateState();
  const { setLanguage } = useTranslateDispatch();

  function t(id: string): string;
  function t(id: string, params?: TranslateParams<true>): string;
  function t(id: string, params?: TranslateParams<false>): string | undefined;
  function t(id: string, params?: TranslateParams<boolean>): string | undefined {
    return translate({
      id,
      language,
      translations,
      params,
      fallbackLanguage,
      suppressWarnings,
      showIds,
    });
  }

  const tMemo = React.useCallback(t, [language, translations, fallbackLanguage, suppressWarnings, showIds]);

  const withPrefix = React.useCallback(
    (prefix: string) => {
      function withPrefix(id: string, params?: Omit<TranslateParams, 'prefix'>): string | undefined;
      function withPrefix(id: string, params?: Omit<TranslateParams<false>, 'prefix'>): string | undefined;
      function withPrefix(id: string, params?: Omit<TranslateParams<true>, 'prefix'>): string;
      function withPrefix(id: string, params?: Omit<TranslateParams, 'prefix'>): string | undefined {
        return tMemo(id, { ...params, prefix });
      }
      return withPrefix;
    },
    [tMemo]
  );

  return { t: tMemo, withPrefix, setLanguage, language };
}

function checkForWarnings(
  t: undefined | string,
  id: string,
  language: string,
  usingFallbackLanguage: boolean,
  count?: number,
  fallbackLanguage?: string,
  suppressWarnings?: boolean
): void {
  setTimeout(() => {
    if (!suppressWarnings) {
      const countString = count !== undefined ? `(n. ${count})` : '';

      if (t && usingFallbackLanguage) {
        console.warn(`[T] Missing id but using fallback: ${id} ${countString}(${language})`);
      }
      if (!t && usingFallbackLanguage) {
        console.warn(`[T] Missing id and fallback: ${id} ${countString}(${language} - ${fallbackLanguage})`);
      } else if (!t) {
        console.warn(`[T] Missing id: ${id} ${countString}(${language})`);
      }
    }
  }, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTranslationBase(object: unknown, language: string): object is TranslationBase {
  return isRecord(object) && typeof object[language] === 'string';
}

function isTranslation(object: unknown, language: string): object is Translation {
  return isRecord(object) && Boolean(object[language]);
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

type TranslationsWithoutLanguage = string | string[] | { [key: string]: TranslationsWithoutLanguage };
function addLanguageToTranslations(translations: TranslationsWithoutLanguage, language: string) {
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
  const res = array.map(({ language, translations }) => addLanguageToTranslations(translations, language));
  return res.reduce((acc, rec) => (acc = merge(acc, rec)), {});
}

export { TranslateProvider, useTranslate, T, mergeTranslations, translate };
