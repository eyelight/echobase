let soloMessage = new Object();
soloMessage.from = myself;
soloMessage.unit = soloUnit;
soloMessage.topic = "";
soloMessage.wbMethod = "";
soloMessage.wbAmount = "";
soloMessage.wbDirection = "";

class SoloMessage {
    constructor(msgType, from, unit, topic) {
        this.msgType = msgType;
        this.from = from;
        this.unit = unit;
        this.topic = topic;
    }
/*    get msgType() {
        return this.msgType;
    }
    get from() {
        return this.from;
    }
    get unit() {
        return this.unit;
    }
    get topic() {
        return this.topic;
    }*/
    spit() {
        spit("Type: " + this.msgType +
        " / From: " + this.from + 
        " / Unit: " + this.unit + 
        " / Topic: " + this.topic + 
        " / Method: " + this.wbMethod +
        " / Amount: " + this.wbAmount +
        " / Direction: " + this.wbDirection
        );
    }
    send() {
        publish(this.topic, JSON.stringify(this));
    }
}


class WheelbaseMessage extends SoloMessage {
    constructor(msgType, from, unit, topic, wbMethod, wbAmount, wbDirection, command) {
        super(msgType, from, unit, topic);
        this.wbMethod = wbMethod;
        this.wbAmount = wbAmount;
        this.wbDirection = wbDirection;
        this.command = command;
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

