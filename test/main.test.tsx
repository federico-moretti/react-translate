import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent } from '@testing-library/react';
import { TranslateProvider, useTranslate } from '../src';

const translations = {
  it: {
    hello: 'Ciao!',
    apple: {
      default: 'Mela',
      plural: 'Mele',
    },
    intro: {
      how: 'Come va?',
      notification: {
        default: 'Hai una notifica!',
        plural: 'Hai più notifiche!',
      },
    },
  },
  en: {
    hello: 'Hello!',
    apple: {
      default: 'Apple',
      plural: 'Apples',
    },
    intro: {
      how: 'How are you?',
      notification: {
        default: 'You have one notification!',
        plural: 'You have multiple notifications!',
      },
    },
  },
};

function Message({ id, count }: { id: string; count?: number }) {
  const { t } = useTranslate();
  return <p>{t(id, { count })}</p>;
}

function MessageIntro({ id, count }: { id: string; count?: number }) {
  const { withPrefix } = useTranslate();
  const tIntro = withPrefix('intro');
  return <p>{tIntro(id, { count })}</p>;
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

describe('Translate', () => {
  it('translates simple text', () => {
    const { getByText } = render(
      <Provider>
        <Message id="hello" />
        <MessageIntro id="how" />
      </Provider>
    );

    expect(getByText('Ciao!')).toBeInTheDocument();
    expect(getByText('Come va?')).toBeInTheDocument();
  });

  it('translates with default count', () => {
    const { getByText } = render(
      <Provider>
        <Message id="hello" />
        <Message id="apple" />
        <MessageIntro id="notification" count={1} />
      </Provider>
    );

    expect(getByText('Ciao!')).toBeInTheDocument();
    expect(getByText('Mela')).toBeInTheDocument();
    expect(getByText('Hai una notifica!')).toBeInTheDocument();
  });

  it('translates with plural count', () => {
    const { getByText } = render(
      <Provider>
        <Message id="hello" />
        <Message id="apple" count={2} />
        <MessageIntro id="notification" count={10} />
      </Provider>
    );

    expect(getByText('Ciao!')).toBeInTheDocument();
    expect(getByText('Mele')).toBeInTheDocument();
    expect(getByText('Hai più notifiche!')).toBeInTheDocument();
  });

  it('translates and change language', () => {
    const { getByText } = render(
      <Provider>
        <Message id="hello" />
        <MessageIntro id="how" />
        <MessageIntro id="notification" count={10} />
        <ChangeLanguage language="en" />
      </Provider>
    );

    expect(getByText('Ciao!')).toBeInTheDocument();
    expect(getByText('Come va?')).toBeInTheDocument();
    expect(getByText('Hai più notifiche!')).toBeInTheDocument();

    fireEvent.click(getByText(/change/i));

    expect(getByText('Hello!')).toBeInTheDocument();
    expect(getByText('How are you?')).toBeInTheDocument();
    expect(getByText('You have multiple notifications!')).toBeInTheDocument();
  });
});
