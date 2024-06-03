
//const express = require('express');
const http = require("http");
const cors = require("cors")
const WebSocket = require("ws");
const { SocketLogger } = require( './logs/winston' );
const { NewRoom } = require( './types/Room' );
const  cron  = require("node-cron")


const server = http.createServer();
const wss = new WebSocket.Server({server});
const room = NewRoom()
const { Kafka } = require("kafkajs");



const kafka = new Kafka({
    clientId : 'chat-poducer-1',
    brokers: ['localhost:19092']
})
const topic = "test-topic"

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'test-group' });

cron.schedule('*/5 * * * * *', async () => {
    try {
        await producer.connect()

        await producer.send({
            topic,
            messages:[
                {value: '10.112.58.92:1010'}
            ]
        })

    } catch (error) {
        console.error("Error Sending message from cron job",error)
    }
})



getMessage = async () => {
    try {
        await consumer.connect()
        await consumer.subscribe({
            topic,
            fromBeginning: true
        })
        
        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
                console.log(`- ${prefix} ${message.key}#${message.value}`)
            }
        })  
    } catch (error) {
        console.error("Error Sending message from cron job",error)
    }
}

getMessage()

wss.on("connection", (ws, req) => {
    //사용자 정보 가져오기
    const cookie = req.headers.cookie;
    const [_, user] = cookie.substring(cookie.indexOf("auth=")).split("=")
    console.log("user", user)

    room.Join(ws)
    ws.on("message", (msg) => {
        const jsonData = JSON.parse(msg);
        jsonData.Name = user
        room.forwardMessage(jsonData);
    })
})
wss.on("close",(ws, req) => {
    room.Leave(ws)
})

const PORT = process.env.PORT || '8080';
server.listen(PORT, ()=> {
    SocketLogger.info(`Server started On port=${PORT}`)
})






