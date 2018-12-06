$('a[href^=http]').click(function(e){
    e.preventDefault();
    let conf = confirm('You are about to leave the SBIR Connector website. Press OK to continue, or press Cancel to remain on this site.');

    if (conf) {
        window.location = $(this).attr("href");
    }
});