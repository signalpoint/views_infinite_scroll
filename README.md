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

WARNING, the `pages_allowed` value must be greater than or equal to 2.

# API

## hook_views_infinite_scroll_page_changing()

Invoked right before the page changes.

```
/**
 * Implements hook_views_infinite_scroll_page_changing().
 */
function hook_views_infinite_scroll_page_changing(current_page, next_page, new_path, direction, last_direction) {
  try {
  }
  catch (error) {
    console.log('hook_views_infinite_scroll_page_changing - ' + error);
  }
}
```

## hook_views_infinite_scroll_page_changed()

Invoked after the page has changed and the content has been rendered.

```
/**
 * Implements hook_views_infinite_scroll_page_changed().
 */
function hook_views_infinite_scroll_page_changed(last_page, current_page, new_path, direction, last_direction) {
  try {
  }
  catch (error) {
    console.log('hook_views_infinite_scroll_page_changed - ' + error);
  }
}
```
