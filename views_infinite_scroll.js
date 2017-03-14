/**
 * Implements hook_install().
 */
function views_infinite_scroll_install() {
  // Warn if there are no settings.
  if (typeof drupalgap.settings.views_infinite_scroll === 'undefined') {
    var msg = 'WARNING: no settings specified for views_infinite_scroll - ' +
      'see the README.md file for settings.js usage.';
    console.log(msg);
  }
}

/**
 * Given an optional setting name, and optional router path (defaults to current),
 * this will return the individual setting's value from the settings.js file,
 * or the entire settings JSON object for the router path.
 */
function views_infinite_scroll_settings() {
  var setting = arguments[0] ? arguments[0] : null;
  var router_path = arguments[1] ? arguments[1] : drupalgap_router_path_get();
  if (setting) {
    return drupalgap.settings.views_infinite_scroll.pages[router_path][setting];
  }
  return drupalgap.settings.views_infinite_scroll.pages[router_path];
}

/**
 *
 */
function views_infinite_scroll_pages_allowed() {
  try {
    var pages_allowed = views_infinite_scroll_settings('pages_allowed');
    if (!pages_allowed) { pages_allowed = 2; }
    // Warn if they are using less than 2 pages at a time, they'll get weird
    // behavior.
    if (pages_allowed < 2) {
      var msg = 'WARNING: views_infinite_scroll - in settings.js, use at ' +
        'least 2 pages for the "' + router_path + '" view, or weird things ' +
        'will likely happen!';
      console.log(msg);
    }
    return pages_allowed;
  }
  catch (error) { console.log('views_infinite_scroll_pages_allowed - ' + error); }
}

/**
 *
 */
function views_infinite_scroll_ok() {
  try {
    // Make sure this page's router path was specified in the settings.js file.
    // If it wasn't then we don't want infinite scrolling on this page.
    var found = false;
    var current_router_path = drupalgap_router_path_get();
    var pages_to_process = drupalgap.settings.views_infinite_scroll.pages;
    for (var router_path in pages_to_process) {
      if (!pages_to_process.hasOwnProperty(router_path)) { continue; }
      var app_page = pages_to_process[router_path];
      if (current_router_path == router_path) {
        found = true;
        break;
      }
    }
    return found;
  }
  catch (error) { console.log('views_infinite_scroll_ok - ' + error); }
}

/**
 * @credit: http://stackoverflow.com/a/24728709/763010
 */
