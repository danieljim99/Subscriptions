const Subscription = {
    subscribeMatch: {
        subscribe: (parent, args, context, info) => {
            const {pubsub} = context;
            return pubsub.asyncIterator(args.match);
        },
    },

    subscribeTeam : {
        subscribe: (parent, args, context, info) => {
            const {pubsub} = context;
            return pubsub.asyncIterator(args.team);
        },
    }
};

export {Subscription as default};