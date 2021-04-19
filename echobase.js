let soloMessage = new Object();
soloMessage.from = myself;
soloMessage.unit = soloUnit;
soloMessage.topic = "";
soloMessage.wbMethod = "";
soloMessage.wbAmount = "";
soloMessage.wbDirection = "";

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