$(document).on("scrollstop", function() {

  // @TODO Add support for unfixed headers and footers.

    var activePage = $.mobile.pageContainer.pagecontainer("getActivePage"),

    /* window's scrollTop() */
    scrolled = $(window).scrollTop(),

    /* viewport */
    screenHeight = $.mobile.getScreenHeight(),

    /* content div height within active page */
    contentHeight = $(".ui-content", activePage).outerHeight(),

    /* header's height within active page (remove -1 for unfixed) */
    header = $(".ui-header", activePage).outerHeight() - 1,

    /* footer's height within active page (remove -1 for unfixed) */
    footer = $(".ui-footer", activePage).outerHeight() - 1,
    
    view = $('.ui-content .view', activePage),

    /* total height to scroll */
    scrollEnd = contentHeight - screenHeight + header + footer;

    // If there is no View on the page, don't do anything.
    if (!view[0]) { return; }

    var page_id = drupalgap_get_page_id();

    // Only act on the current page.
    if (activePage[0].id != page_id) { return; }

    // @TODO consider moving this below the next section, so it only fires when
    // we hit the top/bottom of the page.
    if (!views_infinite_scroll_ok()) { return; }

    // Did we make it to the top or bottom?
    var direction = null;
    if (scrolled >= scrollEnd) { direction = 'down'; } // SCROLLED TO THE BOTTOM...
    else if (scrolled == 0) { direction = 'up'; } // SCROLLED TO THE TOP...
    if (direction === null) { return; }

    // Set aside the direction we're moving, if it hasn't been already. Later
    // we'll need to determine if we've switched directions or not.
    var last_direction = views_embedded_view_get(page_id, 'views_infinite_scroll_last_direction');
    if (!last_direction) {
      views_embedded_view_set(page_id, 'views_infinite_scroll_last_direction', direction);
      last_direction = direction;
    }

    // If stopping, reset and return. A stop mechanism is used to prevent the
    // re-triggering of the scroll event's implementation upon list redraws.
    if (views_embedded_view_get(page_id, 'views_infinite_scroll_stop')) {
      views_embedded_view_set(page_id, 'views_infinite_scroll_stop', false);
      return;
    }

    //console.log('============================');

    // Ok, let's work some magic...

    //console.log(direction);
    //console.log('activePage: ' + activePage);
    //console.log('scrolled: ' + scrolled);
    //console.log('screenHeight: ' + screenHeight);
    //console.log('contentHeight: ' + contentHeight);
    //console.log('header: ' + header);
    //console.log('footer: ' + footer);
    //console.log('view: ' + view);
    //console.log('scrollEnd: ' + scrollEnd);

    var options = views_embedded_view_get(page_id, 'options');
    var results = views_embedded_view_get(page_id, 'results');

    //console.log('on page ' + (parseInt(results.view.page) + 1) + ' of ' + results.view.pages);
    
    // Determine the next page, and hang onto it for the directional context. If
    // there was an existing context, use it and increment/decrement as needed.
    var next_page = null;
    var current_page = parseInt(results.view.page);
    var pages_allowed = views_infinite_scroll_pages_allowed();

    if (direction == 'down') {
      if (+next_page == +results.view.page == +current_page) {
        next_page = results.view.page + 1;
      } else {
        next_page = current_page + 1;
      }
    } else if (direction == 'up') {
      if (direction != last_direction) {
        // Switching direction.
        if (scrolled != 0) {
          next_page = current_page - pages_allowed;
        } else {
          next_page = results.view.page;
        }
      }
      // Same direction.
      else { next_page = current_page - 1; }
      //dpm('next page up: ' + next_page);
    }
    
    views_embedded_view_set(page_id, 'views_infinite_scroll_last_direction', direction);
    
    if (next_page < 0) { next_page = 0; }
    
    // If we're at the last page (or back to the first depending on direction),
    // stop drop and roll.
    if (direction == 'down') {
      if (results.view.page == null || results.view.page == results.view.pages - 1) { return; }
    }
    else if (direction == 'up') {
      if (results.view.page == 0 || (results.view.page == 1 && !views_embedded_view_get(page_id, 'views_infinite_scroll_slimmed'))) {
        // Special case: made it back to the top, but never scrolled far enough
        // down to trigger a slimming of the list.
        return;
      } else if (scrolled == 0) {
        return;
      }

    }
    else { return; }
    
    // Prevent event from firing upon redraw with a stop block.
    views_embedded_view_set(page_id, 'views_infinite_scroll_stop', true);

    // If enabled, once we scroll past the number of pages allowed for the
    // first time, hide the page title. This is because when they are
    // scrolling back up, we want to not show the page title until they get
    // back to the very top, otherwise the title flickers on the screen while
    // paging up, and looks silly.
    if (views_infinite_scroll_settings('hide_title')) {
      var page_title_selector = '#' + page_id + ' h1.page-title';
      if (direction == 'down' && next_page == pages_allowed) {
        $(page_title_selector).hide();
      }
    }

    // Keep the DOM slim by removing items from the top or bottom of the list,
    // depending on which direction we're scrolling.
    var lower = null;
    var upper = null;
    
    // Let's first figure out if we should slim the DOM or not, and figure out
    // the upper and lower bounds to the slim.
    var slim = false;
    if (direction == 'down' && next_page >= pages_allowed) {

      // Remove from the top of the list.
      lower = 0;
      upper = results.view.limit;
      slim = true;

    }
    else if (direction == 'up') {

      // Remove from the bottom of the list.
      lower = results.view.limit * (pages_allowed - 1);
      upper = lower + results.view.limit;
      slim = true;

    }

    if (slim) {
      var selector = views_infinite_scroll_selector();
      //console.log('slimming (' + lower + ' => ' + upper + '): ' + selector);
      for (var i = lower; i < upper; i++) {
        var _selector = selector + ' li:eq(0)';
        if (direction == 'up') { _selector = selector + ' li:eq(' + lower + ')'; }
        var item = $(_selector);
        if (!item) { continue; }
        // Debug info.
        //if (i == lower || i == upper - 1) {
        //  console.log('remove: ' + $(item).html());
        //}
        $(item).remove(); // @TODO probably bad performance here
      }
      views_embedded_view_set(page_id, 'views_infinite_scroll_slimmed', true);
      $(selector).listview();
      $(selector).listview('refresh');
    }

    //console.log('options', options);
    //console.log('result', results);

    var new_path = options.path + '&page=' + next_page;
    module_invoke_all(
      'views_infinite_scroll_page_changing',
      current_page,
      next_page,
      new_path,
      direction,
      last_direction
    );
    views_datasource_get_view_result(new_path, {
        success: function(results) {
          try {
            //console.log(results);

            // Replace the results.
            views_embedded_view_set(page_id, 'results', results);
            //options.results = results; // @TODO do we need this line?!?!

            // Extract the root and child object name.
            var root = results.view.root;
            var child = results.view.child;

            // Render all the rows.
            var result_formats = drupalgap_views_get_result_formats(
              views_embedded_view_get(page_id, 'options')
            );
            var rows = '' + drupalgap_views_render_rows(
              options,
              results,
              root,
              child,
              result_formats.open_row,
              result_formats.close_row
            );

            // Append the rows html to the results container.
            var selector = views_infinite_scroll_selector();
            //console.log('expanding (' + direction + '): ' + selector);
            if (direction == 'down') { $(selector).append(rows); }
            else { $(selector).prepend(rows); }
            var listElement = null;
            if (options.format == 'ul' || options.format == 'ol') {
              listElement = 'li';
              $(selector).listview();
              $(selector).listview('refresh');
            }
            else {
              listElement = 'div';
              $(selector).trigger('create');
            }
            
            // If we scrolled up, scroll back down to the row we were at.
            if (direction == 'up') {
              var _selector = selector + ' ' + listElement + ':eq(' + results.view.limit + ')';
              scrollToElement(_selector, 0, -$(_selector).height());
            }
            
            // Unblock the stop, if we we're stopped.
            if (views_embedded_view_get(page_id, 'views_infinite_scroll_stop')) {
              views_embedded_view_set(page_id, 'views_infinite_scroll_stop', false);
            }

            // Reveal the page title when we make it back to the top.
            if (direction == 'up' && next_page == 0) {
              $(page_title_selector).show();
            }

            module_invoke_all(
              'views_infinite_scroll_page_changed',
              current_page, // aka 'last page'
              next_page, // aka 'current page'
              new_path,
              direction,
              last_direction
            );

          }
          catch (error) {
            console.log('views_embed_view - success - ' + error);
          }
        }
    });
});

/**
 *
 */
function views_infinite_scroll_selector() {
  try {
    return views_embedded_view_get(drupalgap_get_page_id(), 'selector') + ' .views-results';
  }
  catch (error) { console.log('views_infinite_scroll_selector - ' + error); }
}
