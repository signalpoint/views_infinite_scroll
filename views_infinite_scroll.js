// A stop mechanism to prevent the re-triggering of the scroll event's
// implementation upon list redraws.
var _views_infinite_scroll_stop = false;

var _views_infinite_scroll_context = {};

/**
 * Implements hook_install().
 */
function views_infinite_scroll_install() {
  try {
    // Load settings, and set default's if none were provided.
    if (typeof drupalgap.settings.views_infinite_scroll === 'undefined') {
      drupalgap.settings.views_infinite_scroll = {};
    }
    if (typeof drupalgap.settings.views_infinite_scroll.pages_allowed === 'undefined') {
      drupalgap.settings.views_infinite_scroll.pages_allowed = 2;
    }
  }
  catch (error) { console.log('views_infinite_scroll_install - ' + error); }
}

/**
 *
 */
function views_infinite_scroll_pages_allowed() {
  try {
    return drupalgap.settings.views_infinite_scroll.pages_allowed;
  }
  catch (error) { console.log('views_infinite_scroll_pages_allowed - ' + error); }
}

/**
 * @see: http://stackoverflow.com/a/24728709/763010
 */
$(document).on("scrollstop", function() {
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
    
    // Set up the context, if it wasn't already.
    if (typeof _views_infinite_scroll_context[page_id] === 'undefined') {
      _views_infinite_scroll_context[page_id] = {
        down: {
          last_page: null
        },
        up: {
          last_page: null
        }
      };
    }

    /* if total scrolled value is equal or greater
       than total height of content div (total scroll)
       and active page is the target page (pageX not any other page)
       call addMore() function */
    
    var direction = null;
    if (scrolled >= scrollEnd) {
      direction = 'down';
      
      // SCROLLED TO THE BOTTOM...
      

    }
    else if (scrolled == 0) {
      
      direction = 'up';
      
      // SCROLLED TO THE TOP...

    }
    if (direction === null) { return; }
      
    // If stopping, reset and return.
    if (_views_infinite_scroll_stop) {
      _views_infinite_scroll_stop = false;
      return;
    }
    
    console.log(direction);
    //console.log('activePage: ' + activePage);
    //console.log('scrolled: ' + scrolled);
    //console.log('screenHeight: ' + screenHeight);
    //console.log('contentHeight: ' + contentHeight);
    //console.log('header: ' + header);
    //console.log('footer: ' + footer);
    //console.log('view: ' + view);
    //console.log('scrollEnd: ' + scrollEnd);
    
    var options = _views_embed_view_options;
    var results = _views_embed_view_results;
    
    //console.log('on page ' + (parseInt(results.view.page) + 1) + ' of ' + results.view.pages);
    
    // If we're at the last page (or back to the first depending on direction),
    // stop drop and roll.
    if (direction == 'down') {
      if (results.view.page == null || results.view.page == results.view.pages - 1) { return; }
    }
    else if (direction == 'up') {
      if (results.view.page == 0) { return; }
    }
    else { return; }
    
    
    // Determine the next page, and hang onto it for the directional context. If
    // there was an existing context, use it and increment/decrement as needed.
    console.log(_views_infinite_scroll_context[page_id].up);
    console.log(_views_infinite_scroll_context[page_id].down);
    console.log('----');
    var next_page = null;
    if (direction == 'down') {
      next_page = parseInt(results.view.page) + 1;
      if (_views_infinite_scroll_context[page_id].down.last_page != null) {
        next_page = _views_infinite_scroll_context[page_id].down.last_page;
        _views_infinite_scroll_context[page_id].down.last_page = null;
      }
      //else {
        //_views_infinite_scroll_context[page_id].down.last_page = next_page;
      //}
    }
    else if (direction == 'up') {
      next_page = parseInt(results.view.page) - views_infinite_scroll_pages_allowed();
      if (_views_infinite_scroll_context[page_id].up.last_page != null) {
        next_page = _views_infinite_scroll_context[page_id].up.last_page;
        _views_infinite_scroll_context[page_id].up.last_page = null;
      }
      //else {
        //_views_infinite_scroll_context[page_id].up.last_page = next_page;
      //}
    }
    
    if (next_page < 0) { next_page = 0; }
    
    // Prevent event from firing upon redraw with a stop block.
    _views_infinite_scroll_stop = true;
    
    // Keep the DOM slim by removing items from the top or bottom of the list,
    // depending on which direction we're scrolling.
    var lower = null;
    var upper = null;
    var page_to_delete = null;
    var slim = false;
    if (direction == 'down' && next_page >= views_infinite_scroll_pages_allowed()) {

      // Remove from the top of the list.
      lower = 0;
      upper = results.view.limit;
      page_to_delete = next_page - views_infinite_scroll_pages_allowed();
      _views_infinite_scroll_context[page_id].up.last_page = page_to_delete;
      slim = true;

    }
    else if (direction == 'up') {

      // Remove from the bottom of the list.
      lower = (next_page + views_infinite_scroll_pages_allowed() - 1) * results.view.limit;
      upper = lower + results.view.limit;
      page_to_delete = next_page + views_infinite_scroll_pages_allowed();
      _views_infinite_scroll_context[page_id].down.last_page = page_to_delete;
      slim = true;

    }
    
    console.log(_views_infinite_scroll_context[page_id].up);
    console.log(_views_infinite_scroll_context[page_id].down);
    
    if (slim) {
      console.log('I should delete page ' + page_to_delete + ', from ' + lower + ' to ' + upper);
      var selector = views_infinite_scroll_selector();
      for (var i = lower; i < upper; i++) {
        var _selector = selector + ' li:eq(0)';
        if (direction == 'up') { _selector = selector + ' li:eq(' + lower + ')'; }
        var item = $(_selector);
        if (i == lower || i == upper - 1) {
          console.log('remove: ' + $(item).html());  
        }
        $(item).remove(); // @TODO probably bad performance here
      }
      $(selector).listview();
      $(selector).listview('refresh');
    }
    

    //dpm('options');
    //console.log(options);
    //dpm('results');
    //console.log(results);

    
    var new_path = options.path + '&page=' + next_page;
    views_datasource_get_view_result(new_path, {
        success: function(results) {
          try {
            //console.log(results);
            
            // Replace the results.
            _views_embed_view_results = results;
            _views_embed_view_options.results = results;
            
            // Extract the root and child object name.
            var root = results.view.root;
            var child = results.view.child;
            
            // Render all the rows.
            var result_formats = drupalgap_views_get_result_formats(_views_embed_view_options);
            var rows = '' + drupalgap_views_render_rows(
              _views_embed_view_options,
              _views_embed_view_results,
              root,
              child,
              result_formats.open_row,
              result_formats.close_row
            );
            
            // Append the rows html to the results container.
            // @TODO this only works for ul/ol li's, need to add support for
            // unformatted and table formats.
            var selector = views_infinite_scroll_selector();
            if (direction == 'down') { $(selector).append(rows); }
            else { $(selector).prepend(rows); }
            $(selector).listview();
            $(selector).listview('refresh');
            
            // Unblock the stop, if we we're stopped.
            if (_views_infinite_scroll_stop) {
              _views_infinite_scroll_stop = false;
            }
  
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
    return _views_embed_view_selector + ' .views-results';
  }
  catch (error) { console.log('views_infinite_scroll_selector - ' + error); }
}

