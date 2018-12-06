'use strict';

/* global window, document, $ */

$(document).ready(function () {
    var currParams = new URLSearchParams(window.location.search);

    // Set checkboxes and search bar to current search params
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = currParams.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var entry = _step.value;

            if (entry[0] === 'keywords') {
                $('#searchbar').val(entry[1]);
            } else {
                $(':checkbox[value=\'' + entry[1] + '\']').prop('checked', 'true');
            }
        }

        // If all branches selected, set that parent to be fully checked
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    $('.top :checkbox').each(function () {
        var currParent = $(this).val();

        var allChecked = $('.sub :checkbox[data-parent=\'' + currParent + '\']').length > 0 && $('.sub :checkbox[data-parent=\'' + currParent + '\']:checked').length === $('.sub :checkbox[data-parent=\'' + currParent + '\']').length;

        if (allChecked) {
            console.log(currParent);
            $(this).prop('checked', 'true');
        }
    });
});

/**
 * Listener event thatrRetrieves the keyword search terms and checked 
 * filtering boxes (if any) and builds an updated query string for
 * the new target URL
 */
function goToNewSearch() {
    var urlParams = new URLSearchParams();

    if ($('#searchbar').val() !== '') {
        urlParams.append('keywords', $('#searchbar').val());
    }

    if ($(':checkbox:checked').length > 0) {
        $('.program-checkbox:checked').each(function () {
            var program = $(this).val();
            console.log(program);
            urlParams.append('program', program);
        });
        $('.top :checked').each(function () {
            var agency = $(this).val();
            urlParams.append('agency', agency);
        });
        $('.sub :checked').each(function () {
            var branch = $(this).val();
            urlParams.append('branch', branch);
        });
    }

    window.location.href = window.location.pathname + '?' + urlParams.toString();
    return false;
}

// Attach listener function to both Enter keypress on search bar
// and changes to checkboxes. Search button is attached directly
// as onclick attribute in view
$('#searchbar').keypress(function (event) {
    if (event.keyCode == 13) {
        goToNewSearch();
    }
});

$(':checkbox').change(goToNewSearch);