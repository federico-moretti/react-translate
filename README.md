# react-translate

Translate your React app without any hassle and with no setup!

## Features

- Translate function
- Translate component
- Allow nested translations
- Singular, plural and zero based on count
- Lightweight (~3KB)
- Built with TypeScript
- ~99% code coverage

## Installing

```bash
npm install @federico.moretti/react-translate
# or
yarn add @federico.moretti/react-translate
```

## Example

Basic usage:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import {
  TranslateProvider,
  useTranslate,
} from '@federico.moretti/react-translate';

const translations = {
  pear: {
    it: 'Pera',
    en: 'Pear',
  },
  apple: {
    it: ['Mela', 'Mele'],
    en: ['Apple', 'Apples'],
  },
  sub: {
    strawberry: {
      en: ['1 strawberry', '%n strawberries', '0 strawberries'],
      it: ['1 ciliegia', '%n ciliegie', '0 ciliegie'],
    },
  },
};

function App() {
  const { t, setLanguage, withPrefix, language } = useTranslate();
  const sub = withPrefix('sub');

  return (
    <div>
      <p>Selected language: {language}</p>
      <p>{t('pear')}</p>
      <p>{t('apple', { count: 2 })}</p>
      <p>{t('sub.strawberry')}</p>
      <p>{sub('strawberry')}</p>
      <div>
        <button onClick={() => setLanguage('it')}>Change to it</button>
        <button onClick={() => setLanguage('en')}>Change to en</button>
      </div>
    </div>
  );
}

ReactDOM.render(
  <TranslateProvider defaultLanguage="en" translations={translations}>
    <App />
  </TranslateProvider>,
  document.getElementById('root')
);
```

[CodeSandbox](https://codesandbox.io/s/react-translate-nw1y6?file=/src/index.tsx)

## API

### `t(id: string, params?: TranslateParams): string`

It returns the translation as a string.

- `id`
  - use dot notation to get nested translations
- `params`:
  - `count?: number`
    - select singular, plural or zero
    - if plural `%n` in a string will be replaced with the `count`
  - `prefix?: string`
    - allows to always get nested translations

### `setLanguage(language: string): void`

It changes the language in the provider.

### `withPrefix(prefix: string): function`

It returns `t()` with the prefix already added.

This is useful if you have to use a lot of translations with the same prefix, for example in a page.

```js
const t = withPrefix('dashboard');
const dashboardTitle = t('title'); // 'dashboard.title'
```

### `<T />`

Creates a text node (or another element) with the translation.

- `id: string`
- `type: keyof React.ReactHTML`
  - if `type` equals `p` it will return `<p>your translation</p>`
- `prefix: string`
- `count: number`

### `<TranslateProvider />`

Wrap the app with the provider.

- `defaultLanguage: string`
  - it defaults to browser language if undefined
  - example: `it-IT`
- `translations: Translations`
  - the translations object
  - required
- `fallbackLanguage: string`
  - if a translation is missing this language will be used
  - example: `en-GB`
- `suppressWarnings: boolean`
  - hides the warnings in the console
- `showIds: boolean`
  - show translation ids

### Translation object

```js
const translations = {
  // basic
  pear: {
    it: 'Pera',
    en: 'Pear',
  },
  apple: {
    // [1, 2+]
    it: ['Mela', 'Mele'],
    en: ['Apple', 'Apples'],
  },
  // nested
  sub: {
    strawberry: {
      // [1, 2+, 0]
      en: ['1 strawberry', '%n strawberries', '0 strawberries'],
      it: ['1 ciliegia', '%n ciliegie', '0 ciliegie'],
    },
  },
};
```

### `translate(object): TranslateFunctionParams`

Same logic of `t()` but exported to be used outside of the React context, for example in e2e tests.

- `object`:
  - `id: string`
    - required
  - `language: string`
    - required
  - `translations: Translations`
    - the translations object
    - required
  - `params: TranslateParams`
    - `count?: number`
      - select singular, plural or zero
      - if plural `%n` in a string will be replaced with the `count`
    - `prefix?: string`
      - allows to always get nested translations
  - `fallbackLanguage: string`
    - if a translation is missing this language will be used
    - example: `en-GB`
  - `suppressWarnings: boolean`
    - hides the warnings in the console
  - `showIds: boolean`
    - show translation ids

### `mergeTranslations(array): Translations`

A function to merge different language files.

- `array: { language: string; translations: TranslationsWithoutLanguage }[]`
  - it will merge the translation using the language

```js
const translationsEn = {
  pear: 'Pear',
  banana: ['Banana', 'Bananas'],
};

const translationsIt = {
  pear: 'Pera',
  banana: ['Banana', 'Banane'],
};

const merged = mergeTranslations([
  { language: 'it', translations: translationsIt },
  { language: 'en', translations: translationsEn },
]);

/* this is how the result will be
{
  pear: { it: 'Pera', en: 'Pear' },
  banana: {
    it: ['Banana', 'Banane'],
    en: ['Banana', 'Bananas'],
  },
};
*/
```

## Coverage

| File      | % Stmts | % Branch | % Funcs | % Lines |
| --------- | ------- | -------- | ------- | ------- |
| All files | 98.97   | 91.67    | 100     | 98.82   |

## Licence

[MIT](LICENSE) © [Federico Moretti](https://www.federicomoretti.dev)
