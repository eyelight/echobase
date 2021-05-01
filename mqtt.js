let myself = "Jason";

const client = new Paho.MQTT.Client("192.168.1.140", 8881, "/mqtt", myself + new Date().getTime());

defaultTopic = "mqtt/solo-wheelbase"

const subs = new SubState(myself); // this will hold our subscription state

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

client.connect({ onSuccess: onConnect })

let count = 0

function onConnect() {
    spit("onConnect");
    setTimeout(() => {
        showConnected();
    }, 1500);
    console.log("Subscribing to: " + defaultTopic)
    client.subscribe(defaultTopic) // subscribe to our topic
    /*setInterval(()=> {
        publish(defaultTopic, `The count is now ${count++}`)
    }, 30000) // publish every 5s */
    initializeValues();
}

function onConnectionLost(responseObject) {
    showDisconnected();
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
    client.connect({ onSuccess: onConnect });
}

const publish = (topic, msg) => { // takes topic and message string
    if (verboseLogging) {
        console.log("Publishing to:", topic, 'Msg:', msg)
    }
    let message = new Paho.MQTT.Message(msg);
    message.destinationName = topic;
    client.send(message);
}

function onMessageArrived(message) {
    let el = document.createElement('div')
    el.innerHTML = message.payloadString
    document.body.appendChild(el)
}

function addListenerTopic(topic) {
    client.subscribe(topic);
    spit("Subscribing to topic: " + topic);
}


// EchoBase.js


// 'avast' is a sailing term for "stop everything!" yelled when some shit is about to hit some fan
// in our context, it is mission critical for the SOLO to move carefully and not go rogue
//
// when avast is false, commands to the SOLO will go out normally
// when avast is first set to true, two things will happen:
//    1. an "avast" message will be sent over MQTT, obeyed by Wheelbase firmware even when motor events are happening
//      1a. on the Wheelbase firmware, a 30-second period will begin, 
//          during which, all pending commands are dropped & incoming commands ignored
//      1b. after 30 seconds, the Wheelbase will send an MQTT update "ready to receive"
//      1c. a "resume" command may be sent by the Solo remote crew
//          a quorum could be required -- three "resume" commands
//    2. all echobase commands from EchoBase will be muted, signified by a red outline around the whole page
//        2a. this is different than using the CapsLock key (or the button) to "Mute" yourself from giving commands. But during an avast condition, no commands are heeded by the device firmware and all motors are stopped.
//

let echoBaseUser = "";
let verboseLogging = true;
let wheelbaseTopicPrefix = "/wheelbase/";
let unitTopic = "";
let wheelbaseTopic = "";
let liftTopic = "";
let witnessTopic = "";
let pomLink = "";
let witnessLink = "";
let witnessID = 0;
let wheelbaseID = 0;
let liftID = 0;
let liftHeight = 0;
let twistRate = 0;
let slideRate = 0;
let avast = false; 
let mute = false;

function toggleVerboseLogging() {
    if (verboseLogging) {
        console.log("Turning off verbose logging.")
        verboseLogging = false;
        return;
    }
    console.log("Turning on verbose logging.");
    verboseLogging = true;
    return;
}

function initializeValues() {
    // take the initial values and insert them into the elements that have dropdowns
    onWitnessCamChange();
    onWheelbaseChange();
    onTwistRateChange();
    onSlideRateChange();
    return;
}

function setEchoBaseUser(u) {
    subs.myself = u;
}

function getEchoBaseUser() {
    return subs.myself;
}

function showConnected() {
    let b = document.getElementById("Header");
    //document.querySelector("body").classList.add("avast");
    b.classList.remove("disconnected");
    b.classList.add("connected");
}

function showDisconnected() {
    let b = document.getElementById("Header");
    //document.querySelector("body").classList.add("avast");
    b.classList.remove("connected");
    b.classList.add("disconnected");
}

