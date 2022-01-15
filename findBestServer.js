/** @param {NS} ns **/
/**
 * Find Hackable servers, Rootable servers, and the best target 
 */
export async function findHRTServer(ns) {
	const allServers = await findAllServers(ns);  // finds all servers and clones grow hack and weaken files
	const hackAndRootableServers = await findHackable(ns, allServers); // finds and nukes hackable, and rootale servers.	
	const hackable = hackAndRootableServers[0];
	const rootable = hackAndRootableServers[1];
	const target = await findOptimal(ns, hackAndRootableServers[0]); //finds optimal server to hack
	return [hackable, rootable, target];
}

/** Script to execute an hack() call after a specified cooldown */
const hackScript = { "filename": "h1.js" };
/** Script to execute a grow() call after a specified cooldown */
const growScript = { "filename": "g1.js" };
/** Script to execute a weaken() call after a specified cooldown */
const weakenScript = { "filename": "w1.js" };

/**
* Returns an array of all searchable servers
*/
async function findAllServers(ns) {
	const fileList = [hackScript.filename, growScript.filename, weakenScript.filename]; //These files just infinitely hack, weaken, and grow respectively.
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
				await ns.scp(fileList, "home", edges[i]);
			}
		}
	}
	return Object.keys(serverDiscovered);
}

/**
* Finds list of all hackable and all rootable servers.
* A hackable server is one which you can hack, grow, and weaken.
* A rootable server is one which you can nuke.
* Returns a 2d array with list of hackable and rootable server to hack
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
	return [hackableServers, rootableServers];
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
