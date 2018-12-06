// ESLint globals
/* global jQuery:false, AOS:false */

jQuery(document).ready(function($) {

    // Header fixed and Back to top button
    $(window).scroll(function() {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function() {
        $('html, body').animate({
            scrollTop: 0
        }, 1500, 'easeInOutExpo');
        return false;
    });

    // Animate of scroll to fade in objects from aos.js
    AOS.init();
    
    $('a.nav-link').click(function (){
        let sections = ['#intro', '#about', '#faq'];
        if (sections.indexOf(this.hash) >= 0) {
            $('html, body').animate({
                scrollTop: $(this.hash).offset().top - 70
            }, 800);
        }
    });
});