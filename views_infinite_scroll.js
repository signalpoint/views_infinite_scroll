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

    /* if total scrolled value is equal or greater
       than total height of content div (total scroll)
       and active page is the target page (pageX not any other page)
       call addMore() function */
    if (activePage[0].id == drupalgap_get_page_id() && scrolled >= scrollEnd) {
      
      var options = _views_embed_view_options;
      var results = _views_embed_view_results;
      
      //console.log('on page ' + (parseInt(results.view.page) + 1) + ' of ' + results.view.pages);
      
      // If we're at the last page, stop drop and roll.
      if (results.view.page == results.view.pages - 1) { return; }

      //dpm('options');
      //console.log(options);
      //dpm('results');
      //console.log(results);

      var next_page = parseInt(results.view.page) + 1;
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
              var selector = _views_embed_view_selector + ' .views-results';
              $(selector).append(rows);
              $(selector).listview();
              $(selector).listview('refresh');
    
            }
            catch (error) {
              console.log('views_embed_view - success - ' + error);
            }
          }
      });

    }
});
