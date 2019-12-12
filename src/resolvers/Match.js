import "babel-polyfill";
import {ObjectID} from 'mongodb';

const Match = {
    teams: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const collection = db.collection("teams");

        return (await collection.find({$or: [{_id: ObjectID(parent.teams[0])}, {_id: ObjectID(parent.teams[1])}]}).toArray());
    },
};

export {Match as default};