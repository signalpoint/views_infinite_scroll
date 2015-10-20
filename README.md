# views_infinite_scroll
The Views Infinite Scroll module for DrupalGap.

#settings.js
```
// Views infinite scroll settings.
drupalgap.settings.views_infinite_scroll = {

  // Specify which pages in the app to activate infinite scroll on.
  pages: {

    // My example page.
    'hello-world': {
      pages_allowed: 3 // max # of Views results pages before trimming
    },

    // My articles page with argument.
    'articles/%': {
      pages_allowed: 2 // max # of Views results pages before trimming
    }

  }

};

```

Warning, the `pages_allowed` value must be greater than or equal to 2.

