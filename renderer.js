// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

let networkDrive = require("windows-network-drive");
const fs = require("fs");
const fse = require("fs-extra");
const jetpack = require("fs-jetpack");
const os = require("os");

let folders = [];

const username = os.userInfo().username;

document.getElementById("dirs").addEventListener("click", (evt) => {
    evt.preventDefault();
    window.postMessage({
        type: "select-dirs",
    });
});

window.require("electron").ipcRenderer.on("ping", (event, message) => {
    console.log("nice");
    message.forEach((message) => {
        folders.push(message);
        let element = document.createElement("li");
        let imgElement = document.createElement("img");
        let pElement = document.createElement("p");
        imgElement.src = "./assets/folder.png";
        imgElement.className = "folderImage";
        pElement.innerHTML = message;
        element.className = "syncFolder";
        element.appendChild(imgElement);
        pElement.className = "folderLabel";
        element.appendChild(pElement);
        document.getElementById("folders").appendChild(element);
    });
});

document.getElementById("user").innerHTML =
    username.charAt(0).toUpperCase() + username.slice(1);

document.getElementById("settings").addEventListener("submit", (evt) => {
    evt.preventDefault();

    document.getElementById("sync").className = "syncing";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const server = document.getElementById("server").value;

    writeConfigFile(server);

    mapDrive().then((document.getElementById("sync").className = "success"));
});

function startScheduler() {
    var Service = require("node-windows").Service;

    // Create a new service object
    var svc = new Service({
        name: "LIMESYNC Scheduler",
        description: "The nodejs.org example web server.",
        script: "C:\\path\\to\\helloworld.js",
    });

    // Listen for the "install" event, which indicates the
    // process is available as a service.
    svc.on("install", function () {
        svc.start();
    });

    svc.install();
}

async function mapDrive(server, username, password) {
    networkDrive
        .mount(`\\\\${server}`, undefined, username, password)
        .catch((error) => {
            console.log(error);
        })
        .then(function (driveLetter) {
            writeFolders(driveLetter);

            unmountNetworkDrive(driveLetter);
        });
}

function unmountNetworkDrive(driveLetter) {
    networkDrive
        .unmount(driveLetter)
        .catch((e) => {
            console.log(e);
        })
        .then((value) => {
            console.log("success!");
        });
}

function writeFolders(driveLetter) {
    for (let index = 0; index < folders.length; index++) {
        const folder = folders[index];
        // To copy a folder or file, select overwrite accordingly
        try {
            fse.copySync(
                folder,
                `${driveLetter}:/${folder.substring(3).replace("\\", "/")}`,
                {
                    overwrite: true | false,
                }
            );
        } catch (err) {
            console.error(err);
        }
    }
}

function writeConfigFile(server) {
    jetpack.write("./fileSync.txt", `${server}; [${folders.join(",")}]`);
}
