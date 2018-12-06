/* eslint-env jquery, browser */
$(document).ready(function() {
    $(window).keydown(function(event){
        if(event.keyCode == 13) {
            event.preventDefault();
            if (!$('#submitbtn').prop('disabled')) {
                $('#submitbtn').click();
            }
            return false;
        }
    });
});


async function submitEmail() { // eslint-disable-line no-unused-vars
    const email = $('#email-input').val();
    $('#submitbtn').addClass('disabled').prop('disabled', true).val('Please wait...');
    
    let res = await fetch('/forgotpassword', {
        method: 'POST',
        // credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
        body: JSON.stringify({email})
    });
    let status = res.status;
    res = await res.json();
    console.log(`Status: ${status}`);
    console.log(`Success: ${res.success}`);
    if (status === 200) {
        if (res.success) {
            $('.success-container').removeClass('d-none');
            $('.pre-success-container').addClass('d-none');
            $('#correct-email').text(email);
        } else {
            $('#wrong-email').removeClass('d-none');
            $('#submitbtn').removeClass('disabled').prop('disabled', false).val('Submit');
        }
    } else {
        $('#server-error').removeClass('d-none');
    }
}

