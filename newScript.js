/** A constant value to add/subtract to sleep() calls to ensure correct synchronization */
const sleepConstant = 200;
/** The percentage of money to steal from the target at every cycle */
const moneyToStealPercentage = 0.5;
/** Buffer of security level */
const securityBufferLvl = 7;

/** How much the security level of a server gets decreased by a weaken() call */
const weakenSecurityEffect = 0.05;
/** How much the security level of a server gets increased by a grow() call */
const growSecurityEffect = 0.004;
/** How much the security level of a server gets increased by an hack() call */
const hackSecurityEffect = 0.002;

/** Script to execute an hack() call after a specified cooldown */
const hackScript = { "filename": "h1.js", "ram": 1.7, "ratio": 0.2 };
/** Script to execute a grow() call after a specified cooldown */
const growScript = { "filename": "g1.js", "ram": 1.75, "ratio": 0.4 };
/** Script to execute a weaken() call after a specified cooldown */
const weakenScript = { "filename": "w1.js", "ram": 1.75, "ratio": 0.7 };

/**
 * Gets the amount of free ram for the server.
 * 
 * @params {NS} ns - the Netscript environment
 * @param {string} server - the hostname of the server
 */
function getFreeRam(ns, server) {
	return (ns.getServerMaxRam(server) - ns.getServerUsedRam(server));
}

/**
 * Gets the amount of ram needed to execute hack, grow and weaken scripts with the given thread count.
 * 
 * @param {number} hackThreads - the number of threads executing hack script
 * @param {number} growThreads - the number of threads executing grow script
 * @param {number} weakenThreads - the number of threads executing weaken script
 */
function getRequiredRam(hackThreads, growThreads, weakenThreads) {
	return hackThreads * hackScript.ram + growThreads * growScript.ram + weakenThreads * weakenScript.ram;
}

/**
 * Gets the minimum number of threads needed to offset the increase in security determined by the hack() and grow() calls specified.
 * 
 * @param {number} hackThreads - the number of threads executing hack() calls
 * @param {number} growThreads - the number of threads executing grow() calls
 */
function getMinWeakenThreads(hackThreads, growThreads) {
	const securityIncrease = hackThreads * hackSecurityEffect + growThreads * growSecurityEffect;
	return Math.ceil(securityIncrease / weakenSecurityEffect);
}

/** 
 * Gets the number of threads to execute a script with, to consume at maximum the percentage of free ram specified.
 * 
 * @param {NS} ns - The Netscript environment
 * @param {string} script - The file name of the script.
 * @param {number} ramPercentage - How much ram to use (from 0 to 1).
 */
function getThreads(ns, server, script, ramPercentage) {
	const freeRam = getFreeRam(ns, server) * ramPercentage;
	const scriptRam = script.ram;
	return freeRam >= scriptRam ? Math.floor(freeRam / scriptRam) : 0;
}



/**
* Returns an array of all searchable servers
*/
async function findAllServers(ns) {
	var q = [];
	var serverDiscovered = [];

	q.push("home");
	serverDiscovered["home"] = true;

	while (q.length) {
		let v = q.shift();

		let edges = ns.scan(v);

		for (let i = 0; i < edges.length; i++) {
			if (!serverDiscovered[edges[i]]) {
				serverDiscovered[edges[i]] = true;
				q.push(edges[i]);
			}
		}
	}
	return Object.keys(serverDiscovered);
}

