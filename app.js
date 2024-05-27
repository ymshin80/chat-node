
//const express = require('express');
const http = require("http");
const cors = require("cors")
const WebSocket = require("ws");
const { SocketLogger } = require( './logs/winston' );
const { NewRoom } = require( './types/Room' );



const server = http.createServer();
const wss = new WebSocket.Server({server});
const room = NewRoom()

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






