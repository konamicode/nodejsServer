var dgram = require("dgram");

var server = dgram.createSocket("udp4");

lobbies = new Array();

const msgType = {
    PING : 0, 
    GET_LOBBIES : 1,
    CREATE_HOST : 2,
    JOIN_HOST : 3,
    START_GAME : 4,
	QUIT : 5

}

const port = process.env.port || 8080;

server.on("message", function(msg, rinfo) {
    console.log(String(msg));
    packet = JSON.parse(msg);
    data = packet["data"];
    var response;
    switch(packet.type) {
        case msgType.GET_LOBBIES:
            console.log("Getting lobby list!");
            var newPacket = {type: msgType.GET_LOBBIES, data: lobbies};
            response = JSON.stringify(newPacket);
            server.send(response, rinfo.port, rinfo.address);
            break;
        case msgType.CREATE_HOST:
            var remoteIP = rinfo.address;
            data["hostIP"] = remoteIP;
            lobbies.push(data);
            var newPacket = {type: msgType.GET_LOBBIES, data: lobbies};
            response = JSON.stringify(newPacket);
            server.send(response, rinfo.port, rinfo.address);
            break;
        case msgType.JOIN_HOST: 
            lobby = lobbies[data].players.push("me too!");
            var newPacket = {type: msgType.GET_LOBBIES, data: lobbies};
            response = JSON.stringify(newPacket);
            server.send(response, rinfo.port, rinfo.address);
            var host = lobbies[data].hostIP;
            server.send(response, rinfo.port, host);
            break;
        default:
            break;
    }

    console.log(response);

});

server.bind(port);
console.log("Waiting on ${port}");
