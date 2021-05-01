/*const soloMessage = new Object();
soloMessage.from = "";
soloMessage.unit = soloUnit;
soloMessage.topic = "";
soloMessage.wbMethod = "";
soloMessage.wbAmount = "";
soloMessage.wbDirection = "";
*/
// SubState holds current subscriptions
class SubState {
    constructor(myself) {
        this.myself = myself;
        this.topicPrefix = "mqtt/solo/";
        this.soloListener = 0;
        this.wheelbaseTopicPrefix = "/wheelbase/";
        this.wheelbaseListeners = [];
        this.liftTopicPrefix = "/lift/";
        this.liftListeners = [];
        this.witnessTopicPrefix = "/witness/";
        this.witnessListeners = [];
        this.soloSender = 0;
        this.wheelbaseSender = 0;
        this.liftSender = 0;
        this.witnessSender = 0;
        this.chatTopicPrefix = "/chat";
        this.dmTopicPrefix = "dm/";
        this.crewMembers = [];
        this.pivot = 5;
        this.slideRate = 1;
        this.twistRate = 1;
    }
    getTopic(topic, target) {
        switch (topic) {
            case mqttTopicWheelbase:
                return this.topicPrefix+this.soloListener+this.wheelbaseTopicPrefix+target;
            case mqttTopicLift:
                return this.topicPrefix+this.soloListener+this.liftTopicPrefix+target;
            case mqttTopicWitness:
                return this.topicPrefix+this.soloListener+this.witnessTopicPrefix+target;
            case mqttTopicChat:
                return this.topicPrefix+this.soloListener+mqttTopicChat;
            case mqttTopicDMIncoming:
                return this.topicPrefix+this.dmTopicPrefix+target+"/"+myself;
                case mqttTopicDMOutgoing:
                return this.topicPrefix+this.dmTopicPrefix+myself+"/"+target;
            default:
                spit("SubState::getTopic() didn't understand params: " + topic + " " + target);
                return;
        }
    }
    setTwistRate(r) {
        this.twistRate = Number(r);
    }
    setSlideRate(r) {
        this.slideRate = Number(r);
    }
    getTwistRate() {
        return this.twistRate;
    }
    getSlideRate() {
        return this.slideRate;
    }
    getPivot() {
        return this.pivot;
    }
    setPivot(p) {
        this.pivot = Number(p);
    }
    getWBSender() {
        return this.wheelbaseSender;
    }
    setWBSener(s) {
        this.wheelbaseSender = Number(s);
    }
    getSoloUnitID() {
        return this.soloListener;
    }
    setSoloUnitID(u) {
        if (u) {
            if (u == this.soloListener) {
                spit("setSoloUnitID():" + u + "is already set");
                return;
            }
            this.soloListener = u;
            return;
        }
        spit("setSoloUnitID() needs an argument");
        return;
    }
    changeSolo(x) {
        // unsubscribe old
        client.unsubscribe(buildTopic("unit"));

        // change state
        this.setSoloUnitID(x);

        // subscribe new
        this.addListener("solo", this.soloListener);
    }
    changeSender(device, id) {
        switch(device) {
            case mqttTopicWheelbase:
                if (this.wheelbaseSender != id) {
                    this.wheelbaseSender = id;
                    spit("SubState::changeSender() - New Wheelbase: " + id);
                    break;
                }
            case mqttTopicLift:
                if (this.liftSender != id) {
                    this.liftSender = id;
                    spit("SubState::changeSender() - New Lift: " + id);
                    break;
                }
            case mqttTopicWitness:
                if (this.witnessSender != id) {
                    this.witnessSender = id;
                    spit("SubState::changeSender() - New Witness: "+ id);
                    break;
                }
            default:
                spit("SubState::changeSender() - Couldn't understand args");
        }
        return;
    }
    addListener(device, number) {
        switch(device) {
            case "solo":
                spit("Current Solo Listener: " + this.soloListener);
                if (this.soloListener == number) {
                    spit("Already listening to Solo " + number);
                    return;
                }
                this.soloListener = number;
                spit("This new solo listener: " + this.soloListener);
                spit(buildTopic("unit", this.soloListener));
                addListenerTopic(buildTopic("unit", this.soloListener));
                spit("New Solo Listener: " + this.soloListener);
                break;
            case "wheelbase":
                if (this.wheelbaseListeners.includes(number)) {
                    spit("Already listening to Solo " + this.soloListener + " Wheelbase " + number);
                    return;
                }
                this.wheelbaseListeners.push(number);
                break;
            case "lift":
                if (this.liftListeners.includes(number)) {
                    spit("Already listening to Solo " + this.soloListener + " Lift " + number);
                    return;
                }
            case "witness":
                if (this.witnessListeners.includes(number)) {
                    spit("Already listening to Solo " + this.soloListener + " Witness " + number);
                    return;
                }
                this.liftListeners.push(number);
                break;
            default:
                spit("addListener() didn't understand the instruction");
                break;
        }
        return;
    }
}