/**
* Finds list of all hackable and all rootable servers. Also finds optimal server to hack.
* A hackable server is one which you can hack, grow, and weaken.
* A rootable server is one which you can nuke.
* Returns a 2d array with list of hackable, rootable, and the optimal server to hack
*/
async function findHackable(ns, allServers) {
	var hackableServers = [];
	var rootableServers = [];
	var numPortsPossible = 0;

	if (ns.fileExists("BruteSSH.exe", "home")) {
		numPortsPossible += 1;
	}
	if (ns.fileExists("FTPCrack.exe", "home")) {
		numPortsPossible += 1;
	}
	if (ns.fileExists("RelaySMTP.exe", "home")) {
		numPortsPossible += 1;
	}
	if (ns.fileExists("HTTPWorm.exe", "home")) {
		numPortsPossible += 1;
	}
	if (ns.fileExists("SQLInject.exe", "home")) {
		numPortsPossible += 1;
	}


	for (let i = 0; i < allServers.length; i++) {
		//if your hacking level is high enough and you can open enough ports, add it to hackable servers list
		if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(allServers[i]) && numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])) {
			hackableServers.push(allServers[i]);
		}
		//if it isn't home(this makes sure that you don't kill this script) and you either 
		//already have root access(this is useful for servers bought by the player as you have access to those even if the security is higher than you can nuke)
		//  or you can open enough ports
		if (allServers[i] != "home" && (ns.hasRootAccess(allServers[i]) || (numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])))) {
			rootableServers.push(allServers[i]);
			//if you don't have root access, open ports and nuke it
			if (!ns.hasRootAccess(allServers[i])) {
				if (ns.fileExists("BruteSSH.exe")) {
					ns.brutessh(allServers[i]);
				}
				if (ns.fileExists("FTPCrack.exe")) {
					ns.ftpcrack(allServers[i]);
				}
				if (ns.fileExists("RelaySMTP.exe")) {
					ns.relaysmtp(allServers[i]);
				}
				if (ns.fileExists("HTTPWorm.exe")) {
					ns.httpworm(allServers[i]);
				}
				if (ns.fileExists("SQLInject.exe")) {
					ns.sqlinject(allServers[i]);
				}
				ns.nuke(allServers[i]);
			}
		}
	}

	//finds optimal server to hack
	let optimalServer = await findOptimal(ns, hackableServers);

	return [hackableServers, rootableServers, optimalServer];
}

/** 
 * Finds the best server to hack.
 * The algorithm works by assigning a value to each server and returning the max value server.
 * The value is the serverMaxMoney divided by the sum of the server's weaken time, grow time, and hack time.
 * You can easily change this function to choose a server based on whatever optimizing algorithm you want,
 *  just return the server name to hack.
*/
async function findOptimal(ns, hackableServers) {
	let optimalServer = "n00dles";
	let optimalVal = 0;
	let currVal;
	let currTime;

	for (let i = 0; i < hackableServers.length; i++) {
		currVal = ns.getServerMaxMoney(hackableServers[i]);
		currTime = ns.getWeakenTime(hackableServers[i]) + ns.getGrowTime(hackableServers[i]) + ns.getHackTime(hackableServers[i]);
		currVal /= currTime;
		if (currVal >= optimalVal) {
			optimalVal = currVal;
			optimalServer = hackableServers[i];
		}
	}

	return optimalServer;
}



/**
 * Formats an amount of money using the game standard format
 * 
 * @param {NS} ns - The Netscript environment
 * @param {number} amount - The amount of money
 * @returns - Formatted amount of money
 */
