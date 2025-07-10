import { expect } from 'chai';
import { Localized, LocalizationModifier } from '@ajs.local/database-decorators/beta/modifiers/localization';
import { Table } from '@ajs.local/database-decorators/beta/table';
import { testEnabled, skipTests } from '../../../../config';

if (testEnabled.modifiers_localization) {
  describe('Modifiers - localization', () => {
    it('creates localization modifier', async () => CreateLocalizationModifierTest());
    it('stores multiple locale values', async () => StoreMultipleLocaleValuesTest());
    it('retrieves specific locale value', async () => RetrieveSpecificLocaleValueTest());
    it('falls back to default locale', async () => FallbackToDefaultLocaleTest());
    it('handles missing locale gracefully', async () => HandleMissingLocaleGracefullyTest());
    it('uses custom fallback locale', async () => UseCustomFallbackLocaleTest());
    it('handles localization decorator', async () => HandleLocalizationDecoratorTest());
    it('provides localize method through mixin', async () => ProvideLocalizeMethodTest());
    it('localizes specific fields', async () => LocalizeSpecificFieldsTest());
    it('maintains data structure integrity', async () => MaintainDataStructureIntegrityTest());
  });
} else {
  skipTests('Modifiers - localization');
}

interface LocalizationOptions {
  fallbackLocale?: string;
}

class TestableLocalizationModifier extends LocalizationModifier {
  public setOptions(options: LocalizationOptions) {
    this.options = options;
  }

  public getOptions(): LocalizationOptions {
    return this.options;
  }
}

async function CreateLocalizationModifierTest() {
  const modifier = new TestableLocalizationModifier();
  modifier.setOptions({ fallbackLocale: 'en' });

  expect(modifier).to.be.instanceOf(LocalizationModifier);
  expect(modifier.getOptions().fallbackLocale).to.equal('en');
}

async function StoreMultipleLocaleValuesTest() {
  const modifier = new TestableLocalizationModifier();
  modifier.setOptions({ fallbackLocale: 'en' });

  const enValue = 'Hello World';
  const frValue = 'Bonjour le Monde';
  const esValue = 'Hola Mundo';

  const locked1 = modifier.lock(undefined, enValue, 'en');
  const locked2 = modifier.lock(locked1, frValue, 'fr');
  const locked3 = modifier.lock(locked2, esValue, 'es');

  expect(locked3).to.deep.equal({
    en: enValue,
    fr: frValue,
    es: esValue,
  });
}

async function RetrieveSpecificLocaleValueTest() {
  const modifier = new TestableLocalizationModifier();
  modifier.setOptions({ fallbackLocale: 'en' });

  const data = {
    en: 'Hello World',
    fr: 'Bonjour le Monde',
    es: 'Hola Mundo',
  };

  const enValue = modifier.unlock(data, 'en');
  const frValue = modifier.unlock(data, 'fr');
  const esValue = modifier.unlock(data, 'es');

  expect(enValue).to.equal('Hello World');
  expect(frValue).to.equal('Bonjour le Monde');
  expect(esValue).to.equal('Hola Mundo');
}

async function FallbackToDefaultLocaleTest() {
  const modifier = new TestableLocalizationModifier();
  modifier.setOptions({ fallbackLocale: 'en' });

  const data = {
    en: 'Hello World',
    fr: 'Bonjour le Monde',
  };

  const missingValue = modifier.unlock(data, 'es');

  expect(missingValue).to.equal('Hello World');
}

async function HandleMissingLocaleGracefullyTest() {
  const modifier = new TestableLocalizationModifier();
  modifier.setOptions({});

  const data = {
    en: 'Hello World',
  };

  const missingValue = modifier.unlock(data, 'fr');

  expect(missingValue).to.equal(undefined);
}

