/** @param {NS} ns **/
export async function main(ns) {
	ns.exec('contractSolver.js', 'home'); // Solving contracts
	// ns.exec('hackManager.js', 'home'); // auto Root servers and grind money using connected servers.
	ns.exec('stockMaster.js','home') // more bn8 stock functions. Required helpers.js
	ns.exec('bn4.js', 'home'); // auto backdoor factions.
	ns.exec('newScript.js', 'home'); // starts grinding money
	// ns.exec('gangManager.js','home'); // auto manage gang
}
