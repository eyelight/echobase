const client = new Paho.MQTT.Client("192.168.1.140", 8881, "/mqtt", "jason" + new Date().getTime());

myTopic = "mqtt/solo-wheelbase"

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

client.connect({ onSuccess: onConnect })

let count = 0

function onConnect() {
    spit("onConnect")
    console.log("Subscribing to: " + myTopic)
    client.subscribe(myTopic) // subscribe to our topic
    setInterval(()=> {
        publish(myTopic, `The count is now ${count++}`)
    }, 5000) // publish every 5s
    initializeValues();
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
    client.connect({ onSuccess: onConnect });
}

const publish = (topic, msg) => { // takes topic and message string
    spit("desint :", topic, 'msggg', msg)
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

let verboseLogging = true;
let soloUnit = 0;
let topicPrefix = "mqtt/solo/";
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
    onTwistRateChange();
    onSlideRateChange();
    return;
}

function buildTopic(t) {
    let str = topicPrefix+getSoloUnitID();
    switch (t) {
        case "unit":
            return str;
            break;
        case "wheelbase":
            str += wheelbaseTopicPrefix + wheelbaseID;
            return str;
            break;
        case "lift":
            str += "/lift/" + liftID;
            return str;
            break;
        case "witness":
            str += "/witness/" + witnessID;
            return str;
            break;
        default:
            console.log("buildTopic() needs a context to be passed");
            return;
    }
}

function getSoloUnitID() {
    return soloUnit;
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
    avast = true;
    spit("Avast: " + avast);
    //document.querySelector("body").classList.add("avast");
    b.classList.add("avast");
}

function handleResume() {
    let b = document.getElementById("Body");
    avast = false;
    spit("Avast: " + avast);
    //document.querySelector("body").classList.remove("avast");
    b.classList.remove("avast");
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
    setSoloUnitID(document.getElementById("SoloUnit").selectedIndex);
    spit("Solo Unit Changed to " + getSoloUnitID);
    // subscribe to the new channel
    let newTopic = buildTopic("unit");
    addListenerTopic(newTopic);
    
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
function setSlideRate(r) {
    slideRate = r;
}
function setTwistRate(r) {
    twistRate = r;
}
function onTwistRateChange() {
    const v = document.getElementById("TwistRate").value;
    setTwistRate(v);
    spit("TwistRate: " + twistRate);

}
function onSlideRateChange() {
    const v = document.getElementById("SlideRate").value;
    setSlideRate(v);
    spit("SlideRate: "+ slideRate);
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
            dddck();
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

// Wheelbase Nav Handlers
function handleWBStop() {
    spit("Wheelbase STOP")
    disableButton("btn-wb-stop");
    setTimeout(() => {
        enableButton("btn-wb-stop");
    }, 500);
    return;
}
function handleWBTwistLeft() {
    spit("Wheelbase Twist Left (" + twistRate + " degrees)")
    disableButton("btn-wb-ccw");
    setTimeout(() => {
        enableButton("btn-wb-ccw");
    }, 3000);
    return;
}
function handleWBTwistRight() {
    spit("Wheelbase Twist Right (" + twistRate + " degrees)")
    disableButton("btn-wb-cw");
    setTimeout(() => {
        enableButton("btn-wb-cw");
    }, 3000);
    return;
}
function handleWBForward() {
    spit("Wheelbase FORWARD (" + slideRate + " inches)");
    disableButton("btn-wb-fw");
    setTimeout(() => {
        enableButton("btn-wb-fw");
    }, 3000);
    return;
}
function dddck() {
    spit("Wheelbase BACK (" + slideRate + " inches)")
    disableButton("btn-wb-bk");
    setTimeout(() => {
        enableButton("btn-wb-bk");
    }, 3000);
    return;
}
function handleWBLeft() {
    spit("Wheelbase LEFT (" + slideRate + " inches)")
    disableButton("btn-wb-lt");
    setTimeout(() => {
        enableButton("btn-wb-lt");
    }, 3000);
    return;
}
function handleWBRight() {
    spit("Wheelbase RIGHT (" + slideRate + " inches)")
    disableButton("btn-wb-rt");
    setTimeout(() => {
        enableButton("btn-wb-rt");
    }, 3000);
    return;
}
function handleWBFwLeft() {
    spit("Wheelbase FW/LEFT (" + slideRate + " inches)")
    disableButton("btn-wb-fw-lt");
    setTimeout(() => {
        enableButton("btn-wb-fw-lt");
    }, 3000);
    return;
}
function handleWBFwRight() {
    spit("Wheelbase FW/RIGHT (" + slideRate + " inches)")
    disableButton("btn-wb-fw-rt");
    setTimeout(() => {
        enableButton("btn-wb-fw-rt");
    }, 3000);
    return;
}
function handleWBBkLeft() {
    spit("Wheelbase BK/LEFT (" + slideRate + " inches)")
    disableButton("btn-wb-bk-lt");
    setTimeout(() => {
        enableButton("btn-wb-bk-lt");
    }, 3000);
    return;
}
function handleWBBkRight() {
    spit("Wheelbase BK/RIGHT (" + slideRate + " inches)")
    disableButton("btn-wb-bk-rt");
    setTimeout(() => {
        enableButton("btn-wb-bk-rt");
    }, 3000);
    return;
}

// Lift Nav Handlers
function handleLiftUp() {
    spit("LIFT UP")
    disableButton("btn-lift-up");
    setTimeout(() => {
        enableButton("btn-lift-up");
    }, 4500);
    return;
}
function handleLiftStop() {
    spit("LIFT STOP");
    disableButton("btn-lift-stop");
    setTimeout(() => {
        enableButton("btn-lift-stop");
    }, 500);
    return;
}
function handleLiftDown() {
    spit("LIFT DOWN");
    disableButton("btn-lift-down");
    setTimeout(() => {
        enableButton("btn-lift-down");
    }, 4500);
}