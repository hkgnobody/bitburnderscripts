import { findHRTServer } from "findBestServer.js"

/** Script to execute an hack/grow/weaken call after a specified cooldown */
const hackScript = { "filename": "h1.js", "ram": 1.7 };
const growScript = { "filename": "g1.js", "ram": 1.75 };
const weakenScript = { "filename": "w1.js", "ram": 1.75 };

/** A constant value to add/subtract to sleep() calls to ensure correct synchronization */
const sleepConstant = 500;

/**
 * Finds the optimal server to hack and hacks it from all possible servers except home.
 * Only run from home server
 * @param {NS} ns **/
export async function main(ns) {
    while (true) {
        const multiarray = await findHRTServer(ns);  // finds and nukes optimal, hackable, and rootale servers.
        var rootableServers = multiarray[1];
        var target = multiarray[2];

        var moneyMax = ns.getServerMaxMoney(target);
        var minSecurity = ns.getServerMinSecurityLevel(target);
        var currSevSecLv = ns.getServerSecurityLevel(target);
        var currSerMoney = ns.getServerMoneyAvailable(target);

        var securityThresh = minSecurity + 7; // keep target security level between min and min+4
        let numThreads = 1; // at least a single thread action
        var numTimesToHack = 0.03; // a little bit of time buffer for async
        let hackStartsAt = Math.min(moneyMax * 0.6, 5000000); // start to hack when over 5mil or reach 70% of server max money

        // uncomment for activity logs
        //ns.tprint('[STARTED] @ ' + optimalServer);
        //ns.tprint('[hackOver] ' + hackStartsAt);
        //ns.tprint('[money] ' + currSerMoney + ' / ' + moneyMax);
        //ns.tprint('[security] ' + currSevSecLv + ' vs min ' + minSecurity);

        //Number of times the code weakens/grows/hacks in a row once it decides on which one to do.
        //Change to the value you prefer.
        //Higher number means longer time without updating list of all servers and optimal server, but also less time lost in buffer time in between cycles.
        //I would recommend having it at 1 at the start of the run and gradually increasing it as the rate at which you get more servers you can use decreases.
        //Don't increase it too far tho, as weaken/hack/grow times also tend to increase throughout a run.
        numTimesToHack += 1;

        //weakens/grows/hacks the optimal server from all rootable servers except home
        if (currSevSecLv > securityThresh) {
            ns.tprint("weakening " + target)
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i])) //free ram
                numThreads /= weakenScript.ram;
                numThreads = Math.floor(numThreads);
                if (numThreads > 0) {
                    ns.exec(weakenScript.filename, rootableServers[i], numThreads, target);
                }
            }
            await ns.sleep(numTimesToHack * ns.getWeakenTime(target) + sleepConstant);
        } else if (currSerMoney < hackStartsAt) {
            ns.tprint("growing " + target)
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i]))
                numThreads /= growScript.ram;
                if (numThreads > 0) {
                    ns.exec(growScript.filename, rootableServers[i], numThreads, target);
                }
            }
            await ns.sleep(numTimesToHack * ns.getGrowTime(target) + sleepConstant);
        } else {
            ns.tprint("hacking " + target)
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i]))
                numThreads /= hackScript.ram;
                if (numThreads > 0) {
                    ns.exec(hackScript.filename, rootableServers[i], numThreads, target);
                }
            }
            await ns.sleep(numTimesToHack * ns.getHackTime(target) + sleepConstant);
        }
    }

}
