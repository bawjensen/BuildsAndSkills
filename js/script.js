var SUGGESTION_BOX_ID = 'search-suggestions';

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function populateSuggestions($inputBox, filterText) {
    var $suggestionsBox = $('#' + SUGGESTION_BOX_ID);

    if (!$suggestionsBox.length) {
        $suggestionsBox = $('<div>', { id: SUGGESTION_BOX_ID });
        $suggestionsBox.appendTo($('body'));
    }

    var matcher = new RegExp(escapeRegExp(filterText), 'i');

    var matching = allChamps.filter(function filter(entry) {
        return entry.name.match(matcher);
    });

    var other = $inputBox.offset();
    var fixed = $inputBox.attr('id') === 'header-search'
    $suggestionsBox.css({
        'position': fixed ? 'fixed' : 'absolute',
        'left': other.left,
        'top': (other.top + $inputBox.outerHeight() - 1) - (fixed ? $(window).scrollTop() : 0 ),
        'width': $inputBox.outerWidth(),
        'border-radius': $inputBox.css('border-radius'),
        'padding': $inputBox.css('padding'),
        'color': $inputBox.css('color')
    });

    $suggestionsBox.html(''); // Clean out old stuff

    matching.forEach(function addSuggestion(entry) {
        var newSuggestion = $('<div>', {
            'class': 'suggestion',
            // html: entry.name,
            // id: entry.id
        });

        newSuggestion.append($('<a>', {
            html: entry.name,
            href: entry.id
        }));

        $suggestionsBox.append(newSuggestion);
    });
}

$(function() {
    $('.display-all-items').click(function(evt) {
        evt.preventDefault();
        $('.item-buy.blacklisted').toggle();
    });

    $($('body')).on('click', '.suggestion', function(evt) {
        console.log('yay');
        window.location.href = $(evt.target).attr('id');
    });

    $('#champ-finder, #header-search').focus(function(evt) {
        $('#'+SUGGESTION_BOX_ID).show();
        populateSuggestions($(this), '');
    });
    $(document).on('focusout', '#champ-finder, #header-search', function(evt) {
        $('#'+SUGGESTION_BOX_ID).hide();
        $('.selected').click();
    });

    $('#champ-finder, #header-search').keyup(function(evt) {
        evt.preventDefault();
        var $selected = $('.suggestion.selected');
       
        if (evt.keyCode === 13) {
            if ($selected.length) {
                $(this).val($selected.text());
                window.location.href = $selected.attr('id');
            }
            else {
                window.location.href = $(this).val();
            }
        }
        else if (evt.keyCode === 40 || evt.keyCode === 38) { // Up or down
            if ($selected.length) {
                $selected.removeClass('selected');

                if (evt.keyCode == 40)
                    $selected.next().addClass('selected');
                else
                    $selected.prev().addClass('selected');
            }
            else {
                $('.suggestion:first').addClass('selected');
            }
        }
        else {
            var $this = $(this);
            populateSuggestions($this, $this.val());
        }
    });

    $('[data-toggle="tooltip"]').tooltip({ html: true });
});