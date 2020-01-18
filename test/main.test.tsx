import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render as baseRender, fireEvent } from '@testing-library/react';
import { T, useTranslate, TranslateProvider } from '../src';
import { translations, badTranslations } from './data';

const consoleSpy = jest.spyOn(global.console, 'warn');

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
    const { container } = render(
      <p>
        <T id="pear" />
      </p>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Pera
        </p>
      </div>
    `);
  });

  it('translates nested text', () => {
    const { container } = render(
      <p>
        <T id="vegetable.root.carrot" />
        <T prefix="vegetable.root" id="carrot" />
      </p>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Carota
          Carota
        </p>
      </div>
    `);
  });

  it('translates with sub', () => {
    const { container } = render(
      <>
        <T type="p" id="sub.strawberry" />
        <T type="p" prefix="sub" id="orange" />
        <Sub id="cantaloupe" />
      </>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          1 ciliegia
        </p>
        <p>
          Arancia
        </p>
        <p>
          Melone
        </p>
      </div>
    `);
  });

  it('translates with plural count', () => {
    const { container } = render(
      <>
        <T type="p" id="apple" count={2} />
        <T type="p" prefix="sub" id="strawberry" count={10} />
      </>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Mele
        </p>
        <p>
          2+ ciliegie
        </p>
      </div>
    `);
  });

  it('translates with 0 count', () => {
    const { container } = render(
      <T type="p" prefix="sub" id="strawberry" count={0} />
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          0 ciliegie
        </p>
      </div>
    `);
  });

  it('translates with missing id', () => {
    const { container } = render(
      <>
        <T type="p" id="sub.apple" count={5} />
      </>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Translate] Missing id: sub.apple'
    );
    consoleSpy.mockReset();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          sub.apple
        </p>
      </div>
    `);
  });

  it('translates and change language', () => {
    const { container, getByText } = render(
      <>
        <T type="p" id="pear" />
        <T type="p" id="sub.orange" />
        <T type="p" prefix="sub" id="strawberry" count={10} />
        <ChangeLanguage language="en" />
      </>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Pera
        </p>
        <p>
          Arancia
        </p>
        <p>
          2+ ciliegie
        </p>
        <button>
          Change language
        </button>
      </div>
    `);

    fireEvent.click(getByText(/change/i));

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Pear
        </p>
        <p>
          Orange
        </p>
        <p>
          2+ strawberries
        </p>
        <button>
          Change language
        </button>
      </div>
    `);
  });
});
