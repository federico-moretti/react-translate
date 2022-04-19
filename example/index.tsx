import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TranslateProvider, useTranslate } from '../src/index';

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
    twice: {
      orange: {
        it: 'Arancia',
        en: 'Orange',
      },
    },
    strawberry: {
      en: ['Strawberry', 'Strawberries', 'No strawberries'],
      it: ['Ciliegia', 'Ciliegie', 'Zero ciliegie'],
    },
  },
};

const App = () => {
  const { t, setLanguage, withPrefix } = useTranslate();
  const sub = withPrefix('sub');

  return (
    <div>
      <p>{t('pear').toLowerCase()}</p>
      <p>{t('pear', { returnIdIfMissing: false })?.toLowerCase()}</p>
      <p>{t('apple', { count: 2 }).toLowerCase()}</p>
      <br />
      <p>{t('sub.strawberry')}</p>
      <p>{t('sub.strawberry', { count: 0 })}</p>
      <p>{t('sub.twice.orange', { count: 0 })}</p>
      <br />
      <p>{sub('strawberry')}</p>
      <p>{sub('strawberry', { count: 0 })}</p>
      <p>{sub('twice.orange', { count: 0 })}</p>
      <br />
      <p>{t('banana')}</p>
      <p>{t('banana', { count: 0 })}</p>
      <p>{t('apple.golden', { count: 10 })}</p>
      <div>
        <button onClick={() => setLanguage('it')}>Change to it</button>
        <button onClick={() => setLanguage('en')}>Change to en</button>
        <button onClick={() => setLanguage('de')}>Change to de</button>
      </div>
    </div>
  );
};

ReactDOM.render(
  <TranslateProvider defaultLanguage="it" fallbackLanguage="en" translations={translations}>
    <App />
  </TranslateProvider>,
  document.getElementById('root')
);
