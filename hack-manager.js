import { findHRTServer } from "findBestServer.js"

/** Script to execute an hack/grow/weaken call after a specified cooldown */
const hackScript = { action: "hack", "filename": "h1.js", "ram": 1.7 };
const growScript = { action: "grow", "filename": "g1.js", "ram": 1.75 };
const weakenScript = { action: "weaken", "filename": "w1.js", "ram": 1.75 };

/** A constant value to add/subtract to sleep() calls to ensure correct synchronization */
const sleepConstant = 1000;

async function performAction(ns, multiarray, scriptOption) {
    const rootableServers = multiarray[1];
    const target = multiarray[2];
    let numThreads = 1;
    for (let i = 0; i < rootableServers.length; i++) {
        ns.killall(rootableServers[i]);
        let freeRam = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i])) //free ram
        numThreads = freeRam / scriptOption.ram;
        numThreads = Math.floor(numThreads);
        if (numThreads > 0) {
            ns.exec(scriptOption.filename, rootableServers[i], numThreads, target);
        }
    }
    let actionTime;
    switch (scriptOption.action) {
        case hackScript.action:
            actionTime = ns.getHackTime(target);
            break;
        case weakenScript.action:
            actionTime = ns.getWeakenTime(target);
            break;
        case growScript.action:
            actionTime = ns.getGrowTime(target);
            break;
        default:
            actionTime = 1000; // 1 sec
            break;
    }
    await ns.sleep(actionTime + sleepConstant);
}

/**
 * Finds the optimal server to hack and hacks it from all possible servers except home.
 * Only run from home server
 * @param {NS} ns **/
export async function main(ns) {
    while (true) {
        let multiarray = await findHRTServer(ns);  // finds and nukes optimal, hackable, and rootale servers.
        let target = multiarray[2];
        let moneyMax = ns.getServerMaxMoney(target);
        let minSecurity = ns.getServerMinSecurityLevel(target);
        let currSevSecLv = ns.getServerSecurityLevel(target);
        let currSerMoney = ns.getServerMoneyAvailable(target);

        let securityThresh = minSecurity + 3; // keep target security level between min and min+3
        let hackStartsAt = Math.min(moneyMax * 0.8, 5000000); // start to hack when over 5mil or reach 70% of server max money

        // uncomment for activity logs
        //ns.tprint('[STARTED] @ ' + optimalServer);
        //ns.tprint('[hackOver] ' + hackStartsAt);
        //ns.tprint('[money] ' + currSerMoney + ' / ' + moneyMax);
        //ns.tprint('[security] ' + currSevSecLv + ' vs min ' + minSecurity);

        //Number of times the code weakens/grows/hacks in a row once it decides on which one to do.
        //Change to the value you prefer.
        //Higher number means longer time without updating list of all servers and optimal server, but also less time lost in buffer time in between cycles.
        //Don't increase it too far tho, as weaken/hack/grow times also tend to increase throughout a run.

        //weakens/grows/hacks the optimal server from all rootable servers except home
        if (currSevSecLv > securityThresh) {
            ns.tprint("weakening " + target)
            await performAction(ns, multiarray, weakenScript);
        } else if (currSerMoney < hackStartsAt) {
            ns.tprint("growing " + target)
            await performAction(ns, multiarray, growScript);
        } else {
            ns.tprint("hacking " + target)
            await performAction(ns, multiarray, hackScript);
        }
    }

}
