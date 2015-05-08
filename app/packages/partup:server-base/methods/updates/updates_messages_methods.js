Meteor.methods({
    /**
     * Insert a Message
     *
     * @param {string} partupId
     * @param {mixed[]} fields
     */
    'updates.messages.insert': function (partupId, fields) {
        var upper = Meteor.user();
        if (! upper) throw new Meteor.Error(401, 'Unauthorized.');

        var newMessage = Partup.transformers.update.fromFormNewMessage(fields, upper, partupId);
        newMessage.type = 'partups_message_added';

        try {
            newMessage._id = Updates.insert(newMessage);

            return {
                _id: newMessage._id
            }
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'error-method-updates-messages-insert-failure');
        }
    },

    /**
     * Update a Message
     *
     * @param {string} updateId
     * @param {mixed[]} fields
     */
    'updates.messages.edit': function (updateId, fields) {
        var upper = Meteor.user();
        if (! upper) throw new Meteor.Error(401, 'Unauthorized.');

        try {
            var update = Updates.findOneOrFail(updateId);

            Updates.update({
                    _id: update._id
                },
                {
                    $set: {
                        type: 'partups_message_updated',
                        type_data: {
                            old_value: update.new_value,
                            new_value: fields.text,
                            images: fields.images
                        },
                        updated_at: new Date()
                    }
                }
            );

            return {
                _id: update._id
            }
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'error-method-updates-messages-insert-failure');
        }
    }

});
