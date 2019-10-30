import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent } from '@testing-library/react';
import { TranslateProvider, useTranslate } from '../src';

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
    orange: {
      it: 'Arancia',
      en: 'Orange',
    },
    strawberry: {
      en: ['1 strawberry', '2+ strawberries', '0 strawberries'],
      it: ['1 ciliegia', '2+ ciliegie', '0 ciliegie'],
    },
  },
};

function Message({ id, count }: { id: string; count?: number }) {
  const { t } = useTranslate();
  return <p>{t(id, { count })}</p>;
}

function MessageSub({ id, count }: { id: string; count?: number }) {
  const { withPrefix } = useTranslate();
  const sub = withPrefix('sub');
  return <p>{sub(id, { count })}</p>;
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
        <Message id="pear" />
      </Provider>
    );

    expect(getByText('Pera')).toBeInTheDocument();
  });

  it('translates with sub', () => {
    const { getByText } = render(
      <Provider>
        <Message id="sub.strawberry" />
        <MessageSub id="orange" />
      </Provider>
    );

    expect(getByText('1 ciliegia')).toBeInTheDocument();
    expect(getByText('Arancia')).toBeInTheDocument();
  });

  it('translates with plural count', () => {
    const { getByText } = render(
      <Provider>
        <Message id="apple" count={2} />
        <MessageSub id="strawberry" count={10} />
      </Provider>
    );

    expect(getByText('Mele')).toBeInTheDocument();
    expect(getByText('2+ ciliegie')).toBeInTheDocument();
  });

  it('translates with 0 count', () => {
    const { getByText } = render(
      <Provider>
        <MessageSub id="strawberry" count={0} />
      </Provider>
    );

    expect(getByText('0 ciliegie')).toBeInTheDocument();
  });

  it('translates possible errors', () => {
    const { getByText } = render(
      <Provider>
        <Message id="pear" count={0} />
        <Message id="sub.apple" count={5} />
      </Provider>
    );

    expect(getByText('Pera')).toBeInTheDocument();
    expect(getByText('sub.apple')).toBeInTheDocument();
  });

  it('translates and change language', () => {
    const { getByText } = render(
      <Provider>
        <Message id="pear" />
        <MessageSub id="orange" />
        <MessageSub id="strawberry" count={10} />
        <ChangeLanguage language="en" />
      </Provider>
    );

    expect(getByText('Pera')).toBeInTheDocument();
    expect(getByText('Arancia')).toBeInTheDocument();
    expect(getByText('2+ ciliegie')).toBeInTheDocument();

    fireEvent.click(getByText(/change/i));

    expect(getByText('Pear')).toBeInTheDocument();
    expect(getByText('Orange')).toBeInTheDocument();
    expect(getByText('2+ strawberries')).toBeInTheDocument();
  });
});
