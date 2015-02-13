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
            html: entry.name,
            id: entry.id
        });

        $suggestionsBox.append(newSuggestion);
    });
}

$(function() {
    $('.display-all-items').click(function(evt) {
        evt.preventDefault();
        $('.item-buy.blacklisted').toggle();
    });

    $(document).on('mousedown', '.suggestion', function(evt) {
        window.location.href = $(evt.target).attr('id');
    });

    $('#champ-finder, #header-search').focus(function(evt) {
        $('#'+SUGGESTION_BOX_ID).show();
        populateSuggestions($(this), '');
    });
    $('#champ-finder, #header-search').focusout(function(evt) {
        $('#'+SUGGESTION_BOX_ID).hide();
    });

    var bufferedString;
    $('#champ-finder, #header-search').keyup(function(evt) {
        evt.preventDefault();
        var $selected = $('.suggestion.selected');
        var $this = $(this);
       
        if (evt.keyCode === 13) {
            window.location.href = $this.val();
        }
        else if (evt.keyCode === 40 || evt.keyCode === 38) { // Up or down
            if ($selected.length) {
                $selected.removeClass('selected');

                if (evt.keyCode == 40) 
                    $selected = $selected.next();
                else
                    $selected = $selected.prev();

                $selected.addClass('selected');
            }
            else {
                bufferedString = $this.val();
                $selected = $('.suggestion:first').addClass('selected');
            }

            if ($('.selected').length) {
                $this.val($selected.text());
            }
            else {
                $this.val(bufferedString);
                bufferedString = undefined;
            }
        }
        else {
            populateSuggestions($this, $this.val());
        }
    });

    $('[data-toggle="tooltip"]').tooltip({ html: true });
});