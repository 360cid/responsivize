/* 
 * A table that works responsively to hide/show columns based on the screen size.
 * 
 * Behavior:
 * 320 - 480: 2 columns
 * 480 - 800: 3 columns
 * 800 - 1000: 5 columns
 * 1000 +: all columns
 * 
 * Requirements: enquire.js for media queries (+ matchmedia polyfill), jquery.reveal.js for modal
 */

(function ($) {

    // Global variables
    var defaultCol = '',
        visibleCol = '';

    $.fn.responsivize = function (options) {

        if (!$(this).length) {
            return false; // table doesn't exist
        }

        /* 
        * Default options
        * ----------------
        * 
        * highlightSortedColumn: set a background color on the currently sorted column
        * modal: display the column selector in a modal or dropdown
        * columnPriority: Order in which columns should hide. Most of this is handled via css;
        * script is required to handle window resizing and various sort options
        * ---------------------------------------------------------------------------
        */
        var settings = $.extend({
            highlightSortedColumn: false,
            modal: true,
            columnPriority: {
                1: $('th[data-priority="1"]').data('column'),
                2: $('th[data-priority="2"]').data('column'),
                3: $('th[data-priority="3"]').data('column'),
                4: $('th[data-priority="4"]').data('column'),
                5: $('th[data-priority="5"]').data('column'),
                6: $('th[data-priority="6"]').data('column')
            }
        }, options);

        if (settings.highlightSortedColumn) {
            highlightSortedColumn();
        }

        var $window = $(window),      
            $rspTable = $(this);
			
			
		// Build responsive menu
		// TODO: this is ugly
		var $rspMenu = $('<div id="rspMenu" class="rsp-table-menu" />');
		
		var $rspListToggle = $('<button id="rspListToggle" type="button" class="toggle">More</button>')
		$rspMenu.append($rspListToggle);
		
		var $rspList = $('<ul id="rspList" />');
		
		$rspTable.find('th').each(function(index){
			var $btn = $('<button type="button" />'),
				$li = $('<li />');
				colName = $(this).data('column');
			
			if (index == 0) {
				// first column is always shown; don't add this one
				return;
			} else if (index == 1) {	
				$li.attr('data-break', 3)
				   .addClass('selected');	
			} else if (index == 2 || index == 3) {
				$li.attr('data-break', 5);
			}
			
			$btn.attr('data-target', colName)
				.html($(this).text());
			$li.append($btn);
			$rspList.append($li);
			
		});
		
		$rspMenu.append($rspList);
		$rspTable.find('th:first-child').append($rspMenu);


        // Default column depends on viewport width
        if (document.documentElement.clientWidth < 480) {
            defaultCol = settings.columnPriority[6];
        } else if (document.documentElement.clientWidth < 800) {
            defaultCol = settings.columnPriority[5];
        } else {
            defaultCol = settings.columnPriority[3];
        }
		
		console.log('default', defaultCol, 'visible: ',visibleCol)

        visibleCol = defaultCol;

        var stickyScrollPos = $rspTable.offset().top,
            menuStickyPos = stickyScrollPos + $rspTable.find('th').outerHeight(),
            lastScrollPos = stickyScrollPos;

        // pin table header to top of screen on scroll
        $window.on('scroll', function () {
            var currScrollPos = $rspTable.offset().top;

            if (currScrollPos !== lastScrollPos) {
                // update position if it changed for any reason
                stickyScrollPos = currScrollPos;
                menuStickyPos = stickyScrollPos + $rspTable.find('th').outerHeight();
                lastScrollPos = stickyScrollPos;
            }

            // show jump to top link and stick responsive menu to thead
            if ($window.scrollTop() > stickyScrollPos) {
                $('.scroll-to-top.hidden').removeClass('hidden');
                $rspMenu.addClass('sticky');
                $rspTable.addClass('sticky');
            } else {
                $('.scroll-to-top').addClass('hidden');
                $rspMenu.removeClass('sticky');
                $rspTable.removeClass('sticky');
            }
        });

        if (settings.modal) {
            // build modal
            var $rspModal = $('<div id="rspModal" class="reveal-modal rsp-table-modal">');
            $rspModal.html('<div class="modal-header"><a class="close-reveal-modal">&#215;</a></div>');
            $rspModal.append($('<div class="modal-body">').append($rspList.removeClass('hidden')));

            $('body').append($rspModal);

            $rspListToggle.on('click', function () {
                $('#rspModal').reveal({ animation: 'none' });
            });

            $('#rspList button').on('click', function () {
                var target = $(this).data('target');

                $('#rspModal').trigger('reveal:close');

                updateUI(target);
            });

        } else {
            /* 
                Display responsive menu in a dropdown
            */
            $rspList.addClass('hidden');

            // show/hide responsive menu 
            $rspListToggle.on('click', function () {
                $rspList.removeClass('hidden');
                $rspListToggle.addClass('hidden');

                $('.rsp-table th:visible:last').addClass('rsp-menu-open');
            });

            $('#rspList button').on('click', function () {
                var target = $(this).data('target');

                hideResponsiveMenu();
                updateUI(target);
            });

            $(document).on('touchstart click', function (e) {
                if (!$('#rspList').hasClass('hidden') && !$(e.target).parents().hasClass('rsp-table-menu')) {
                    hideResponsiveMenu();
                }
            });
        }

        $(function () {
            var sort;

            if (typeof (sortCol) !== 'undefined') {
                // sort order has been specified in query string
                if ($('[data-column="' + sortCol + '"]').length) {
                    sort = sortCol;
                }
            }

            // make sure correct column is selected in mobile list
            if ($rspList.find('.selected button').data('target') !== visibleCol) {
                updateResponsiveMenu(visibleCol);
            }

            // Update table layout on screen resize
            enquire.register('screen and (max-width:479px)', {
                match: breakpoints["3"](sort)
            })
            .register('screen and (min-width:480px) and (max-width:799px)', {
                match: breakpoints["5"](sort)
            })
            .register('screen and (min-width:800px) and (max-width:999px)', {
                match: breakpoints["all"](sort)
            });
        });
        
        
        // Store a reference to the function that should be called at each breakpoint
        var breakpoints = {
            "3": function(sort) {
                defaultCol = settings.columnPriority[6];

                if (sort) {
                    updateUI(sort);
                } else {
                    updateUI(defaultCol);
                }
            },
            "5": function(sort){
                defaultCol = settings.columnPriority[5];

                if (sort && sort !== settings.columnPriority[6]) {
                    updateUI(sort);
                } else {
                    updateUI(defaultCol);
                }
            },
            "all": function(sort) {
                defaultCol = settings.columnPriority[3];

                if (sort && sort !== settings.columnPriority[6] && sort !== settings.columnPriority[5] && sort !== settings.columnPriority[4]) {
                    updateUI(sort);
                } else {
                    updateUI(defaultCol);
                }
            }
        };
        

        function hideResponsiveMenu() {
            $rspList.addClass('hidden');
            $rspListToggle.removeClass('hidden');
            $('.rsp-menu-open').removeClass('rsp-menu-open');
        }

        function updateResponsiveMenu(col) {
            $rspList.find('.selected').removeClass('selected');
            $rspList.find('[data-target="' + col + '"]').parent().addClass('selected');
        }

        function updateUI(newCol) {
            if (newCol !== visibleCol) {

                if (!settings.modal) {
                    hideResponsiveMenu();
                }

                updateResponsiveMenu(newCol);
                resetHeaders(newCol);
                resetColumns(newCol);

                visibleCol = newCol; //store updated col
            }
        }

        function resetHeaders(target) {
            var $headers = $('.rsp-table th');

            $headers.each(function () {
                var $this = $(this);
                if ($this.data('column') === target) {
                    $this.addClass('mobile-show').removeClass('mobile-hide');
                } else if ($this.data('column')) {
                    $this.removeClass('mobile-show').addClass('mobile-hide');
                }
            });
        }

        function resetColumns(target) {
            var selector = '[data-column="' + target + '"]',
                $tbody = $('tbody'),
                $rows = $tbody.find('tr');

            var len = $rows.length;

            for (var i = 0; i < len; i++) {
                var $this = $($rows[i]);
                $this.find('td[data-column]').removeClass('mobile-show').addClass('mobile-hide');
                $this.find(selector).addClass('mobile-show').removeClass('mobile-hide');
            }
        }

        // Highlights all table cells in the currently sorted column
        function highlightSortedColumn() {
            var thIndex = 0;

            $('.rsp-table th').each(function () {
                thIndex++;
                if ($(this).hasClass('sort-asc') || $(this).hasClass('sort-desc')) {
                    return false;
                }
            });

            var style = document.createElement('style'),
                css = 'tbody td:nth-of-type(' + thIndex + ') { background-color: #f1f0eb; }';

            style.setAttribute('type', 'text/css');

            if (style.styleSheet) {
                style.styleSheet.cssText = css; // old IE fallback
            } else {
                style.appendChild(document.createTextNode(css));
            }

            document.getElementsByTagName('head')[0].appendChild(style);
        }
    };

    // parses results and returns a string containing correct HTML for the current sort
    $.fn.responsivize.updateResults = function (resultString) {
        var selector = '[data-column="' + visibleCol + '"]',
            $updatedHtml = $('<tbody>').append(resultString);
        var $rows = $updatedHtml.find('tr'),
            len = $rows.length;

        for (var i = 0; i < len; i++) {
            var $this = $($rows[i]);
            $this.find('td[data-column]').removeClass('mobile-show').addClass('mobile-hide');
            $this.find(selector).addClass('mobile-show').removeClass('mobile-hide');
        }

        return $updatedHtml.html();
    };

})(jQuery);