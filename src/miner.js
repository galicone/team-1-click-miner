const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PLATFORM = os.platform().toLowerCase();

const LINUX_PATH = path.join(__dirname, './resources/linux/xmrig');
const WINDOWS_PATH = path.join(__dirname, './resources/windows/xmrig.exe');
const MAC_PATH = path.join(__dirname, './resources/mac/xmrig');
const MAC_PATH_M1 = path.join(__dirname, './resources/mac_m1/xmrig');

module.exports = class Miner {
    filePath = null;
    running = false;
    worker = null;

    constructor() {
        this.init();
    }

    async init() {
        console.log(os.arch());
        if (PLATFORM === 'linux') {
            this.loadLinux();
        } else if (PLATFORM === 'win32') {
            this.loadWindows();
        } else if (PLATFORM === 'darwin') {
            if (os.arch() === 'arm' || os.arch() === 'arm64') {
                this.loadMacM1();
            } else {
                this.loadMac();
            }
        }

        else {
            throw new Error('Unsupported platform');
        }
    }

    start(address, poolUrl, cpuUsage, minerName) {
        if (this.running) {
            console.info('Miner already running');
            return;
        }

        this.running = true;
        this.exec(address, poolUrl, cpuUsage, minerName);
    }

    stop() {
        if (this.worker) {
            this.worker.kill();
            this.worker = null;
        }
        this.running = false;
    }

    loadLinux() {
        console.log('Running on Linux');
        this.filePath = LINUX_PATH;
    }

    loadWindows() {
        console.log('Running on Windows');
        this.filePath = WINDOWS_PATH;
    }

    loadMac() {
        console.log('Running on Mac');
        this.filePath = MAC_PATH;
    }

    loadMacM1() {
        console.log('Running on Mac M1');
        this.filePath = MAC_PATH_M1;
    }

    exec(address, poolUrl, cpuUsage, minerName) {
        if (!minerName || minerName === '') {
            minerName = 'Safex Community Miner';
        }

        this.worker = spawn(this.filePath, [
            '--coin', 'sfx',
            '--api-worker-id', minerName,
            '--cpu-max-threads-hint', cpuUsage,
            '--print-time', '4',
            '--no-color',
            '-a', 'rx/sfx',
            '-p', minerName,
            '-o', poolUrl,
            '-u', address,
            '-k'
        ]);

        this.worker.stdout.on('data', data => {
            let dataString = data.toString();
            if (dataString.includes('miner') && dataString.includes('15m') && !dataString.includes('huge')) {
                dataString = dataString.replace('max', '');
                dataString = dataString.replace('H/s', '');
                dataString = dataString.split('15m')[1];
                dataString = dataString.replace('   ', ' ');

                hasrateParagraph.innerHTML = dataString;
            }
        });
    }

    handleCpuCores() {
        const numberOfCores = os.cpus().length;

        let option1 = new Option('100%', 100);
        let option2 = new Option('75%', 75);
        let option3 = new Option('50%', 50);
        let option4 = new Option('25%', 25);

        if (numberOfCores % 4 === 0) {
            cpuUsage.add(option1, undefined);
            cpuUsage.add(option2, undefined);
            cpuUsage.add(option3, undefined);
            cpuUsage.add(option4, undefined);
        } else if (numberOfCores % 2 === 0) {
            cpuUsage.add(option1, undefined);
            cpuUsage.add(option3, undefined);
        } else {
            cpuUsage.add(option1, undefined);
        }
    }

    getCpuModel() {
        return os.cpus()[0].model;
    }
}

