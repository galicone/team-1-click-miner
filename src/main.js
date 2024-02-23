/* eslint-disable no-undef */
const Miner = require('./miner');
const path = require('path');
const fs = require('fs');

const miner = new Miner();
let lastSelectedPool = null;
const poolsPath = path.join(__dirname, 'public', 'pools.json');
const addressPath = path.join(__dirname, 'public', 'address.json');

// Utility functions
function saveToJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Failed to save to ${path.basename(filePath)}:`, err);
    }
}
 function readFromJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } catch (err) {
        console.error(`Failed to read from ${path.basename(filePath)}:`, err);
        throw err; // Rethrow to handle errors where necessary
    }
}

function startMining() {
    saveToJsonFile(addressPath, { address: miningAddress.value });
    miner.start(miningAddress.value, pool.value, cpuUsage.value, minerName.value);
}

function stopMining() {
    miner.stop();
}

function loadPools() {
    return readFromJsonFile(poolsPath);
}

function loadAndPopulatePools(preselectedPoolUrl = null, isInitial = false) {
    try {
        const pools = loadPools();
        const poolSelect = document.getElementById('pool');
        poolSelect.innerHTML = ''; // Clear existing options before populating

        if (isInitial) {
            lastSelectedPool = pools[0];
        }

        pools.forEach(pool => {
            const option = new Option(pool, pool, false, pool === preselectedPoolUrl);
            poolSelect.add(option, undefined);
        });

        if (preselectedPoolUrl) {
            lastSelectedPool = preselectedPoolUrl;
        }

        // Add the special option for adding a new pool
        poolSelect.add(new Option("Add New Pool...", "add_new_pool"), undefined);

        // Add the special option for deleting the current pool
        poolSelect.add(new Option("Delete Selected Pool...", "delete_selected_pool"), undefined);
    } catch (err) {
        console.error('Failed to load pools:', err);
    }
}

async function addNewPool() {
    const poolUrl = document.getElementById('newPoolUrl').value.trim();
    if (poolUrl) {
        console.log('Adding new pool:', poolUrl);
        
        try {
            const pools = loadPools();
            
            // Add new pool to the list
            pools.push(poolUrl);
            
            // Save updated list back to pools.json
            saveToJsonFile(poolsPath, pools);
            
            // After adding the pool, hide the modal and clear the input
            document.getElementById('newPoolUrl').value = '';
            document.getElementById('addPoolModal').style.display = 'none';

            // Refresh the pool list and preselect the newly added pool
            loadAndPopulatePools(poolUrl);
        } catch (err) {
            console.error('Failed to update pools:', err);
        }
    } else {
        alert("Please enter a pool URL.");
    }
}

function deleteSelectedPool(selectedPool) {
    let pools = loadPools();
    pools = pools.filter(pool => pool !== selectedPool);
    saveToJsonFile(poolsPath, pools);

    const firstPoolUrl = pools.length > 0 ? pools[0] : null;
    loadAndPopulatePools(firstPoolUrl);
}

function loadAndPopulateAddress() {
    try {
        const { address } = readFromJsonFile(addressPath);
        if (address) {
            document.getElementById('miningAddress').value = address;
        }
    } catch (err) {
        console.error('Failed to load address:', err);
    }
}

function closeAddPoolModal() {
    document.getElementById('addPoolModal').style.display = 'none';
}

async function fetchHashrateStats() {
    try {
        const response = await fetch('https://pool.safex.org/api/live_stats');
        const data = await response.json();
        updateHashrateDisplay(data); 
    } catch (error) {
        console.error('Failed to fetch hashrate stats:', error);
    }
}

function updateHashrateDisplay(data) {
    const totalHashrate = (data.network.difficulty / 120 / 1000000).toFixed(2);
    document.getElementById('hashrateStats').innerText = `Network Hashrate: ${totalHashrate} MH/s`;
}

function openConfirmDeletePoolModal() {
    document.getElementById('confirmDeletePoolModal').style.display = 'block';
}

function closeConfirmDeletePoolModal() {
    document.getElementById('confirmDeletePoolModal').style.display = 'none';
}

async function startStopMining() {
    if (startStopBtn.innerHTML == "Start") {
        if (!miningAddress.value) {
            hasrateParagraph.innerHTML = 'Please enter Safex address';
            return;
        }

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

document.getElementById('addPoolButton').addEventListener('click', function() {
    addNewPool();
});

// Listener for Cancel button
document.getElementById('cancelAddPoolButton').addEventListener('click', function() {
    closeAddPoolModal();
});

document.getElementById('pool').addEventListener('change', function() {
    if (this.value === 'add_new_pool') {
        document.getElementById('addPoolModal').style.display = 'block';
    } else if (this.value === 'delete_selected_pool') {
        // When the delete option is selected, use lastSelectedPool for deletion
        if (lastSelectedPool) {
            openConfirmDeletePoolModal();
        } else {
            // Reset the selection to the last selected pool if the user cancels the deletion
            document.getElementById('pool').value = lastSelectedPool;
        }
    } else {
        // Update lastSelectedPool with the currently selected pool
        lastSelectedPool = this.value;
    }
});

// Handle the "Yes" button click for deleting the pool
document.getElementById('confirmDeletePoolButton').addEventListener('click', function() {
    if (lastSelectedPool) {
        deleteSelectedPool(lastSelectedPool);
        closeConfirmDeletePoolModal(); // Close the modal on confirmation
    }
});

// Handle the "No" button click to simply close the modal
document.getElementById('cancelDeletePoolButton').addEventListener('click', function() {
    closeConfirmDeletePoolModal();
});

fetchHashrateStats();
setInterval(fetchHashrateStats, 15000); 

loadAndPopulateAddress();
loadAndPopulatePools(null, true);
miner.handleCpuCores();

startStopBtn.onclick = startStopMining;
cpuModel.innerHTML = miner.getCpuModel();