function buildTopic(t, device) {
    switch (t) {
        case "unit":
            if (device == "") {
                return subs.topicPrefix+subs.soloListener;
            }
            return subs.topicPrefix+device;
        case "wheelbase":
            if (device == "") {
                if (subs.wheelbaseListeners.length > 1) {
                    spit("buildTopic() needs a device ID");
                    return;
                } else {
                    return subs.topicPrefix+subs.soloListener+subs.wheelbaseTopicPrefix+subs.wheelbaseListeners[0];
                }
            }
            return subs.topicPrefix+subs.soloListener+subs.wheelbaseTopicPrefix+device;
        case "lift":
            if (device == "") {

            }
            str += "/lift/" + liftID;
            return str;
            break;
        case "witness":
            str += "/witness/" + witnessID;
            return str;
            break;
        case "dm":
            str += "/" + myself;
            return str;
        case "chat":
            str += "/crew";
            return str;
        default:
            console.log("buildTopic() needs a context to be passed");
            return;
    }
}

function getSoloUnitID() {
    return subs.soloUnit;
}

function setSoloUnitID(i) {
    soloUnit = i;
}

function setPOMLink(l) {
    pomLink = l;
}

function getPOMLink() {
    return pomLink;
}


function handleIncomingMQTT() {
    // not sure whether i'll be handing off to the mqtt.js functionality
    // or if it will hand off to me
    // but we need to change things when incoming telemetry comes in
}

function handleAvast() {
    let b = document.getElementById("Body");
    spit("Avast: " + avast);
    //document.querySelector("body").classList.add("avast");
    b.classList.add("avast");
    if(!avast) {
        disableButton("AvastBtn");
        const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodTwist, subs.getTwistRate(), subs.getPivot(), mqttCommandWBDirectionCounterClock, mqttCommandWBAvast);
        cmd.spit();
        cmd.send();
        autoEnableButton("AvastBtn", 1000);
        avast = true;
        return;
    }
    handleResume();
//    avastMessage();
    return;
}

function handleResume() {
    let b = document.getElementById("Body");
    spit("Avast: " + avast);
    //document.querySelector("body").classList.remove("avast");
    b.classList.remove("avast");
    if(avast) {
        avast = false;
        disableButton("AvastBtn");
        const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodTwist, subs.getTwistRate(), subs.getPivot(), mqttCommandWBDirectionClockwise, mqttCommandWBResume);
        cmd.spit();
        cmd.send();
        autoEnableButton("AvastBtn", 1000);
        return;
    }
    avastMessage();
    return;
}

function handleUnmute() {
    if (mute) {
        // if we're already muted, handle the un-mute
        // remove the elements that signify muting
        
        //document.getElementByID("mutebox").remove;
        //document.body.removeChild(mutebox);
        
        // set the mute flag to false
        mute = false;
        spit("Mute: " + mute);
    }
    return;
}

function handleMute() {
    let muteButton = document.getElementById("MuteBtn");
    let mutebox = document.createElement("button");
    if (!mute) {
        // if we're not muted, handle a mute
        
        // remove the mute event listener from MuteBtn and change to unmute
        //muteButton.removeEventListener("click", handleMute);
        //muteButton.addEventListener("click", handleUnmute);
        muteButton.innerHTML = "MUTED";
        
        // add elements that signify muting
        mutebox.setAttribute("id", "mutebox");
        //mutebox.setAttribute("onclick", "handleUnmute()");
        mutebox.addEventListener("click", handleMute);
        mutebox.innerHTML = "<div class='transbox'><p>You're muted. Click to unmute.</p></div>";
        mutebox.classList.add("mutebox");
        document.body.appendChild(mutebox);
        
        // set the mute flag to true
        mute = true;
        spit("Mute: " + mute);
    } else if (mute) {
        // change button text state
        muteButton.innerHTML = "MUTE";
        
        // remove elements that signify muting
        theMuteBox = document.getElementById("mutebox");
        theMuteBox.remove();
        
        // set mute flag to false
        mute = false;
        spit("Mute: " + mute);
    }
    return;
}

function handleCapsLock(event) {
    if (event.getModifierState('CapsLock') == true) {
        spit("CAPSLOCK IS........on");
        // TODO: come back to this, my keyboard doesn't have a LED indicator and setting this logic is annoying without one
        // TODO: Seems like Shift+Return key is also a trigger for this toggle, ugh
        if (mute) { handleMute(); }
    } else if (event.getModifierState('CapsLock') == false) {
        spit("capslock is offffff");
        if (!mute) { handleMute(); }
    }
    return;
}

