export const useCustomI18nHead = (headOptions = {}, localeHeadOptions = {}) => {

  const currentLanguage = useI18n().locale.value;

  var basePath = useRoute().path;
  // Sprachpräfix vorne entfernen um die deutsche Variante zu bekommen
  if (currentLanguage != 'de' && basePath.startsWith(`/${currentLanguage}/`)) {
    basePath = basePath.replace(`/${currentLanguage}`, '');
  }

  var languagesAndPrefixes = [
    {
      lang: 'de',
      prefix: '',
    },
    {
      lang: 'de-DE',
      prefix: '',
    },
    {
      lang: 'en',
      prefix: '/en',
    },
    {
      lang: 'en-US',
      prefix: '/en',
    },
    {
      lang: 'en-GB',
      prefix: '/en',
    },
  ];

  var alternativeLinks = languagesAndPrefixes.map(language => {
    return {
      rel: 'alternate',
      hreflang: language.lang,
      href: language.prefix + basePath,
    };
  });

  const mergedHeadOptions = Object.assign(
    {
      htmlAttrs: {
        lang: currentLanguage,
        dir: "ltr",
      },
      link: alternativeLinks,
    },
    localeHeadOptions,
    headOptions
  );
  useHead({
    ...mergedHeadOptions,
  });
};
