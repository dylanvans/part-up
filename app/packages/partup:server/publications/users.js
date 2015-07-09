/**
 * @name Partup.publications.usersCount
 * @memberof Partup.server.publications
 */
Meteor.publish('users.count', function() {
    Counts.publish(this, 'users', Meteor.users.find());
});

Meteor.publishComposite('users.one', function(userId) {
    return {
        find: function() {
            return Meteor.users.findSinglePublicProfile(userId);
        },
        children: [
            {
                find: function(user) {
                    return Images.find({_id: user.profile.image}, {limit: 1});
                }
            }
        ]
    };
});

Meteor.publishComposite('users.one.upperpartups', function(options) {
    var self = this;
    options = options || {};

    return {
        find: function() {
            return Partups.findUpperPartups(self.userId, options);
        }
    };
});

Meteor.publish('users.one.upperpartups.count', function(options) {
    var self = this;
    options = options || {};

    var parameters = {
        count: true
    };

    Counts.publish(this, 'users.one.upperpartups.filterquery', Partups.findUpperPartups(self.userId, options, parameters));
});

Meteor.publishComposite('users.one.supporterpartups', function(options) {
    var self = this;
    options = options || {};

    return {
        find: function() {
            return Partups.findSupporterPartups(self.userId, options);
        }
    };
});

Meteor.publish('users.one.supporterpartups.count', function(options) {
    var self = this;
    options = options || {};

    var parameters = {
        count: true
    };

    Counts.publish(this, 'users.one.supporterpartups.filterquery', Partups.findSupporterPartups(self.userId, options, parameters));
});

Meteor.publishComposite('users.loggedin', function() {
    var self = this;

    return {
        find: function() {
            return Meteor.users.findSinglePrivateProfile(self.userId);
        },
        children: [
            {
                find: function(user) {
                    return Images.find({_id: user.profile.image}, {limit: 1});
                }
            },
            {
                find: function(user) {
                    var networks = user.networks || [];

                    return Networks.guardedFind(user._id, {_id: {'$in': networks}});
                }
            },
            {
                find: function(user) {
                    return Notifications.find({for_upper_id: user._id}, {limit: 20});
                },
                children: [
                    {
                        find: function(notification) {
                            var images = [];

                            if (notification.type === 'partups_supporters_added') {
                                images.push(notification.type_data.supporter.image);
                            }

                            return Images.find({_id: {$in: images}});
                        }
                    }
                ]
            }
        ]
    };
});
