/** @param {NS} ns **/
export async function main(ns) {
	let myMoney = ns.getServerMoneyAvailable("home");
	let maxServerLvl = Math.log2(ns.getPurchasedServerMaxRam());
	ns.tprint("Current Money: " + trimBigNumber(ns, myMoney));
	if (ns.args.length == 0) {
		printUsageGuide(ns,maxServerLvl);
	}
	else if (ns.args.length > 1) {
		throw "Wrong usage, only need 0/1 argument: [none]/<ramLevel>";
	}
	else {
		const ramLvl = ns.args[0];
		if (ramLvl > maxServerLvl || ramLvl < 1) {
			throw "Wrong usage, ramLvl between [1,"+maxServerLvl+"]";
		}
		ns.purchaseServer("pServ", Math.pow(2, ramLvl));
		myMoney = ns.getServerMoneyAvailable("home");
		ns.tprint("Money After buying server: " + trimBigNumber(ns, myMoney));
	}
}

function generateServerPriceArr(ns,maxServerLvl) {
	let serverPriceArr = []
	for (let ramLvl = 1; ramLvl < maxServerLvl+1; ramLvl++) {
		let moneyNeed = ns.getPurchasedServerCost(Math.pow(2, ramLvl));
		serverPriceArr.push(moneyNeed);
	}
	return serverPriceArr;
}

function printUsageGuide(ns,maxServerLvl) {
	let arr = generateServerPriceArr(ns,maxServerLvl);
	let rowString = arr.map((it) => { return " " + trimBigNumber(ns, it) });
	ns.tprint("Price for serverLvl 1-10: " + rowString.slice(0, 10));
	ns.tprint("Price for serverLvl 11-20:" + rowString.slice(10));
}

function trimBigNumber(ns, realPrice) {
	return ns.nFormat(realPrice, "($0.00a)");
}