function formatMoney(ns, amount) {
	return ns.nFormat(amount, "($0.00a)");
}

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("ALL");
	ns.enableLog("run");
	var target = "n00dles";
	// Check if it is present at least the required argument (target)
	if (ns.args.length < 1) {
		var allServers = await findAllServers(ns);  // finds all servers and clones grow hack and weaken files
		var multiarray = await findHackable(ns, allServers);    // finds and nukes optimal, hackable, and rootale servers.
		target = multiarray[2];
	}
	else {
		target = ns.args[0];
	}

	// Show you the target
	ns.tprint("Our target is " + target)

	// If target's maximum amount of money and minimum security level are not provided, get them
	let maxMoney;
	let minSecurityLvl;
	if (ns.args.length < 3) {
		maxMoney = ns.getServerMaxMoney(target);
		minSecurityLvl = ns.getServerMinSecurityLevel(target);
	} else {
		maxMoney = ns.args[1];
		minSecurityLvl = ns.args[2];
	}

	// Get the current server hostname
	const currentServer = ns.getHostname();

	/* Make sure there are no running instances of hack, grow or weaken
		scripts, this is necessary because every time the game is launched it restarts
		all running scripts */
	ns.scriptKill(hackScript.filename, currentServer);
	ns.scriptKill(growScript.filename, currentServer);
	ns.scriptKill(weakenScript.filename, currentServer);

	/* Execute weaken() calls with maximum amount of threads available to reduce
		security level of target to minimum */
	let threads = getThreads(ns, currentServer, weakenScript, weakenScript.ratio);
	let securityLvl = ns.getServerSecurityLevel(target);

	if (threads <= 0) {
		throw "Thread count must be >= 0 for initial weaken";
	}

	while (securityLvl > minSecurityLvl + securityBufferLvl) {
		ns.print("Initial weaken of target: " + securityLvl + " / " + (minSecurityLvl + securityBufferLvl));

		const weakenTime = ns.getWeakenTime(target);
		ns.run(weakenScript.filename, threads, target, 0);
		// Wait for the script to terminate before the next loop
		await ns.asleep(weakenTime + sleepConstant);
		securityLvl = ns.getServerSecurityLevel(target)
	}
	ns.print("Finished initial weaken");

	// Wait to ensure all weaken threads are done
	await ns.asleep(500);

	/* Execute grow() and weaken() calls with all available threads to increase amount
		of money in target to maximum, without increasing security level */
	threads = getThreads(ns, currentServer, growScript, growScript.ratio);
	let weakenThreads = 0;
	// The increase in security level that is given by every run of grow script with the max number of threads
	let securityIncrease = threads * growSecurityEffect;
	/* Find the balance between the number of threads that execute grow and weaken calls 
		to keep growing without increasing security level  */
	while (securityIncrease > weakenThreads * weakenSecurityEffect) {
		threads--;
		weakenThreads++;
		securityIncrease = threads * growSecurityEffect
	}

	if (threads <= 0 || weakenThreads <= 0) {
		throw "Thread count must be positive for initial grow";
	}

	let moneyAvailable = ns.getServerMoneyAvailable(target);
	while (moneyAvailable < maxMoney) {
		ns.print("Initial grow of target: " + formatMoney(ns, moneyAvailable) + " / " + formatMoney(ns, maxMoney) + " (sec " + ns.getServerSecurityLevel(target) + ")");

		// Weaken time will always be greater than grow time
		const weakenTime = ns.getWeakenTime(target);
		const growTime = ns.getGrowTime(target);
		ns.run(weakenScript.filename, weakenThreads, target, 0);
		/* The second argument that is passed to the grow script is the amount of time
			to wait before executing grow() calls, it ensures that the calls terminate 
			right before the weaken() calls */
		ns.run(growScript.filename, threads, target, weakenTime - growTime - sleepConstant);
		// Wait for all scripts to terminate before next loop
		await ns.asleep(weakenTime + sleepConstant);
		moneyAvailable = ns.getServerMoneyAvailable(target);
	}
	securityLvl = ns.getServerSecurityLevel(target);
	ns.print("Finished initial grow: money " + formatMoney(ns, moneyAvailable) + "/" + formatMoney(ns, maxMoney) + " ; security " + securityLvl + "/" + minSecurityLvl);

	/* Infinite loop to hack the target and steal moneyToStealPercentage of the maximum amount of money the target
		can hold at every cycle, while restoring the security level back to minimum and the
		amount of money in the target back to maximum */
	while (true) {
		// Variables to store the final number of threads to run hack, weaken and grow scripts
		let finalHackThreads;
		let finalWeakenThreadsBeforeGrow;
		let finalGrowThreads;
		let finalWeakenThreadsAfterGrow;

		// The percentage of the money that will be stolen by one hack thread from target
		const hackPercentage = ns.hackAnalyze(target);
		const moneyStolenByOneHack = Math.floor(maxMoney * hackPercentage);

		// Maximum amount of threads to perform one cycle
		// NOTE: not sure about Math.round() impact on hack/grow balance
		const maxHackThreads = Math.round((maxMoney * moneyToStealPercentage) / moneyStolenByOneHack); // moneyToSteal / moneyStolenByOneHack
		const maxWeakenThreadsBeforeGrow = getMinWeakenThreads(maxHackThreads, 0);
		const maxGrowThreads = Math.round(ns.growthAnalyze(target, 2.1));
		const maxWeakenThreadsAfterGrow = getMinWeakenThreads(0, maxGrowThreads);

		ns.print(ns.sprintf("Max threads: hack %s ; weaken %s ; grow %s ; weaken %s",
			maxHackThreads, maxWeakenThreadsBeforeGrow, maxGrowThreads, maxWeakenThreadsAfterGrow));

		// Calculate the ram required to execute one cycle with max threads
		let ramRequired = getRequiredRam(maxHackThreads, maxGrowThreads, maxWeakenThreadsBeforeGrow + maxWeakenThreadsAfterGrow);
		let ramFree = getFreeRam(ns, currentServer);

		ns.print("Ram required for max threads: " + ramRequired + " ; free: " + ramFree);

		if (ramFree >= ramRequired) {
			// If there is enough ram on current server, run a cycle with max threads
			ns.print("Running with max threads");

			finalHackThreads = maxHackThreads;
			finalWeakenThreadsBeforeGrow = maxWeakenThreadsBeforeGrow;
			finalGrowThreads = maxGrowThreads;
			finalWeakenThreadsAfterGrow = maxWeakenThreadsAfterGrow;
		} else {
			// If there is not enough ram on current server, calculate alternative number of threads to execute

			// !!!! WIP !!!!

			// Factor to scale the number of threads
			const scaleFactor = ramFree / ramRequired;
			// Estimate maximum number of threads that we can run
			const maxThreads = ramFree / growScript.ram;

			// Scale and round hack and grow threads, calculate minimum weaken threads required
			let hackThreads = Math.round(maxHackThreads * scaleFactor);
			let weakenThreadsBeforeGrow = getMinWeakenThreads(hackThreads, 0);
			let growThreads = Math.round(maxGrowThreads * scaleFactor);
			let weakenThreadsAfterGrow = getMinWeakenThreads(0, growThreads);

			ns.print(ns.sprintf("Threads after scaling: hack %s ; weaken %s ; grow %s ; weaken %s",
				hackThreads, weakenThreadsBeforeGrow, growThreads, weakenThreadsAfterGrow));

			// If this is a low ram server, group togheter the weaken operations
			if (weakenThreadsBeforeGrow + weakenThreadsAfterGrow < 4) {
				weakenThreadsBeforeGrow = 0;
				weakenThreadsAfterGrow = getMinWeakenThreads(hackThreads, growThreads);
			}

			// Check if the scripts can be run, if not reduce hack or grow threads
			// NOTE this is likely to unbalance hack/grow but it should even out across multiple servers
			while (getRequiredRam(hackThreads, growThreads, weakenThreadsBeforeGrow + weakenThreadsAfterGrow) > ramFree) {
				if (hackThreads > growThreads) {
					hackThreads--;
					if (hackThreads <= 0) {
						throw "Not enough RAM on this server (hack threads to 0)";
					}
				} else {
					growThreads--;
					if (growThreads <= 0) {
						throw "Not enough RAM on this server (grow threads to 0)";
					}
				}
				// Calculate min threads to offset hack and grow calls again
				weakenThreadsBeforeGrow = getMinWeakenThreads(hackThreads, 0);
				weakenThreadsAfterGrow = getMinWeakenThreads(0, growThreads);
				// Low ram grouping as above
				if (weakenThreadsBeforeGrow + weakenThreadsAfterGrow < 4) {
					weakenThreadsBeforeGrow = 0;
					weakenThreadsAfterGrow = getMinWeakenThreads(hackThreads, growThreads);
				}
			}

			ns.print(ns.sprintf("Threads after balancing: hack %s ; weaken %s ; grow %s ; weaken %s",
				hackThreads, weakenThreadsBeforeGrow, growThreads, weakenThreadsAfterGrow));

			// Assign the final numbers of threads
			finalHackThreads = hackThreads;
			finalWeakenThreadsBeforeGrow = weakenThreadsBeforeGrow;
			finalGrowThreads = growThreads;
			finalWeakenThreadsAfterGrow = weakenThreadsAfterGrow;
		}

		// Execution times for weaken, grow and hack
		const weakenTime = ns.getWeakenTime(target);
		const growTime = ns.getGrowTime(target);
		const hackTime = ns.getHackTime(target);

		// Milliseconds needed to synchronize calls
		const growSleep = weakenTime - growTime - sleepConstant;
		const weakenDelay = sleepConstant * 1.5;
		const hackSleep = weakenTime - hackTime - sleepConstant * 2;

		// Run the weaken scripts separately only if server has enough ram
		if (finalWeakenThreadsBeforeGrow > 0) {
			// Run weaken() calls that will finish after hack() and before grow() calls
			ns.run(weakenScript.filename, finalWeakenThreadsBeforeGrow, target, 0);

			// Wait for some time so that weaken() calls will finish in between hack() and grow() calls
			await ns.asleep(weakenDelay);
		}

		// Run hack() calls that will finish first
		ns.run(hackScript.filename, finalHackThreads, target, hackSleep);
		// Run grow() calls that will finish after hack() and the first weaken() calls
		ns.run(growScript.filename, finalGrowThreads, target, growSleep);
		// Run weaken() calls that will finish last, after grow() calls
		// The third argument is needed to run, as another instance of the same script is already running
		ns.run(weakenScript.filename, finalWeakenThreadsAfterGrow, target, 0, 0);

		// Wait for the cycle to be over
		// POSSIBLE IMPROVEMENT: if the server has enough ram to start the next cycle, start it right away
		await ns.asleep(weakenTime + weakenDelay + sleepConstant);
		ns.print("Cycle completed: sec " + ns.getServerSecurityLevel(target) + "/" + minSecurityLvl + "; " +
			"money " + ns.getServerMoneyAvailable(target) + "/" + maxMoney);
	}
}