'use strict';

var submitEmail = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var email, res, status;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        // eslint-disable-line no-unused-vars
                        email = $('#email-input').val();

                        $('#submitbtn').addClass('disabled').prop('disabled', true).val('Please wait...');

                        _context.next = 4;
                        return fetch('/forgotpassword', {
                            method: 'POST',
                            // credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            redirect: 'follow',
                            body: JSON.stringify({ email: email })
                        });

                    case 4:
                        res = _context.sent;
                        status = res.status;
                        _context.next = 8;
                        return res.json();

                    case 8:
                        res = _context.sent;

                        console.log('Status: ' + status);
                        console.log('Success: ' + res.success);
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

                    case 12:
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
$(document).ready(function () {
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            if (!$('#submitbtn').prop('disabled')) {
                $('#submitbtn').click();
            }
            return false;
        }
    });
});