function onSoloUnitChange() {
    //update the text of the document title & header
    document.getElementById("TopHeader").innerHTML = `EchoBase <br />(Solo ${document.getElementById("SoloUnit").selectedIndex})`;
    spit("Switched Solo: " + document.getElementById("SoloUnit").selectedIndex);
    document.title = "Solo " + document.getElementById('SoloUnit').selectedIndex + " | EchoBase";
    document.getElementById("logo").classList.remove("logo-solounset");
    document.getElementById("logo").classList.add("logo-soloset");
    
    // set new solo unit
    subs.setSoloUnitID(document.getElementById("SoloUnit").selectedIndex);
    spit("Solo Unit Changed to " + subs.getSoloUnitID());
    // subscribe to the new channel
    let newTopic = buildTopic("unit");
    //addListenerTopic(newTopic);
    subs.changeSolo();
    initializeValues();
}

function getWitnessCam() {
    return document.getElementById("WitnessCamID").selectedIndex;
}
function setWitnessLabel(l) {
    document.getElementById("WitnessCamLabelLink").innerHTML = l;
}
function setWitnessLink(l) {
    witnessLink = l;
    document.getElementById("WitnessCamLabelLink").href = l;
}
function getWitnessLink() {
    return witnessLink;
}
function onWitnessCamChange() {
    const w = getWitnessCam()
    //update the text & link of the WitnessCam box to show selection
    if (w == "0") {
        setWitnessLabel("POM Cam");
        spit("Witness Cam: POM Cam");
        setWitnessLink("https://youtube.com");
    } else {
        setWitnessLabel(`WitnessCam ${document.getElementById("WitnessCamID").selectedIndex}`);
        spit("Witness Cam: " + w);
        setWitnessLink("rtsp://localhost:" + w );
    }
}

function onTwistRateChange() {
    const v = document.getElementById("TwistRate").value;
    subs.setTwistRate(Number(v));
    spit("TwistRate: " + subs.getTwistRate());
}
function onSlideRateChange() {
    const v = document.getElementById("SlideRate").value;
    subs.setSlideRate(Number(v));
    spit("SlideRate: "+ subs.getSlideRate());
}

function onWheelbaseChange() {
    const v = document.getElementById("WheelbaseID").value;
    subs.changeSender(mqttTopicWheelbase, Number(v));
    if (!subs.wheelbaseListeners.includes(v)) {
        subs.wheelbaseListeners.push(v);
        client.subscribe(subs.getTopic(mqttTopicWheelbase, v));
    }
    spit("Wheelbase: " + subs.addListener(mqttTopicWheelbase, Number(v)));
}

// Keyboard shortcuts
// STOP:                CapsLock & 5 (and again to release the STOP)
// Twist Right:         + (increase compass bearing)
// Twist Left:          - (decrease compass bearing)
// Slide Forward:       ArrowUp & 8
// Slide Back:          ArrowDown & 2
// Slide Left:          ArrowLeft & 4
// Slide Right:         ArrowRight & 6
// Slide ForwLeft:      7 (double is Home)
// Slide ForwRight:     9 (double is PageUp)
// Slide BackLeftt:     1 (double is End)
// Slide BackRight:     3 (double is PageDown)
// Double Rates:        Shift+[key]

