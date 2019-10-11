import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TranslateProvider, useTranslate } from '../.';

const translations = {
  it: {
    hello: 'Ciao!',
    intro: {
      how: 'Come va?',
    },
  },
  en: {
    hello: 'Hello!',
    intro: {
      how: 'How are you?',
    },
  },
};

const App = () => {
  const { t, setLanguage } = useTranslate();
  console.log('render');
  return (
    <div>
      <p>{t('hello')}</p>
      <p>{t('intro.how')}</p>
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
