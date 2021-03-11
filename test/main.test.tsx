import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render as baseRender, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import { T, useTranslate, TranslateProvider, mergeTranslations } from '../src';
import { translations } from './data';

jest.useFakeTimers();

// avoid errors spam
global.console.error = jest.fn();

function TBase(props: {
  id: string;
  count?: number;
  prefix?: string;
  returnIdIfMissing?: boolean;
}) {
  const { id, count, prefix, returnIdIfMissing } = props;
  const params = { count, prefix, returnIdIfMissing };
  const { t } = useTranslate();
  const translation = t(id, params);
  return translation ? <>{translation}</> : null;
}

function TWithPrefix(props: { id: string; count?: number }) {
  const { withPrefix } = useTranslate();
  const { id, count } = props;
  const params = count ? { count } : undefined;
  const t = withPrefix('sub');
  return <p>{t(id, params)}</p>;
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
  fallbackLanguage?: string | null;
  suppressWarnings?: boolean;
  showIds?: boolean;
}): React.ReactElement {
  const fallback =
    fallbackLanguage === null
      ? undefined
      : fallbackLanguage
      ? fallbackLanguage
      : 'en';

  return (
    <TranslateProvider
      defaultLanguage="it"
      fallbackLanguage={fallback}
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
        <TBase id="pear" />
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
        <TBase prefix="vegetable.root" id="carrot" />
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
        <TWithPrefix id="cantaloupe" />
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
          10 fragole
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

    const { container } = baseRender(
      <Provider fallbackLanguage={null}>
        <T type="p" id="sub.apple" count={6} />
      </Provider>
    );

    jest.runAllTimers();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[T] Missing id: sub.apple (n. 6)(it)'
    );

    consoleSpy.mockReset();
    consoleSpy.mockRestore();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          sub.apple (n. 6)
        </p>
      </div>
    `);
  });

  it('translates with missing id but with fallback', () => {
    const consoleSpy = jest.spyOn(global.console, 'warn');

    const { container } = render(
      <>
        <T type="p" id="sub.apple" count={6} />
      </>
    );

    jest.runAllTimers();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[T] Missing id and fallback: sub.apple (n. 6)(it - en)'
    );

    consoleSpy.mockReset();
    consoleSpy.mockRestore();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          sub.apple (n. 6)
        </p>
      </div>
    `);
  });

  it('translates with missing id but suppressed warnings', () => {
    const consoleSpy = jest.spyOn(global.console, 'warn');

    const { container } = baseRender(
      <Provider suppressWarnings>
        <T type="p" id="sub.apple" count={8} />
      </Provider>
    );

    jest.runAllTimers();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockReset();
    consoleSpy.mockRestore();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          sub.apple (n. 8)
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
          10 fragole
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
          10 strawberries
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
        strawberry: ['1 strawberry', '%n strawberries', '0 strawberry'],
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
        strawberry: ['1 fragola', '%n fragole', '0 fragole'],
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
    const consoleSpy = jest.spyOn(global.console, 'warn');

    const { container, getByText } = render(
      <>
        <T type="p" id="pear" />
        <T type="p" id="banana" />
        <T type="p" id="sub.orange" />
        <T type="p" prefix="sub" id="strawberry" count={0} />
        <T type="p" prefix="sub" id="strawberry" count={1} />
        <T type="p" prefix="sub" id="strawberry" count={10} />
        <ChangeLanguage language="de" />
      </>
    );

    // default language is italian
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Pera
        </p>
        <p>
          Banana
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
          10 fragole
        </p>
        <button>
          Change language
        </button>
      </div>
    `);

    fireEvent.click(getByText(/change/i));

    // fallback language is english
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Pear
        </p>
        <p>
          banana
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
          10 strawberries
        </p>
        <button>
          Change language
        </button>
      </div>
    `);

    jest.runAllTimers();
    expect(consoleSpy).toHaveBeenCalledTimes(6);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      '[T] Missing id but using fallback: pear (de)'
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      '[T] Missing id and fallback: banana (de - en)'
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      3,
      '[T] Missing id but using fallback: sub.orange (de)'
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      4,
      '[T] Missing id but using fallback: sub.strawberry (n. 0)(de)'
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      5,
      '[T] Missing id but using fallback: sub.strawberry (n. 1)(de)'
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      6,
      '[T] Missing id but using fallback: sub.strawberry (n. 10)(de)'
    );

    consoleSpy.mockReset();
    consoleSpy.mockRestore();
  });

  it('translates with showIds toggled', () => {
    const { container } = baseRender(
      <Provider showIds>
        <T type="p" id="apple" />
        <T type="p" id="apple" count={0} />
        <T type="p" prefix="sub" id="apple" count={5} />
        <TWithPrefix id="strawberry" />
      </Provider>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          apple
        </p>
        <p>
          apple (n. 0)
        </p>
        <p>
          sub.apple (n. 5)
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
          <TWithPrefix id="strawberry" />
        </>
      );
    }).toThrow('useTranslateState must be used within a TranslateProvider');
  });

  it('translates and return undefined if id is missing', () => {
    const { container } = baseRender(
      <Provider>
        <T type="p" id="apple" />
        <T type="p" id="apple" count={5} />
        <T type="p" prefix="sub" id="apple" count={5} />
        <TBase id="strawberry" returnIdIfMissing={false} />
      </Provider>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          Mela
        </p>
        <p>
          Mele
        </p>
        <p>
          sub.apple (n. 5)
        </p>
      </div>
    `);
  });
});
