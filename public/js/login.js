/* global window, document, Cookies */
/// <reference path="../../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../../node_modules/cookies-js/dist/cookies.d.ts"/>

$(window).keypress(function(e) {
    if (e.which === 13) {
        $('#submitbtn').click();
    }
});

function check_empty() {
    if (document.getElementById('name').value == '' ||
        document.getElementById('email').value == '' ||
        document.getElementById('msg').value == '') {
        alert('Fill All Fields !');
    } else {
        document.getElementById('form').submit();
        alert('Form submitted successfully...');
    }
}

//function to display Popup
function div_show() {
    document.getElementById('abc').style.display = 'block';
}

//function to hide Popup
function div_hide() {
    document.getElementById('abc').style.display = 'none';
}

function WindowLoad(event) {
    if(localStorage.getItem('token')) {
        alert('Logged out');
        localStorage.removeItem('token');
        localStorage.removeItem('name');
    }
}

function auth() {
    console.log('CLICKED');
    // let xhttp = new XMLHttpRequest();
    let data = {
        email: document.getElementById('usr').value,
        password:document.getElementById('pwd').value
    };
    
    // *24*60*60*1000
    // xhttp.onreadystatechange = function() {
    //     if (xhttp.readyState===4) {
    //         let response = JSON.parse(xhttp.responseText);
    //         console.log(response);
    //         if(response.token) {
    //             if(localStorage.getItem('token')){
    //                 console.log('Old token:' + localStorage.getItem('token'));
    //             }
    //             console.log('Setting new token');
    //             localStorage.setItem('token', response.token);
    //             localStorage.setItem('name', response.name);
    //             document.getElementById('loginSuccess').style.display = 'block';
    //             window.location.replace("/topics/1");
    //         }else{
    //             //Delete the old token and alert the user the log in failed!
    //             console.log('Login failed!');
    //             document.getElementById('loginFail').style.display = 'block';
    //             localStorage.removeItem('token');
    //             localStorage.removeItem('name');
    //         }
    //     }
    // };
    // xhttp.open("POST", "/login", true);
    // xhttp.setRequestHeader("Content-type", 'application/json; charset=UTF-8');
    // xhttp.send(JSON.stringify(data));
    $.post('/login', data).done(function(d) {
        Cookies.expire('token');
        if (d.token) {
            document.getElementById('loginSuccess').style.display = 'block';
            Cookies.set('token', d.token, {expires: 30*24*60*60});
            window.location.replace('/topics/1');
        } else {
            document.getElementById('loginFail').style.display = 'block';
        }
    });
    
    
}
if (window.addEventListener) { // Mozilla, Netscape, Firefox
    window.addEventListener('load', WindowLoad, false);
} else if (window.attachEvent) { // IE
    window.attachEvent('onload', WindowLoad);
}