async function UseCustomFallbackLocaleTest() {
  const modifier = new TestableLocalizationModifier();
  modifier.setOptions({ fallbackLocale: 'fr' });

  const data = {
    en: 'Hello World',
    fr: 'Bonjour le Monde',
  };

  const missingValue = modifier.unlock(data, 'es');

  expect(missingValue).to.equal('Bonjour le Monde');
}

async function HandleLocalizationDecoratorTest() {
  class TestTable extends Table {
    @Localized({ fallbackLocale: 'en' })
    title!: Record<string, string>;

    @Localized({ fallbackLocale: 'fr' })
    description!: Record<string, string>;
  }

  const instance = new TestTable();
  instance.title = { en: 'English Title' };
  instance.description = { fr: 'French Description' };

  expect(instance.title).to.deep.equal({ en: 'English Title' });
  expect(instance.description).to.deep.equal({ fr: 'French Description' });
}

interface TestTableWithLocalize extends Table {
  title: Record<string, string>;
  description: Record<string, string>;
  localize(locale: string, fields?: Array<keyof TestTableWithLocalize>): TestTableWithLocalize;
}

async function ProvideLocalizeMethodTest() {
  const TestTableWithMixin = Table.with(LocalizationModifier);

  class TestTable extends TestTableWithMixin {
    @Localized({ fallbackLocale: 'en' })
    title!: Record<string, string>;

    @Localized({ fallbackLocale: 'en' })
    description!: Record<string, string>;
  }

  const instance = new TestTable() as TestTableWithLocalize;
  instance.title = { en: 'English Title', fr: 'French Title' };
  instance.description = { en: 'English Description', fr: 'French Description' };

  expect(typeof instance.localize).to.equal('function');

  instance.localize('fr');

  expect(instance.title).to.equal('French Title');
  expect(instance.description).to.equal('French Description');
}

interface TestTableWithLocalizeSpecific extends Table {
  title: Record<string, string>;
  description: Record<string, string>;
  content: Record<string, string>;
  localize(locale: string, fields?: Array<keyof TestTableWithLocalizeSpecific>): TestTableWithLocalizeSpecific;
}

async function LocalizeSpecificFieldsTest() {
  const TestTableWithMixin = Table.with(LocalizationModifier);

  class TestTable extends TestTableWithMixin {
    @Localized({ fallbackLocale: 'en' })
    title!: Record<string, string>;

    @Localized({ fallbackLocale: 'en' })
    description!: Record<string, string>;

    @Localized({ fallbackLocale: 'en' })
    content!: Record<string, string>;
  }

  const instance = new TestTable() as TestTableWithLocalizeSpecific;
  instance.title = { en: 'English Title', fr: 'French Title' };
  instance.description = { en: 'English Description', fr: 'French Description' };
  instance.content = { en: 'English Content', fr: 'French Content' };

  expect(typeof instance.localize).to.equal('function');

  instance.localize('fr', ['title', 'content']);

  expect(instance.title).to.equal('French Title');
  expect(instance.description).to.deep.equal({ en: 'English Description', fr: 'French Description' });
  expect(instance.content).to.equal('French Content');
}

interface ComplexLocalizedData {
  title: string;
  content: string;
}

async function MaintainDataStructureIntegrityTest() {
  const modifier = new TestableLocalizationModifier();
  modifier.setOptions({ fallbackLocale: 'en' });

  const complexData = {
    en: { title: 'English Title', content: 'English Content' } as ComplexLocalizedData,
    fr: { title: 'French Title', content: 'French Content' } as ComplexLocalizedData,
  };

  const enValue = modifier.unlock(complexData, 'en') as ComplexLocalizedData;
  const frValue = modifier.unlock(complexData, 'fr') as ComplexLocalizedData;

  expect(enValue).to.deep.equal({ title: 'English Title', content: 'English Content' });
  expect(frValue).to.deep.equal({ title: 'French Title', content: 'French Content' });
  expect(typeof enValue).to.equal('object');
  expect(typeof frValue).to.equal('object');
}
