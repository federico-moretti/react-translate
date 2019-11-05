import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render as baseRender, fireEvent } from '@testing-library/react';
import { TranslateProvider, useTranslate, T } from '../src';

const consoleSpy = jest.spyOn(global.console, 'warn');

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
    cantaloupe: {
      it: 'Melone',
      en: 'Cantaloupe',
    },
    strawberry: {
      en: ['1 strawberry', '2+ strawberries', '0 strawberries'],
      it: ['1 ciliegia', '2+ ciliegie', '0 ciliegie'],
    },
  },
};

function Sub({ id }: { id: string }) {
  const { withPrefix } = useTranslate();
  const t = withPrefix('sub');
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

function render(ui: React.ReactElement, options?: any) {
  return baseRender(ui, { wrapper: Provider, ...options });
}

describe('Translate', () => {
  it('translates simple text', () => {
    const { getByText } = render(
      <p>
        <T id="pear" />
      </p>
    );
    expect(getByText('Pera')).toBeInTheDocument();
  });

  it('translates with sub', () => {
    const { getByText } = render(
      <>
        <T type="p" id="sub.strawberry" />
        <T type="p" prefix="sub" id="orange" />
        <Sub id="cantaloupe" />
      </>
    );

    expect(getByText('1 ciliegia')).toBeInTheDocument();
    expect(getByText('Arancia')).toBeInTheDocument();
    expect(getByText('Melone')).toBeInTheDocument();
  });

  it('translates with plural count', () => {
    const { getByText } = render(
      <>
        <T type="p" id="apple" count={2} />
        <T type="p" prefix="sub" id="strawberry" count={10} />
      </>
    );

    expect(getByText('Mele')).toBeInTheDocument();
    expect(getByText('2+ ciliegie')).toBeInTheDocument();
  });

  it('translates with 0 count', () => {
    const { getByText } = render(
      <T type="p" prefix="sub" id="strawberry" count={0} />
    );

    expect(getByText('0 ciliegie')).toBeInTheDocument();
  });

  it('translates possible errors', () => {
    const { getByText } = render(
      <>
        <T type="p" id="pear" count={0} />
        <T type="p" id="sub.apple" count={5} />
      </>
    );

    expect(getByText('Pera')).toBeInTheDocument();
    expect(getByText('sub.apple')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Translate] Missing id: sub.apple'
    );

    consoleSpy.mockReset();
  });

  it('translates and change language', () => {
    const { getByText } = render(
      <>
        <T type="p" id="pear" />
        <T type="p" id="sub.orange" />
        <T type="p" prefix="sub" id="strawberry" count={10} />
        <ChangeLanguage language="en" />
      </>
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