window.addEventListener("keydown", function (event) {
    spit("Keydown: " + event.key)
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }

    switch (event.key) {
        case "Down":
            console.log("Down event (WB Back)");
            handleWBBack();
            break;
        case "ArrowDown": 
            console.log("ArrowDown event (WB Back)")
            handleWBBack();
            break;
        case "Up":
            console.log("Up event (WB Forward)")
            handleWBForward();
            break;
        case "ArrowUp":
            console.log("ArrowUp event (WB Forward)")
            handleWBForward();
            break;
        case "-":
            console.log("- event (WB Counterclock / Twist Left")
            handleWBTwistLeft();
            break;
        case "+":
            console.log("+ event (WB Clockwise / Twist Right")
            handleWBTwistRight();
            break;
        case "9":
            console.log("9 event (WB Forward/Right");
            handleWBFwRight();
            break;
        case "8":
            console.log("8 event (WB Forward");
            handleWBForward();
            break;
        case "7":
            console.log("7 event (WB Forward/Left");
            handleWBFwLeft();
            break;
        case "6":
            console.log("6 event (WB Right");
            handleWBRight();
            break;
        case "5":
            console.log("5 event (WB STOP");
            handleWBStop();
            break;
        case "4":
            console.log("4 event (WB Left");
            handleWBLeft();
            break;
        case "3":
            console.log("3 event (WB Back/Right");
            handleWBBkRight();
            break;
        case "2":
            console.log("2 event (WB Back)")
            handleWBBack();
            break;
        case "1":
            console.log("1 event (WB Back/Left");
            handleWBBkLeft();
            break;
        case "CapsLock":
            console.log("CapsLock event");
            console.log("Event key: " + event.code + "Capslock: " + event.getModifierState('CapsLock')); // delete this
            handleCapsLock(event);
            break;
        default:
            return;
    }

    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
}, true);

function showChar(e) {
    console.log("Key Pressed: "+ String.fromCharCode(e.charCode) + "\n"
    + "charCode: " + e.charCode + "\n"
    + "SHIFT key: " + e.shiftKey + "\n"
    + "ALT key: " + e.altKey + "\n"
    );
}

function reportClick(e) {
    console.log("Forward Click: "
    + e.ShiftKey)
}

function disableButton(el) {
    // pass a getElementByID to this
    spit("disabling button " + el);
    document.getElementById(el).setAttribute("disabled", "disabled");
}

function enableButton(el) {
    spit("enabling button " + el);
    document.getElementById(el).removeAttribute("disabled");
}

function spit(message) {
    if (!verboseLogging) {
        return;
    }
    console.log(message);
}

// These consts are the actual strings to be sent over mqtt to which
// the robot firmware will acknowledge & obey
const mqttMessageTypeCommand = "Command";
const mqttMessageTypeChat = "Chat";
const mqttMessageTypeDM = "DM";
const mqttMessageTypeResponse = "Response";
const mqttMessageTypeStatus = "Status";
const mqttCommandWBStop = 0;
const mqttCommandWBMove = 1;
const mqttCommandWBAvast = 2;
const mqttCommandWBReport = 3;
const mqttCommandWBResume = 4;
const mqttCommandWBDirectionClockwise = 10;
const mqttCommandWBDirectionCounterClock = 0;
const mqttCommandWBDirectionLeft = 4;
const mqttCommandWBDirectionRight = 6;
const mqttCommandWBDirectionForward = 8;
const mqttCommandWBDirectionBack = 2;
const mqttCommandWBDirectionBackLeft = 1;
const mqttCommandWBDirectionBackRight = 3;
const mqttCommandWBDirectionForwardLeft = 7;
const mqttCommandWBDirectionForwardRight = 9;
const mqttCommandWBPivotNoPivot = 0;
const mqttCommandWBPivotPortStern = 1;
const mqttCommandWBPivotStern = 2;
const mqttCommandWBPivotStarboardStern = 3;
const mqttCommandWBPivotPort = 4;
const mqttCommandWBPivotMidship = 5;
const mqttCommandWBPivotStarboard = 6;
const mqttCommandWBPivotPortBow = 7;
const mqttCommandWBPivotBow = 8;
const mqttCommandWBPivotStarboardBow = 9;
const mqttCommandWBMethodSlide = 0;
const mqttCommandWBMethodTwist = 1;
const mqttTopicWheelbase = "wheelbase";
const mqttTopicLift = "lift";
const mqttTopicWitness = "witness";
const mqttTopicChat = "chat";
const mqttTopicDMIncoming = "dm-in";
const mqttTopicDMOutgoing = "dm-out";

