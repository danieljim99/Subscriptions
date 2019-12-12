import "babel-polyfill";
import dateTime from "date-time";
import {ObjectID} from 'mongodb';
import { PubSub } from "graphql-yoga";

const Mutation = {
    addTeam: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const collection = db.collection("teams");

        if(await collection.findOne({name: args.name})) {
            throw new Error(`The name ${args.name} is already in use`);
        }

        const team = {
            name: args.name,
        };

        return (await collection.insertOne(team)).ops[0];
    },

    addMatch: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const matchesCollection = db.collection("matches");
        const teamsCollection = db.collection("teams");

        args.teams.forEach(async (elem) => {
            if(!(await teamsCollection.findOne({_id: ObjectID(elem)}))){
                throw new Error(`The team ${elem} does not exist`);
            }
        });

        if(args.inGame === true && args.ended === true){
            throw new Error(`There can not be a match ended and in game at the same time`);
        }

        let match = {
            teams: args.teams.map(obj => ObjectID(obj)),
            date: dateTime(),
            inGame: args.inGame,
            ended: args.ended,
        };

        if(args.result){
            match = {
                ...match,
                result: args.result,
            };
        } else {
            match = {
                ...match,
                result: "0-0",
            }
        }

        return (await matchesCollection.insertOne(match)).ops[0];
    },

    updateInGameResult: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const collection = db.collection("matches");

        let result = await collection.findOne({_id: ObjectID(args.match)});

        if(!result){
            throw new Error(`The match ${args.match} does not exist`);
        }

        if(!result.inGame){
            throw new Error(`The match ${args.match} is not in game`);
        }

        const {pubsub} = context;
        pubsub.publish(args.match, {subscribeMatch: args.result});
        pubsub.publish(result.teams[0], {subscribeTeam: args.result});
        pubsub.publish(result.teams[1], {subscribeTeam: args.result});

        return (await collection.findOneAndUpdate({_id: ObjectID(args.match)}, {$set: {result: args.result}}, {returnOriginal: false})).value;
    },

    startMatch: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const collection = db.collection("matches");

        let result = await collection.findOne({_id: ObjectID(args.match)});

        if(!result){
            throw new Error(`The match ${args.match} does not exist`);
        }

        if(result.inGame){
            throw new Error(`The match ${args.match} is already started`);
        } else { 
            if(result.ended){
                throw new Error(`The match ${args.match} is already ended`);
            }
        }
        const {pubsub} = context;
        pubsub.publish(args.match, {subscribeMatch: "The match has just begun"});
        pubsub.publish(result.teams[0], {subscribeTeam: "The match has just begun"});
        pubsub.publish(result.teams[1], {subscribeTeam: "The match has just begun"});

        return (await collection.findOneAndUpdate({_id: ObjectID(args.match)}, {$set: {inGame: true}}, {returnOriginal: false})).value;
    },

    endMatch: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("subscriptions");
        const collection = db.collection("matches");

        let result = await collection.findOne({_id: ObjectID(args.match)});

        if(!result){
            throw new Error(`The match ${args.match} does not exist`);
        }

        if(result.ended){
            throw new Error(`The match ${args.match} is already ended`);
        } else {
            if(!result.inGame){
                throw new Error(`The match ${args.match} is not in game`);
            }
        }
        const {pubsub} = context;
        pubsub.publish(args.match, {subscribeMatch: `The match has just ended and the result is: ${result.result}`});
        pubsub.publish(result.teams[0], {subscribeTeam: `The match has just ended and the result is: ${result.result}`});
        pubsub.publish(result.teams[1], {subscribeTeam: `The match has just ended and the result is: ${result.result}`});

        return (await collection.findOneAndUpdate({_id: ObjectID(args.match)}, {$set: {inGame: false, ended: true}}, {returnOriginal: false})).value;
    },
};

export{Mutation as default};