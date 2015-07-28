/*************************************************************/
/* Widget initial */
/*************************************************************/
Template.ActivityView.onCreated(function() {
    var tpl = this;

    tpl.expanded = new ReactiveVar(!!tpl.data.EXPANDED || !!tpl.data.CREATE_PARTUP);

    tpl.updateContribution = function(contribution, cb) {
        var activityId = tpl.data.activity ? tpl.data.activity._id : tpl.data.activity_id;
        Meteor.call('contributions.update', activityId, contribution, cb);
    };
});

/*************************************************************/
/* Widget helpers */
/*************************************************************/
Template.ActivityView.helpers({
    partup: function() {
        return Partups.findOne(this.activity.partup_id);
    },
    commentsCount: function() {
        var update = Updates.findOne({_id: this.activity.update_id});
        if (!update) return;
        return update.comments_count;
    },
    contributions: function() {
        if (!this.activity || this.contribution_id) return;

        return Contributions.find({activity_id: this.activity._id, archived: {$ne: true}}).fetch();
    },
    contribution: function() {
        if (!this.contribution_id) return;

        return Contributions.findOne({_id: this.contribution_id});
    },
    expanded: function() {
        return Template.instance().expanded.get();
    },
    showChevron: function() {
        return this.EXPANDABLE && !Template.instance().expanded.get() && !this.contribution_id;
    },
    showEditButton: function() {
        return !this.READONLY && this.isUpper && Template.instance().expanded.get();
    },
    showMetaData: function() {
        return (this.activity && this.activity.end_date) || this.COMMENTS_LINK;
    },
    showInviteButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        return true;
    },
    showContributeButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        var contributions = Contributions.find({activity_id: this.activity._id}).fetch();
        for (var i = 0; i < contributions.length; i++) {
            if (contributions[i].upper_id === user._id && !contributions[i].archived) return false;
        }

        return true;
    },
    updateContribution: function() {
        return Template.instance().updateContribution;
    },
    upper: function(event, template) {
        return Meteor.users.findOne({_id: this.upper_id});
    },
    isReadOnly: function() {
        return Template.instance().data.READONLY;
    },
    update: function() {
        return Updates.findOne({_id: this.updateId || Template.instance().data.activity.update_id});
    },
    popupId: function() {
        return 'popup.motivation.' + (this.updateId || Template.instance().data.activity.update_id);
    }
});

/*************************************************************/
/* Widget events */
/*************************************************************/
Template.ActivityView.events({
    'click [data-activity-edit]': function(event, template) {
        template.data.edit.set(true);
    },
    'click [data-activity-expander]': function(event, template) {
        if (!template.data.EXPANDABLE) return;

        var opened = template.expanded.get();
        template.expanded.set(!opened);
    },
    'click [data-contribute]': function(event, template) {
        event.preventDefault();

        var contribute = function() {
            var partup = Partups.findOne({_id: template.data.activity.partup_id});
            if (!partup) {
                // When this happens, the partup subscription is probably not ready yet
                Partup.client.notify.error('Couldn\'t proceed your contribution. Please try again!');
                return;
            }

            if (!partup.hasUpper(Meteor.user()._id)) {
                var popupId = 'popup.motivation.' + (template.data.updateId || template.data.activity.update_id);
                Partup.client.popup.open(popupId, function(success) {
                    if (success) {
                        template.updateContribution({}, function(error) {
                            if (error) {
                                console.error(error);
                                return;
                            }
                            analytics.track('new contribution', {
                                partupId: partup._id,
                                userId: Meteor.user()._id,
                                userType: 'supporter'
                            });
                        });
                    }
                });
            } else {
                template.updateContribution({}, function(error) {
                    if (error) {
                        console.error(error);
                        return;
                    }

                    analytics.track('new contribution', {
                        partupId: partup._id,
                        userId: Meteor.user()._id,
                        userType: 'upper'
                    });

                });
            }
        };

        if (Meteor.user()) {
            contribute();
        } else {
            Intent.go({route: 'login'}, function() {
                contribute();
            });
        }
    },
    'click [data-invite]': function(event, template) {
        event.preventDefault();
        var partup = Partups.findOne({_id: template.data.activity.partup_id});
        Intent.go({
            route: 'partup-activity-invite',
            params: {
                slug: partup.slug,
                activity_id: template.data.activity._id
            }
        });
    },
});
