<template>
  <div class="h-100 d-flex align-center justify-md-space-between justify-center">
    <!-- 👉 Footer: left content -->
    <span class="d-flex align-center">
      &copy;
      {{ new Date().getFullYear() }}

      <a
        href="https://www.tino-kuptz.de/"
        target="noopener noreferrer"
        class="mx-1"
      >Tino Kuptz.</a>

      Theme 
      by <a
        href="https://themeselection.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary ms-1"
      >ThemeSelection</a>
    </span>
    <!-- 👉 Footer: right content -->
    <span class="d-md-flex gap-x-4 text-primary d-none">
      <a
        href="https://www.tino-kuptz.de/impressum/"
        target="noopener noreferrer"
      >Impressum</a>
      <a
        href="https://www.tino-kuptz.de/datenschutzerklaerung/"
        target="noopener noreferrer"
      >Datenschutz</a>
    </span>
  </div>
</template>
