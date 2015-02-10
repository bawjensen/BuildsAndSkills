$(function() {
    // $('.collapsible').siblings(':has(h1)').find('h1').click(function() {
    //     $(this).parent().siblings('.collapsible').slideToggle();
    // });

    $('.display-all-items').click(function(evt) {
        evt.preventDefault();
        $('.item-buy.blacklisted').toggle();
    });

    $('form#champ-search').submit(function(evt) {
        evt.preventDefault();
        var $this = $(this);

        var $input = $($this.find('input')[0]);

        window.location.href = $input.val();
    });

    $('[data-toggle="tooltip"]').tooltip({ html: true });
});