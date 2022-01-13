const Miner = require('./miner');

const miner = new Miner();

async function startMining() {
    miner.start(miningAddress.value, pool.value, cpuUsage.value, minerName.value);
}

function stopMining() {
    miner.stop();
}

async function startStopMining() {
    if (startStopBtn.innerHTML == "Start") {
        startMining();

        startStopBtn.innerHTML = "Stop";
        startStopBtn.className = 'submit button-shine active';
        // backgroundImg.className = "rotating"; // Disabled because it is lowering hashrate
        miningAddress.disabled = true;
        cpuUsage.disabled = true;
        pool.disabled = true;
        minerName.disabled = true;
        hasrateParagraph.innerHTML = "Loading...";
    }
    else {
        stopMining();

        startStopBtn.innerHTML = "Start";
        startStopBtn.className = 'submit button-shine';
        // backgroundImg.className = "";
        miningAddress.disabled = false;
        cpuUsage.disabled = false;
        pool.disabled = false;
        minerName.disabled = false;
        hasrateParagraph.innerHTML = "";
    }
}

miner.handleCpuCores();

startStopBtn.onclick = startStopMining;
cpuModel.innerHTML = miner.getCpuModel();