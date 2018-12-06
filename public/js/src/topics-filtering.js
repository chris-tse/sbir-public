/* global window, document, $ */

$(document).ready(function() {
    let currParams = new URLSearchParams(window.location.search);
    
    // Set checkboxes and search bar to current search params
    for (let entry of currParams.entries()) {
        if (entry[0] === 'keywords') {
            $('#searchbar').val(entry[1]);
        } else {
            $(`:checkbox[value='${entry[1]}']`).prop('checked','true');
        }
    }
    
    // If all branches selected, set that parent to be fully checked
    $('.top :checkbox').each(function() {
        let currParent = $(this).val();
        
        let allChecked = $(`.sub :checkbox[data-parent='${currParent}']`).length > 0 && $(`.sub :checkbox[data-parent='${currParent}']:checked`).length === $(`.sub :checkbox[data-parent='${currParent}']`).length;
        
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
    let urlParams = new URLSearchParams();

    if ($('#searchbar').val() !== '') {
        urlParams.append('keywords', $('#searchbar').val());
    }
    
    if ($(':checkbox:checked').length > 0) {
        $('.program-checkbox:checked').each(function() {
            let program = $(this).val();
            console.log(program);
            urlParams.append('program', program);
        });
        $('.top :checked').each(function() {
            let agency = $(this).val();
            urlParams.append('agency', agency);
        });
        $('.sub :checked').each(function() {
            let branch = $(this).val();
            urlParams.append('branch', branch);
        });
    }
    
    window.location.href = `${window.location.pathname}?${urlParams.toString()}`;
    return false;
}

// Attach listener function to both Enter keypress on search bar
// and changes to checkboxes. Search button is attached directly
// as onclick attribute in view
$('#searchbar').keypress(function(event){
    if(event.keyCode == 13){
        goToNewSearch();
    }
});

$(':checkbox').change(goToNewSearch);

