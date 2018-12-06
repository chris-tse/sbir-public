'use strict';

var submitEmail = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var name, email, subject, message, res, status;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        // eslint-disable-line no-unused-vars
                        name = $('.form #name').val();
                        email = $('.form #email').val();
                        subject = $('.form #subject').val();
                        message = $('.form #message').val();


                        $('#formSubmit').addClass('disabled').prop('disabled', true).val('Please wait...');

                        _context.next = 7;
                        return fetch('/contact', {
                            method: 'POST',
                            // credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            redirect: 'follow',
                            body: JSON.stringify({ name: name, email: email, subject: subject, message: message })
                        });

                    case 7:
                        res = _context.sent;
                        status = res.status;
                        _context.next = 11;
                        return res.json();

                    case 11:
                        res = _context.sent;

                        console.log('Status: ' + status);
                        console.log('Success: ' + res.success);
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

                    case 15:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function submitEmail() {
        return _ref.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/* eslint-env jquery, browser */

$('#formSubmit').click(submitEmail);