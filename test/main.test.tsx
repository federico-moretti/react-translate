import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent } from '@testing-library/react';
import { TranslateProvider, useTranslate } from '../src';

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

function Message({ id }: { id: string }) {
  const { t } = useTranslate();
  return <p>{t(id)}</p>;
}

function ChangeLanguage({ language }: { language: string }) {
  const { setLanguage } = useTranslate();
  return <button onClick={() => setLanguage(language)}>Change language</button>;
}

function Provider({ children }: { children: React.ReactNode }) {
  return (
    <TranslateProvider defaultLanguage="it" translations={translations}>
      {children}
    </TranslateProvider>
  );
}

describe('it', () => {
  it('get translations', () => {
    const { getByText } = render(
      <Provider>
        <Message id="hello" />
        <Message id="intro.how" />
      </Provider>
    );

    expect(getByText('Ciao!')).toBeInTheDocument();
    expect(getByText('Come va?')).toBeInTheDocument();
  });

  it('get translations', () => {
    const { getByText } = render(
      <Provider>
        <Message id="hello" />
        <Message id="intro.how" />
        <ChangeLanguage language="en" />
      </Provider>
    );

    expect(getByText('Ciao!')).toBeInTheDocument();
    expect(getByText('Come va?')).toBeInTheDocument();
    fireEvent.click(getByText(/change/i));
    expect(getByText('Hello!')).toBeInTheDocument();
    expect(getByText('How are you?')).toBeInTheDocument();
  });
});
