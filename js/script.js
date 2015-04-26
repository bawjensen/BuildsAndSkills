// =========================== Search and suggestions ===========================

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
    var fixed = $inputBox.attr('id') === 'header-search';
    $suggestionsBox.css({
        'position': fixed ? 'fixed' : 'absolute',
        'left': other.left,
        'top': (other.top + $inputBox.outerHeight() - 1) - (fixed ? $(window).scrollTop() : 0 ),
        'width': $inputBox.outerWidth(),
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

function searchKeyUpHandler(evt) {
    evt.preventDefault();
    var $selected = $('.suggestion.selected');
    var $this = $(this);
   
    if (evt.keyCode === 13) {
        window.location.href = '/' + $selected.text().toLowerCase();
    }
    else if (evt.keyCode === 40 || evt.keyCode === 38) { // Up or down
        // Handle the selection of a suggestion
        if ($selected.length) {
            $selected.removeClass('selected');

            if (evt.keyCode == 40) 
                $selected = $selected.next();
            else
                $selected = $selected.prev();

            $selected.addClass('selected');
        }
        else {
            var pseudoSelector;
            if (evt.keyCode === 40)
                pseudoSelector = ':first';
            else
                pseudoSelector = ':last';

            $selected = $('.suggestion' + pseudoSelector).addClass('selected');
        }

        // Handle the text within the input search
        if (bufferedString && $selected.length) {
            $this.val($selected.text());
        }
        else if (bufferedString && !$selected.length) {
            $this.val(bufferedString);
            bufferedString = undefined;
        }
        else if (!bufferedString && $selected.length) {
            bufferedString = $this.val();
            $this.val($selected.text());
        }
        else if (!bufferedString && !$selected.length) {
            // Impossible scenario?
        }

        // Handle the scrolling of the suggestion box
        if ($selected.length) {
            var $suggestions = $('.suggestion');
            var suggestionNum = $suggestions.index($selected);
            var suggestionHeight = $suggestions.outerHeight();
            var containerHeight = $selected.parent().height();

            var newOffset = ((suggestionNum+1) * suggestionHeight) - (containerHeight/2);

            $selected.parent().scrollTop(newOffset);
        }
    }
    else {
        populateSuggestions($this, $this.val());

        $('.suggestion:first').addClass('selected');
    }
}

// =========================== Advanced Info Toggling ===========================

function toggleHeaderAdvancedInfo(evt) {
    var $elem = $('.sm-hidden');
    $elem.css('display', $elem.css('display') == 'none' ? 'inline' : 'none');
}

// =========================== Champion Info State ==============================

function switchInfoState() {
    var thisId = $(this).attr('id');
    var otherId = $(this).siblings().attr('id');

    $('.' + thisId + '-info').show();
    $('.' + otherId + '-info').hide();

    $('#' + thisId).addClass('active');
    $('#' + otherId).removeClass('active');

    var $itemFiltering = $('#item-filtering');
    thisId == 'in-game' ? $itemFiltering.addClass('active') : $itemFiltering.removeClass('active');

    $.ajax({
        type: 'POST',
        url: '/info-state',
        data: { newState: thisId },
    }).done(function() {
        console.log('Updated');
    });
}

// =========================== Skill Order Toggling =============================

function skillHoverIn() {
    $(this).siblings('.skill-detail').addClass('shown');
}
function skillHoverOut() {
    $(this).siblings('.skill-detail').removeClass('shown');
}
function skillStickyOpenToggle(evt) {
    if (!($(evt.target).closest('.skill-detail').length)) { // If not clicking on the 'skill-detail'
        var $this = $(this).siblings('.skill-detail');

        if ($this.hasClass('sticky-open')) {
            $this.removeClass('sticky-open').removeClass('shown');
        }
        else {
            $this.addClass('sticky-open');
        }
    }
}

// =========================== Masteries Toggling ===============================

function masteryHoverIn() {
    $(this).find('.mastery-detail').addClass('shown');
}
function masteryHoverOut() {
    $(this).find('.mastery-detail').removeClass('shown');
}
function masteryStickyOpenToggle(evt) {
    if (!($(evt.target).closest('.mastery-detail').length)) { // If not clicking on the 'mastery-detail'
        var $this = $(this).find('.mastery-detail');

        if ($this.hasClass('sticky-open')) {
            $this.removeClass('sticky-open').removeClass('shown');
        }
        else {
            $this.addClass('sticky-open');
        }
    }
}

// =========================== Item Filtering ===================================

var cooldownTimerId; // Timing how long between adjustments of item cutoff,
                     // to only update when the user 'settled' on a value

function saveItemCutoff(newCutoff) {
    console.log('Saving cutoff:', newCutoff);

    $.ajax({
        type: 'POST',
        url: '/price-cutoff',
        data: { newCutoff: newCutoff },
    }).done(function() {
        console.log('Saved cutoff:', newCutoff);
    });
}

function handleItemHiding(evt) {
    var newCutoff = this.value;

    if (newCutoff === '') {
        return;
    }

    if (cooldownTimerId) window.clearTimeout(cooldownTimerId);
    cooldownTimerId = window.setTimeout(saveItemCutoff.bind(null, newCutoff), 1000); // Wait a second between changes in order to save

    $('.item-buy').each(function(i, entry) {
        var $entry = $(entry);
        if (parseInt($entry.data('gold')) < newCutoff) {
            $entry.addClass('cut-off');
        }
        else {
            $entry.removeClass('cut-off');
        }
    })
}


// =========================== Set up event callbacks ===========================

$(function() {
    // $('.display-all-items').click(function(evt) {
    //     evt.preventDefault();
    //     $('.purchase-group:not(:first-of-type) .item-buy.blacklisted').toggle();
    // });
    $('#item-cutoff').change(handleItemHiding).keyup(function() {
        $(this).change();
    });

    $('span.sm-toggler').click(toggleHeaderAdvancedInfo);

    $('span.info-switcher').click(switchInfoState);


    $('.skill-summary').hover(skillHoverIn, skillHoverOut);
    $('.skill-summary').click(skillStickyOpenToggle);


    $('.mastery-info').hover(masteryHoverIn, masteryHoverOut);
    $('.mastery-info').click(masteryStickyOpenToggle);

    $('.expand-buys').click(function() {
        var $this = $(this);

        $this.toggleClass('glyphicon-plus').toggleClass('glyphicon-minus');
        $this.siblings('.purchases').toggleClass('expanded');
    });


    $(document).on('mousedown', '.suggestion', function(evt) {
        window.location.href = '/' + $(evt.target).text().toLowerCase();
    });

    // --------------- Search and Suggestions ---------------

    $('#champ-finder, #header-search').focus(function(evt) {
        var $this = $(this);
        $('#'+SUGGESTION_BOX_ID).show();
        populateSuggestions($this, $this.val());
    });
    $('#champ-finder, #header-search').focusout(function(evt) {
        $('#'+SUGGESTION_BOX_ID).hide();
    });


    var bufferedString;
    $('#champ-finder, #header-search').keyup(searchKeyUpHandler);

    // --------------- Set up bootstrap tooltips ---------------

    $('[data-toggle="tooltip"]').tooltip({ html: true });
});