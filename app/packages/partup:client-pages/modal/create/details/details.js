var FORM_ID = 'createPartupForm';

Template.modal_create_details.onCreated(function() {
    var partupId = Session.get('partials.create-partup.current-partup');
    this.subscribe('partups.one', partupId);

    this.submitting = new ReactiveVar(false);
});

/*************************************************************/
/* Widget helpers */
/*************************************************************/
Template.modal_create_details.helpers({
    currentPartup: function() {
        var partupId = Session.get('partials.create-partup.current-partup');
        var partup = Partups.findOne({_id: partupId});
        if (!partup) return;

        return partup;
    },
    submittingSkip: function() {
        return Template.instance().submitting.get() === 'skip';
    },
    submittingNext: function() {
        return Template.instance().submitting.get() === 'next';
    },
    submitting: function() {
        return !!Template.instance().submitting.get();
    },
    isCreate: function() {
        return !Session.get('partials.create-partup.current-partup');
    }
});

/*************************************************************/
/* Widget events */
/*************************************************************/
Template.modal_create_details.events({
    'click [data-submission-type]': function eventClickSetSubmissionType (event, template) {
        var button = event.currentTarget;
        var submissionType = button.getAttribute('data-submission-type');
        Session.set('partials.create-partup.submission-type', submissionType);

        if (button.type !== 'submit') {
            var form = template.find('#' + FORM_ID);
            $(form).submit();
        }
    }
});

/*************************************************************/
/* Widget create partup */
/*************************************************************/
var createOrUpdatePartup = function createOrUpdatePartup (partupId, insertDoc, callback, self) {
    if (partupId) {

        // Partup already exists. Update.
        Meteor.call('partups.update', partupId, insertDoc, function(error, partup) {
            if (error && error.reason) {
                Partup.client.notify.error(error.reason);
                AutoForm.validateForm(self.formId);
                self.done(new Error(error.message));
                return;
            }

            callback(partup);
        });

    } else {

        // Partup does not exists yet. Insert.
        Meteor.call('partups.insert', insertDoc, function(error, partup) {
            if (error && error.reason) {
                Partup.client.notify.error(error.reason);
                AutoForm.validateForm(self.formId);
                self.done(new Error(error.message));
                return;
            }
            analytics.track('Part-up created', {
                partupId: partup._id,
                userId: Meteor.user()._id,
            });
            Session.set('partials.create-partup.current-partup', partup._id);
            callback(partup);
        });

    }
};

/*************************************************************/
/* Widget form hooks */
/*************************************************************/
var afHooks = {};
afHooks[FORM_ID] = {
    onSubmit: function(insertDoc) {
        var self = this;
        var partupId = Session.get('partials.create-partup.current-partup');
        var submissionType = Session.get('partials.create-partup.submission-type') || 'next';

        var template = self.template.parent().parent();
        template.submitting.set(submissionType);

        createOrUpdatePartup(partupId, insertDoc, function(partup) {

            if (submissionType === 'next') {
                Router.go('create-activities', {_id: partup._id});
            } else if (submissionType === 'skip') {
                Intent.return('create', {
                    arguments: [partup.slug],
                    fallback_route: {
                        name: 'partup',
                        params: {
                            slug: partup.slug
                        }
                    }
                });
            }
        }, self);

        this.event.preventDefault();
        return false;
    }
};
AutoForm.hooks(afHooks);
