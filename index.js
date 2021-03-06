// On instancie express
const express = require("express");
const app = express();

// On charge "path"
const path = require("path");

// On autorise le dossier "public"
app.use(express.static(path.join(__dirname, "public")));

// On crée le server HTTP
const http = require("http").createServer(app);

// On instanie socket.io
const io = require("socket.io")(http);

// On charge sequelize
const Sequelize = require("sequelize");

// On fabrique le lien de la base de données
const dbPath = path.resolve(__dirname, 'chat');

// On se connecte a la base
const sequelize = new Sequelize("database", "username", "password",{
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: dbPath
});

// On charge le modèle "Chat"
const Chat = require("./Models/Chat")(sequelize, Sequelize.DataTypes);

// On effectue le chargement
Chat.sync();

// On crée la route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

// On ecoute l'evenement "connexion" de socket.io
io.on("connection", (socket) => {
    console.log("une connexion s'active");

    // On écoute les deconnexions
    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecter")
    })

    // On écoute les entrées dans les salles
    socket.on("enter_room", (room) => {
        // On entre dans la salle demandee
        socket.join(room);
        console.log(socket.rooms);

        // On envoie tous les messages du salon
        Chat.findAll({
            attributes: ["id", "name", "message", "room", "createdAt"],
            where:{
                room: room
            }
        }).then(list =>{
           socket.emit("init_messages", {messages: JSON.stringify(list)})
        });
    });

    // On écoute les sorties dans les salles
    socket.on("leave_room", (room) => {
        // On entre dans la salle demandee
        socket.leave(room);
        console.log(socket.rooms);
    })

    // On gere le chat
    socket.on("chat_message", (msg) => {
        // On stock nos message dans la bdd
        const message = Chat.create({
            name: msg.name,
            message: msg.message,
            room: msg.room,
            createdAt: msg.createdAt
        }).then(() => {
            //Le message est stocké, on le relaie à tous les utilisateurs dans le salon correspondant
            io.in(msg.room).emit("received_message", msg);
        }).catch(e => {
            console.log(e)
        });
    });


// On écoute les messages "typing"
    socket.on("typing", msg => {
        socket.to(msg.room).emit("usertyping", msg);
    });
});



// On demande au serveur HTPP de repondre sur le port 3000
http.listen(3000, () => {
    console.log("je repond sur le port 3000");
});