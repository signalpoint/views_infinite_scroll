// A stop mechanism to prevent the re-triggering of the scroll event's
// implementation upon list redraws.
var _views_infinite_scroll_stop = false;
var _views_infinite_scroll_pages_allowed = 2;

/**
 * Implements hook_install().
 */
function views_infinite_scroll_install() {
  try {
    // Load settings, and set default's if none were provided.
    if (typeof drupalgap.settings.views_infinite_scroll === 'undefined') {
      drupalgap.settings.views_infinite_scroll = {};
    }
    if (typeof drupalgap.settings.views_infinite_scroll.pages_allowed !== 'undefined') {
      _views_infinite_scroll_pages_allowed = drupalgap.settings.views_infinite_scroll.pages_allowed;
    }
  }
  catch (error) { console.log('views_infinite_scroll_install - ' + error); }
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
    
    // Only act on the current page.
    if (activePage[0].id != drupalgap_get_page_id()) { return; }

    /* if total scrolled value is equal or greater
       than total height of content div (total scroll)
       and active page is the target page (pageX not any other page)
       call addMore() function */
    if (scrolled >= scrollEnd) {
      
      // SCROLLED TO THE BOTTOM...
      
      console.log('BOTTOM');
      
      // If stopping, reset and return.
      if (_views_infinite_scroll_stop) {
        _views_infinite_scroll_stop = false;
        return;
      }
      
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
      
      // If we're at the last page, stop drop and roll.
      if (results.view.page == null || results.view.page == results.view.pages - 1) { return; }
      
      // Determine the next page.
      var next_page = parseInt(results.view.page) + 1;
      
      // To keep the DOM slim, if we've made it past the second page, we'll
      // remove the first page. This concept will continue as paging progresses,
      // essentially only ever having 2 pages in the DOM at the same time.
      if (next_page >= _views_infinite_scroll_pages_allowed) {

        // Prevent event from firing upon redraw with a stop block.
        _views_infinite_scroll_stop = true;
        
        // Figure out the range of items to remove from the list.
        //var lower = (next_page - _views_infinite_scroll_pages_allowed) * results.view.limit;
        //var upper = (next_page - 1) * results.view.limit;
        var lower = 0;
        var upper = results.view.limit;
        var page_to_delete = next_page - _views_infinite_scroll_pages_allowed;
        console.log('I should delete page ' + page_to_delete + ', from ' + lower + ' to ' + upper);
        var selector = views_infinite_scroll_selector();
        for (var i = 0; i < upper; i++) {    
          var item = $(selector + ' li:eq(0)');
          if (i == 0 || i == upper - 1) {
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
              $(selector).append(rows);
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

    }
    else if (scrolled == 0) {
      
      // SCROLLED TO THE TOP...
      
      console.log('TOP');
      //console.log('activePage: ' + activePage);
      //console.log('scrolled: ' + scrolled);
      //console.log('screenHeight: ' + screenHeight);
      //console.log('contentHeight: ' + contentHeight);
      //console.log('header: ' + header);
      //console.log('footer: ' + footer);
      //console.log('view: ' + view);
      //console.log('scrollEnd: ' + scrollEnd);
      
      // If stopping, reset and return.
      if (_views_infinite_scroll_stop) {
        _views_infinite_scroll_stop = false;
        return;
      }
      
      var options = _views_embed_view_options;
      var results = _views_embed_view_results;
      
      // If we're at the first page, stop drop and roll.
      if (results.view.page == 0) { return; }
      
      // Determine the previous page (aka .
      var previous_page = results.view.page;

    }
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
