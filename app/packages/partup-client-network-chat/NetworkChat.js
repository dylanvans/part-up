Template.NetworkChat.onCreated(function() {
    var template = this;
    var networkSlug = template.data.networkSlug;
    var chatId = undefined;

    template.searching = false;
    template.LIMIT = 20;
    template.SEARCH_LIMIT = 20;
    template.bottomBarHeight = new ReactiveVar(68);
    template.loadingOlderMessages = false;

    var initialize = function(chat_id) {
        chatId = chat_id;
        startMessageCollector(chat_id);
    };

    var chatSubscriptionHandler = function() {
        var network = Networks.findOne({slug: networkSlug});
        var chat = Chats.findOne({_id: network.chat_id || 0});
        if (chat) {
            // if a chat is available, continue
            initialize(chat._id);
        }
    };

    template.autorun(function() {
        var network = Networks.findOne({slug: networkSlug});
        var chat = Chats.findOne({_id: network.chat_id || 0});
        if (chat && chat._id) Meteor.call('chats.reset_counter', chat._id);
    });

    var chatSubscription = template.subscribe('networks.one.chat', networkSlug, {limit: template.SEARCH_LIMIT}, {onReady: chatSubscriptionHandler});
    template.limitReached = new ReactiveVar(false);
    template.messageLimit = new ReactiveVar(template.LIMIT, function(oldLimit, newLimit) {
        if (oldLimit === newLimit) return;

        chatSubscription = template.subscribe('networks.one.chat', networkSlug, {limit: newLimit}, {
            onReady: function() {
                var messagesCount = ChatMessages.find({chat_id: chatId}, {limit: newLimit}).count();
                var totalNewMessages = messagesCount - oldLimit;
                if (totalNewMessages < 1) {
                    template.limitReached.set(true);
                } else {
                    template.loadingOlderMessages = false;
                }
            }
        });
    });

    template.loadOlderMessages = function() {
        if (template.loadingOlderMessages || template.searching || Partup.client.chat.showingContext) return;
        template.loadingOlderMessages = true;
        if (template.limitReached.get()) return;
        template.messageLimit.set(template.messageLimit.get() + template.LIMIT);
    };

    // search
    template.searchQuery = new ReactiveVar('', function(oldValue, newValue) {
        if (oldValue === newValue) return;

        template.searching = (typeof newValue === 'string') && newValue.length;
        if (!template.searching) return;

        Meteor.call('chatmessages.search_in_network', networkSlug, newValue, {limit: template.LIMIT}, function(err, res) {
            if (err) return;
            var results = res.sort(Partup.client.sort.dateASC.bind(null, 'created_at'));
            template.reactiveMessages.set(results);
            _.defer(Partup.client.chat.instantlyScrollToBottom);
        });
    });
    var setSearchQuery = function(query) {
        template.searchQuery.set(query);
    };
    template.throttledSetSearchQuery = _.throttle(setSearchQuery, 500, {trailing: true});

    template.onMessageClick = function(messageClickEvent) {
        var message_id;
        if (messageClickEvent.message.hash) {
            message_id = messageClickEvent.message.hash;
        } else if (!messageClickEvent.searching && !Partup.client.chat.showingContext) {
            return;
        } else {
            message_id = messageClickEvent.message._id;
        }
        Meteor.call('chatmessages.get_context', networkSlug, message_id, {limit: template.SEARCH_LIMIT}, function(err, res) {
            if (err) return;
            template.reactiveMessages.set(res);
            var fullMessage = lodash.find(res, {_id: messageClickEvent.message._id || messageClickEvent.message.hash});
            Partup.client.chat.showMessageContext(fullMessage);
        });
    };

    // messages
    var localChatMessagesCollection = [];
    template.reactiveMessages = new ReactiveVar([]);
    var startMessageCollector = function(chat_id) {

        // gets chatmessages and stores them in localChatMessagesCollection
        template.autorun(function(computation) {
            // run this autorun when the searchquery changes
            var searchQuery = template.searchQuery.get();

            // don't do anything if the user is searching
            // or if a message is not processed yet (scraper)
            if (template.searching || Partup.client.chat.showingContext) return;

            var limit = template.messageLimit.get();
            var messages = ChatMessages
                .find({chat_id: chat_id}, {sort: {created_at: 1}})
                .fetch();

            // wrapped in nonreactive to prevent unnecessary autorun
            Tracker.nonreactive(function() {
                template.reactiveMessages.set(messages);
            });
        });

        template.autorun(function(c) {
            c.stop();
            var controller = Iron.controller();
            var hash = controller.getParams().hash;
            if (hash) {
                template.onMessageClick({
                    searching: true,
                    message: {
                        _id: hash
                    }
                });
            }
        });
    };
});

Template.NetworkChat.helpers({
    config: function() {
        var template = Template.instance();
        var network = Networks.findOne({slug: template.data.networkSlug});
        if (!network.chat_id) return false;
        return {
            messageView: function() {
                return {
                    chatId: network.chat_id,
                    onScrollTop: {
                        handler: template.loadOlderMessages,
                        offset: 400
                    },
                    onNewMessagesViewed: lodash.noop,
                    onMessageClick: template.onMessageClick,
                    placeholderText: TAPi18n.__('pages-app-network-chat-empty-placeholder'),
                    reactiveMessages: template.reactiveMessages,
                    reactiveHighlight:  template.searchQuery,
                    reactiveBottomBarHeight: template.bottomBarHeight,
                    onClearContext: template.throttledSetSearchQuery,
                    messageInputSelector: '[data-messageinput]'
                };
            },
            bottomBar: function() {
                return {
                    chatId: network.chat_id,
                    reactiveBottomBarHeight: template.bottomBarHeight,
                    messageInputSelector: '[data-messageinput]'
                };
            },
            sideBar: function() {
                return {
                    networkSlug: template.data.networkSlug,
                    onSearch: template.throttledSetSearchQuery
                };
            }
        };
    },
    data: function() {
        var template = Template.instance();
        var network = Networks.findOne({slug: template.data.networkSlug});
        return {
            network: function() {
                return network;
            },
            chatId: function() {
                return network.chat_id;
            },
            reactiveMessages: function() {
                return template.reactiveMessages;
            }
        };
    }
});