class SoloMessage {
    constructor(msgType, from, unit, topic) {
        this.msgType = msgType;
        this.from = from;
        this.unit = unit;
        this.topic = topic;
        this.missionTime = Date.now();
    }
    spit() {
        spit("Type: " + this.msgType +
        " / From: " + this.from + 
        " / Unit: " + this.unit + 
        " / Topic: " + this.topic + 
        " / MissionTime: " + this.missionTime
        );
    }
    send() {
        publish(this.topic, JSON.stringify(this));
    }
}


class WheelbaseMessage extends SoloMessage {
    constructor(msgType, from, unit, topic, wbUnit, wbMethod, wbAmount, wbPivot, wbDirection, command) {
        super(msgType, from, unit, topic);
        this.wbUnit = wbUnit;
        this.wbMethod = wbMethod;
        this.wbAmount = wbAmount;
        this.wbPivot = wbPivot;
        this.wbDirection = wbDirection;
        this.command = command;
    }
    spit() {
        spit("Type: " + this.msgType +
        " / MissionTime: " + this.missionTime +
        " / Topic: " + this.topic + 
        " / From: " + this.from + 
        " / Unit: " + this.unit + 
        " / Wheelbase: " + this.wbUnit +
        " / Method: " + this.wbMethod +
        " / Amount: " + this.wbAmount +
        " / Pivot: " + this.wbPivot +
        " / Direction: " + this.wbDirection
        );
    }
/*    get wbMethod() {
        return this.wbMethod;
    }
    get wbAmount() {
        return this.wbAmount;
    }
    get wbDirection() {
        return this.wbDirection;
    }*/
}

function showSoloMessage() {
    console.log(soloMessage);
}

function setSoloMessageTopic(t) {
    spit("Setting soloMessage.topic: " + t);
    soloMessage.topic = buildTopic(t);
}

function setSoloMessageCommand(c) {
    spit("Setting soloMessage.command: " + c);
    soloMessage.command = c;
}

function setSoloMessageWBMethod(m) {
    spit("Setting soloMessage.wbMethod: " + m);
    soloMessage.wbMethod = m;
}

function setSoloMessageWBRate(r) {
    spit("Setting soloMessage.wbAmount: " + r);
    soloMessage.wbAmount = r;
}

function setSoloMessageWBDirection(d) {
    spit("Setting soloMessage.wbDirection: " + d);
    soloMessage.wbDirection = d;
}

function overrideSoloMessageTopic(t) {
    spit("Overriding soloMessage.topic: " + t);
    soloMessage.topic = t;
}

function autoEnableButton(id, t) {
    setTimeout(() => {
        enableButton(id);
    }, t);
}

function muteMessage() {
    spit("You're muted — commands are not sent")
}

function avastMessage() {
    spit("The robot is in a timeout");
}

