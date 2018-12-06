/* eslint-env jquery, browser */

$('#formSubmit').click(submitEmail);

async function submitEmail() { // eslint-disable-line no-unused-vars
    const name    = $('.form #name').val();
    const email   = $('.form #email').val();
    const subject = $('.form #subject').val();
    const message = $('.form #message').val();
    
    $('#formSubmit').addClass('disabled').prop('disabled', true).val('Please wait...');
    
    let res = await fetch('/contact', {
        method: 'POST',
        // credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
        body: JSON.stringify({name, email, subject, message})
    });
    let status = res.status;
    res = await res.json();
    console.log(`Status: ${status}`);
    console.log(`Success: ${res.success}`);
    if (status === 200) {
        if (res.success) {
            $('.sendmessage').removeClass('d-none');
            $('.contactForm').addClass('d-none');
        } else {
            $('.errormessage').removeClass('d-none');
            $('#formSubmit').removeClass('disabled').prop('disabled', false).val('Submit');
        }
    } else {
        $('.errormessage').removeClass('d-none');
    }
}

