/**
 * Render invite to network functionality
 *
 * @module client-invite-to-network
 *
 */
Template.InviteToNetwork.onCreated(function() {
    var template = this;
    template.submitting = new ReactiveVar(false);
});

Template.InviteToNetwork.helpers({
    formSchema: Partup.schemas.forms.inviteUpper,
    submitting: function() {
        return Template.instance().submitting.get();
    }
});

AutoForm.hooks({
    inviteToNetworkForm: {
        onSubmit: function(insertDoc, updateDoc, currentDoc) {
            var self = this;
            var template = self.template.parent();

            var parent = Template.instance().parent();
            parent.submitting.set(true);

            Meteor.call('networks.invite_by_email', template.data.networkId, insertDoc.email, insertDoc.name, function(error, result) {
                parent.submitting.set(false);
                if (error) {
                    return Partup.client.notify.error(__('base-errors-' + error.reason));
                }
                Partup.client.notify.success(__('invite-to-network-popup-success'));
                Partup.client.popup.close();
            });

            return false;
        }
    }
});