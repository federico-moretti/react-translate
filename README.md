# react-translate

Translate your React app without any hassle and with no setup!

## Features

- Translate function
- Translate component
- Allow nested translations
- Singular, plural and zero based on count
- Lightweight (~2KB minified)
- Built with TypeScript

## Installing

Import as a module

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
      en: ['1 strawberry', '2+ strawberries', '0 strawberries'],
      it: ['1 ciliegia', '2+ ciliegie', '0 ciliegie'],
    },
  },
};

function App() {
  const { t, setLanguage, withPrefix } = useTranslate();
  const sub = withPrefix('sub');

  return (
    <div>
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

## API

#### `t(id: string, params?: TranslateParams): string`

It returns the translation as a string.

- `id`
  - use dot notation to get nested translations
- `params`:
  - `count?: number`
    - select singular, plural or zero
  - `prefix?: string`
    - allows to get to nested translations

#### `setLanguage(language: string): void`

Changes the language.

#### `withPrefix(prefix: string): function`

It returns `t(id: string, params: { count: number }): string`

This is useful if you have to use a lot of translations with the same prefix, for example in a page.

```js
const t = withPrefix('dashboard');
const dashboardTitle = t('title'); // 'dashboard.title'
```

#### `<T />`

Creates a text node (or another element) with the translation.

- `id: string`
- `type: keyof React.ReactHTML`
  - if `type` equals `p` it will return `<p>translation</p>`
- `prefix: string`
- `count: number`

#### `<TranslateProvider />`

Wrap the app with the provider.

- `language: string`
  - example: `it`
  - defaults to browser language
- `translations: Translations`
  - required

#### Translation object

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
      en: ['1 strawberry', '2+ strawberries', '0 strawberries'],
      it: ['1 ciliegia', '2+ ciliegie', '0 ciliegie'],
    },
  },
};
```

## Licence

[MIT](LICENSE) © [Federico Moretti](https://www.federicomoretti.dev)
