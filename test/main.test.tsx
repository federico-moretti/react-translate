import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render as baseRender, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import { T, useTranslate, TranslateProvider, mergeTranslations } from '../src';
import { translations } from './data';

function Sub({ id }: { id: string }) {
  const { withPrefix } = useTranslate();
  const t = withPrefix('sub');
  return <p>{t(id)}</p>;
}

function ChangeLanguage({ language }: { language: string }) {
  const { setLanguage } = useTranslate();
  return <button onClick={() => setLanguage(language)}>Change language</button>;
}

function Provider({
  children,
  fallbackLanguage,
  suppressWarnings,
  showIds,
}: {
  children?: React.ReactNode;
  fallbackLanguage?: string;
  suppressWarnings?: boolean;
  showIds?: boolean;
}): React.ReactElement {
  return (
    <TranslateProvider
      defaultLanguage="it"
      fallbackLanguage={fallbackLanguage ?? 'en'}
      suppressWarnings={suppressWarnings}
      showIds={showIds}
      translations={translations}
    >
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
          1 fragola
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
          2+ fragole
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
          0 fragole
        </p>
      </div>
    `);
  });

  it('translates with missing id', () => {
    const consoleSpy = jest.spyOn(global.console, 'warn');

    const { container } = render(
      <>
        <T type="p" id="sub.apple" count={5} />
      </>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Translate] Missing id: sub.apple'
    );

    consoleSpy.mockReset();
    consoleSpy.mockRestore();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          sub.apple
        </p>
      </div>
    `);
  });

  it('translates with missing id but suppressed warnings', () => {
    const consoleSpy = jest.spyOn(global.console, 'warn');

    const { container } = baseRender(
      <Provider suppressWarnings>
        <T type="p" id="sub.apple" count={5} />
      </Provider>
    );

    expect(consoleSpy).not.toHaveBeenCalledWith(
      '[Translate] Missing id: sub.apple'
    );

    consoleSpy.mockReset();
    consoleSpy.mockRestore();

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
          2+ fragole
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

  it('contains language value', () => {
    const { result } = renderHook(() => useTranslate(), {
      wrapper: Provider,
    });

    act(() => {
      result.current.setLanguage('it');
    });

    expect(result.current.language).toBe('it');

    act(() => {
      result.current.setLanguage('en-GB');
    });

    expect(result.current.language).toBe('en-GB');
  });

  it('merges 2 translations', () => {
    const translationsEn: Record<string, any> = {
      pear: 'Pear',
      banana: ['Banana', 'Bananas'],
      sub: {
        strawberry: ['1 strawberry', '2+ strawberries', '0 strawberry'],
        apple: {
          gala: 'Apple Gala',
          golden: 'Apple Golden',
        },
      },
    };

    const translationsIt: Record<string, any> = {
      pear: 'Pera',
      banana: ['Banana', 'Banane'],
      sub: {
        strawberry: ['1 fragola', '2+ fragole', '0 fragole'],
        apple: {
          gala: 'Mela Gala',
          golden: 'Mela Golden',
        },
      },
    };

    const merged: any = mergeTranslations([
      { language: 'it', translations: translationsIt },
      { language: 'en', translations: translationsEn },
    ]);

    expect(merged.pear.it).toBe('Pera');
    expect(merged.pear.en).toBe('Pear');
    expect(merged.banana.it[1]).toBe('Banane');
    expect(merged.banana.en[1]).toBe('Bananas');
    expect(merged.sub.strawberry.it[2]).toBe('0 fragole');
    expect(merged.sub.strawberry.en[2]).toBe('0 strawberry');
    expect(merged.sub.apple.gala.it).toBe('Mela Gala');
    expect(merged.sub.apple.gala.en).toBe('Apple Gala');
  });

  it('translate with fallbackLanguage', () => {
    const { container, getByText } = render(
      <>
        <T type="p" id="pear" />
        <T type="p" id="sub.orange" />
        <T type="p" prefix="sub" id="strawberry" count={0} />
        <T type="p" prefix="sub" id="strawberry" count={1} />
        <T type="p" prefix="sub" id="strawberry" count={10} />
        <ChangeLanguage language="de" />
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
          0 fragole
        </p>
        <p>
          1 fragola
        </p>
        <p>
          2+ fragole
        </p>
        <button>
          Change language
        </button>
      </div>
    `);

    fireEvent.click(getByText(/change/i));

    // fallbackLanguage is "en"
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Pear
        </p>
        <p>
          Orange
        </p>
        <p>
          0 strawberries
        </p>
        <p>
          1 strawberry
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

  it('translates with showIds toggled', () => {
    const { container } = baseRender(
      <Provider showIds>
        <T type="p" id="apple" />
        <T type="p" id="apple" count={0} />
        <T type="p" id="apple" count={5} />
        <Sub id="strawberry" />
      </Provider>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          apple
        </p>
        <p>
          apple - count: 0
        </p>
        <p>
          apple - count: 5
        </p>
        <p>
          sub.strawberry
        </p>
      </div>
    `);
  });

  it('throw error for missing state provider', () => {
    expect(() => {
      baseRender(
        <>
          <T type="p" id="apple" />
          <T type="p" id="apple" count={0} />
          <T type="p" id="apple" count={5} />
          <Sub id="strawberry" />
        </>
      );
    }).toThrow('useTranslateState must be used within a TranslateProvider');
  });
});