// Wheelbase diagnostic handler
function handleWBReport() {
    // ask the device to report details about itself
    spit("Requesting Wheelbase Report");
    setSoloMessageTopic("wheelbase");
    setSoloMessageCommand(mqttCommandWBReport);
    publish(soloMessage.topic, JSON.stringify(soloMessage));
    return;
}

// Wheelbase Nav Handlers
function handleWBStop() {
    if(!avast) {
        if(!mute) {
            disableButton("btn-wb-stop");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionClockwise, mqttCommandWBStop);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-stop", 1000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBTwistLeft() {
    if(!avast) {
        if(!mute) {
            disableButton("btn-wb-ccw");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodTwist, subs.getTwistRate(), subs.getPivot(), mqttCommandWBDirectionCounterClock, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-ccw", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBTwistRight() {
    if(!avast) {
        if(!mute) {
            disableButton("btn-wb-cw");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodTwist, subs.getTwistRate(), subs.getPivot(), mqttCommandWBDirectionClockwise, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-cw", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBForward() {
    if (!avast) {
        if (!mute) {
            disableButton("btn-wb-fw");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionForward, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-fw", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBBack() {
    if (!avast) {
        if (!mute) {
            // disable the button to prevent too many instructions
            disableButton("btn-wb-bk");

            // create a new message
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionBack, mqttCommandWBMove);

            // log the intention locally
            cmd.spit();

            // send the message to the MQTT broker using the MQTT client
            cmd.send();

            // TODO: re-enable button on response message instead of timer
            autoEnableButton("btn-wb-bk", 3000); // replace w/ event triggered by reply message
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBLeft() {
    if(!avast) {
        if (!mute) {
            // disable the button to prevent too many instructions
            disableButton("btn-wb-lt");
            // create new message
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionLeft, mqttCommandWBMove);
            //log the intention locally
            cmd.spit();
            // send the message to the MQTT broker using Paho
            cmd.send();
            autoEnableButton("btn-wb-lt", 3000); // replace w/ event triggered by reply message
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBRight() {
    if(!avast) {
        if(!mute) {
            disableButton("btn-wb-rt");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionRight, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-rt", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBFwLeft() {
    if(!avast) {
        if(!mute) {
            disableButton("btn-wb-fw-lt");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionForwardLeft, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-fw-lt", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBFwRight() {
    if (!avast) {
        if(!mute) {
            disableButton("btn-wb-fw-rt");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionForwardRight, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-fw-rt", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBBkLeft() {
    if (!avast) {
        if(!mute) {
            disableButton("btn-wb-bk-lt");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionBackLeft, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-bk-lt", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleWBBkRight() {
    if (!avast) {
        if(!mute) {
            disableButton("btn-wb-bk-rt");
            const cmd = new WheelbaseMessage(mqttMessageTypeCommand, getEchoBaseUser(), subs.getSoloUnitID(), subs.getTopic(mqttTopicWheelbase, subs.wheelbaseSender), subs.getWBSender(), mqttCommandWBMethodSlide, subs.getSlideRate(), subs.getPivot(), mqttCommandWBDirectionBackRight, mqttCommandWBMove);
            cmd.spit();
            cmd.send();
            autoEnableButton("btn-wb-bk-rt", 3000);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}

// Lift Nav Handlers
function handleLiftUp() {
    if(!avast) {
        if(!mute) {
            spit("LIFT UP")
            disableButton("btn-lift-up");
            autoEnableButton("btn-lift-up", 4500);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleLiftStop() {
    if(!avast) {
        if(!mute) {
            spit("LIFT STOP");
            disableButton("btn-lift-stop");
            autoEnableButton("btn-lift-stop", 500);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}
function handleLiftDown() {
    if(!avast) {
        if(!mute) {
            spit("LIFT DOWN");
            disableButton("btn-lift-down");
            autoEnableButton("btn-lift-down", 4500);
            return;
        }
        muteMessage();
        return;
    }
    avastMessage();
    return;
}

// TODO: add interface in some kind of advanced tab where someoen can try to free a robot by spinning one wheel at a time
function spinWheel(wheelNum, direction) {
    // to be able to get out of a jam where one of the wheels needs to spin one way or the other
    return;
}

