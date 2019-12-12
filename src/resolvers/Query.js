import "babel-polyfill";

const Query = {
    teams: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const collection = db.collection("teams");

        return await collection.find({}).toArray();
    },

    matches: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const collection = db.collection("matches");

        return await collection.find({}).toArray();
    },
};

export {Query as default};