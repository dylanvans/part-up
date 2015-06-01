/*************************************************************/
/* Widget initial */
/*************************************************************/
Template.WidgetStartPromote.onRendered(function () {
    var template = this;

    var elm = template.find('[data-copy-to-clipboard]');

    // Copy to clipboard
    Partup.ui.clipboard.applyToElement(elm, elm.value, function onCopySuccess() {
        Partup.ui.notify.success(__('startpromote-notify-copy-to-clipboard-success'));
    }, function onCopyError() {
        Partup.ui.notify.error(__('startpromote-notify-copy-to-clipboard-error'));
    });

    template.autorun(function () {
        var partup = getPartup();

        if (partup) {
            var image = Images.findOne({ _id: partup.image });

            if (image) {
                var focuspointElm = template.find('[data-partupcover-focuspoint]');
                template.focuspoint = new Focuspoint.View(focuspointElm, {
                    x: image.focuspoint.x,
                    y: image.focuspoint.y
                });
            }
        }
    });
});

Template.WidgetStartPromote.onCreated(function () {
    var template = this;

    template.shared = new ReactiveVar({
        twitter: false,
        facebook: false,
        linkedin: false
    });
});

/*************************************************************/
/* Widget Functions */
/*************************************************************/
var getPartup = function () {
    var partupId = Session.get('partials.start-partup.current-partup');
    return Partups.findOne({ _id: partupId });
};

var partupUrl = function() {
    var partupId = Router.current().params._id;
    return Router.url('partup', {_id:partupId});
}

/*************************************************************/
/* Widget helpers */
/*************************************************************/
Template.WidgetStartPromote.helpers({
    Partup: Partup,

    placeholders: Partup.services.placeholders.startdetails,

    partup: getPartup,

    partupUrl: function () {
        return partupUrl();
    },

    shared: function () {
        return Template.instance().shared.get();
    }

});

/*************************************************************/
/* Widget events */
/*************************************************************/
Template.WidgetStartPromote.events({

    'click [data-share]': function sharePartup(event, template) {
        var socialTarget = $(event.currentTarget).data("share");
        var sharedSocials = template.shared.get();

        if (!sharedSocials[socialTarget]) {
            sharedSocials[socialTarget] = true;
            template.shared.set(sharedSocials);
        }
    },

    'click [data-copy-to-clipboard]': function eventCopyToClipboard(event) {
        var elm = event.currentTarget;

        // Select elements text
        elm.select();
    },

    'click [data-action-topartup]': function eventToPartup(event) {
        event.preventDefault();
        var partupId = Router.current().params._id;
        Partup.ui.intent.executeIntentCallback('start', [partupId], function (id) {

            // Router go
            Router.go('partup', { _id: id });

        });
    },

    'click [data-share-facebook]': function clickShareFacebook() {
        var url = partupUrl();
        var facebookUrl = Partup.ui.socials.generateFacebookShareUrl(url);
        window.open(facebookUrl, 'pop', 'width=600, height=400, scrollbars=no');
    },

    'click [data-share-twitter]': function clickShareTwitter(event, template) {
        var url = partupUrl();
        var message = getPartup().name;
        // TODO: I18n + wording
        var twitterUrl = Partup.ui.socials.generateTwitterShareUrl(message, url);
        window.open(twitterUrl, 'pop', 'width=600, height=400, scrollbars=no');
    },

    'click [data-share-linkedin]': function clickShareLinkedin() {
        var url = partupUrl();
        var linkedInUrl = Partup.ui.socials.generateLinkedInShareUrl(url);
        window.open(linkedInUrl, 'pop', 'width=600, height=400, scrollbars=no');
    }

});