// on se connecte au serveur socket
const socket = io();

// On gere l'arrivée d'un nouvel utilisateur
socket.on("connect", () => {
    // On émet un message d'entrée dans une salle
    socket.emit("enter_room", "general")
});
window.onload = () => {
    // on écoute l'evenement submit
    document.querySelector("form").addEventListener("submit", (e) => {
        // on empeche l'envoi du form
        e.preventDefault();
        const name = document.querySelector("#name")
        const message = document.querySelector("#message")
        // on recupere le nom de la salle
        const room = document.querySelector("#tabs li.active").dataset.room;
        const createdAt = new Date();

        // on envoie le message
        socket.emit("chat_message", {
            name: name.value,
            message: message.value,
            room: room,
            createdAt: createdAt
        });

        // on efface le message
        document.querySelector("#message").value = "";
    });

    // on ecoute l'evenement "received_message"
    socket.on("received_message", (msg) => {
        publishMessages(msg);
    })

    // on ecoute le clic sur les onglets
    document.querySelectorAll("#tabs li").forEach((tab) => {
        tab.addEventListener("click", function () {
            // On verifi si l'onglet n'est pas actif
            if (!this.classList.contains("active")) {
                // On recupere l'element actuelle actif
                const actif = document.querySelector("#tabs li.active");
                actif.classList.remove("active");
                this.classList.add("active");
                document.querySelector("#messages").innerHTML = "";
                // on quitte l'ancienne salle
                socket.emit("leave_room", actif.dataset.room);
                // on entre dans la nvlle salle
                socket.emit("enter_room", this.dataset.room);

            }
        })
    });

    // On écoute l'evenement "init_messages"
    socket.on("init_messages", msg => {
        let data = JSON.parse(msg.messages);
        if (data != []) {
            data.forEach(donnees => {
                publishMessages(donnees);
            })
        }
    });

    // On écoute la frappe au clavier
    document.querySelector("#message").addEventListener("input", () => {
        // On récupère le nom
        const name = document.querySelector("#name").value;
        // On récupère le salon
        const room = document.querySelector("#tabs li.active").dataset.room;

        socket.emit("typing", {
            name: name,
            room: room
        });
    });

    // On écoute les messages indiquant que quelqu'un tape au clavier
    socket.on("usertyping", msg => {
        const writing = document.querySelector("#writing");

        writing.innerHTML = `${msg.name} tape un message...`;

        setTimeout(function(){
            writing.innerHTML = "";
        }, 5000);
    });
}

function publishMessages(msg){
    let created = new Date(msg.createdAt);
    let texte = `<div><p>${msg.name} <small>${created.toLocaleDateString()}</small></p><p>${msg.message}</p></div>`

    document.querySelector("#messages").innerHTML += texte;
}
