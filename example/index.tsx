import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TranslateProvider, useTranslate } from '../.';

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
      en: ['1 strawberry', '2+ strawberries', '0 strawberries'],
      it: ['1 ciliegia', '2+ ciliegie', '0 ciliegie'],
    },
  },
};

const App = () => {
  const { t, setLanguage, withPrefix } = useTranslate();
  const sub = withPrefix('sub');
  console.log('render');
  return (
    <div>
      <p>{t('pear')}</p>
      <p>{t('apple', { count: 2 })}</p>
      <br />
      <p>{t('sub.strawberry')}</p>
      <p>{t('sub.strawberry', { count: 0 })}</p>
      <p>{t('sub.twice.orange', { count: 0 })}</p>
      <br />
      <p>{sub('strawberry')}</p>
      <p>{sub('strawberry', { count: 0 })}</p>
      <p>{sub('twice.orange', { count: 0 })}</p>
      <div>
        <button onClick={() => setLanguage('it')}>Change to it</button>
        <button onClick={() => setLanguage('en')}>Change to en</button>
      </div>
    </div>
  );
};

ReactDOM.render(
  <TranslateProvider defaultLanguage="it" translations={translations}>
    <App />
  </TranslateProvider>,
  document.getElementById('root')
);
