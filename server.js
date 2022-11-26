var dgram = require("dgram");
const { stringify } = require("querystring");

var server = dgram.createSocket("udp4");

lobbies = new Array();
allHosts = new Array();

const msgType = {
    PING : 0, 
    GET_LOBBIES : 1,
    CREATE_HOST : 2,
    JOIN_HOST : 3,
    PLAYER_JOINED: 4,
    READY: 5,
    START_GAME : 6,
    END_HOST: 7,
    CLEAR_LOBBIES: 8,
    RELAY: 9,
	QUIT : 10

}

const msgSource = {
    HOST : 0,
    CLIENT : 1
    
}

const port = process.env.PORT || 3002;

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
            data["ports"].push(rinfo.port);
            var clients = new Array();
            clients.push(remoteIP);
            data["clients"] = clients;
            lobbies.push(data);
            var newPacket = {type: msgType.GET_LOBBIES, data: lobbies};
            response = JSON.stringify(newPacket);
            server.send(response, rinfo.port, rinfo.address);
            break;
        case msgType.JOIN_HOST: 
            console.log("New player joining lobby: " + String(data) + "!");
            lobby = lobbies[data].players.push("me too!");
            lobbies[data].clients.push(rinfo.address);
            lobbies[data].ports.push(rinfo.port);
            var clientPacket = {type:msgType.PLAYER_JOINED, data: lobbies};
            response = JSON.stringify(clientPacket);
            server.send(response, rinfo.port, rinfo.address);
            console.log(response);
            var hostPacket = {type: msgType.PLAYER_JOINED, data: lobbies};
            response = JSON.stringify(hostPacket);
            console.log("Updating host lobby: " + String(data) + "!");
            var host = lobbies[data].hostIP;
            var hostPort = lobbies[data].ports[0];
            server.send(response, hostPort, host);
            break;
        case msgType.READY:
            var remoteIP = rinfo.address;
            var clients = [];
            var ports = [];
            var hostIP;
            for ( var i = 0; i < lobbies.length; i++) {
                var lobby = lobbies[i];
                if (lobby.hostIP == remoteIP)
                {
                    clients = lobby.clients;
                    ports = lobby.ports;
                    hostIP = lobby.hostIP;
                }
            }
            if (clients.length > 0)
            {
                var newPacket = {type: msgType.START_GAME, data: {clients, ports}};
                response = JSON.stringify(newPacket);
                for (var i = 0; i < clients.length; i++)
                {
                    server.send(response, ports[i], clients[i]);
                }
            }
            break;
        case msgType.END_HOST:
            var remoteIP = rinfo.address;
            var remotePort = rinfo.port;
            newLobbies = new Array();
            for ( var i = 0; i < lobbies.length; i++) {
                var lobby = lobbies[i];
                if (lobby.ports[0] != remotePort) {
                    newLobbies.push(lobby);
                }
            }
            lobbies = newLobbies;
            var newPacket = {type: msgType.GET_LOBBIES, data: lobbies};
            response = JSON.stringify(newPacket);
            server.send(response, rinfo.port, rinfo.address);            
            break;
        case msgType.CLEAR_LOBBIES:
            lobbies = new Array();
            var newPacket = {type: msgType.GET_LOBBIES, data: lobbies};
            response = JSON.stringify(newPacket);
            server.send(response, rinfo.port, rinfo.address);
            break;
        case msgType.RELAY:
            var destIP = packet["destIP"];
            var destPort = Math.trunc(packet["destPort"]);
            var gameData = packet["data"];
            //take in data from sender and pass it along to receipient
            var response = JSON.stringify(data);
            server.send(response, destPort, destIP);
            break;
        default:
            break;
    }

    console.log(response);

});

server.bind(port);
console.info("Listening on port " + (port));
