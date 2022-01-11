/** @param {NS} ns **/
export async function main(ns) {
	let myMoney = ns.getServerMoneyAvailable("home");
	ns.tprint("Current Money: " + trimBigNumber(myMoney));
	if (ns.args.length == 0) {
		printUsageGuide(ns);
	}
	else if (ns.args.length > 1) {
		throw "Wrong usage, only need 0/1 argument: [none]/<ramLevel>";
	}
	else {
		const ramLvl = ns.args[0];
		if (ramLvl > 20 || ramLvl < 1) {
			throw "Wrong usage, ramLvl between [1,20]";
		}
		ns.purchaseServer("pServ", Math.pow(2, ramLvl));
		let myMoney = ns.getServerMoneyAvailable("home");
		ns.tprint("Money After buying server: " + trimBigNumber(myMoney));
	}
}

function generateServerPriceArr() {
	let serverPricePerRam = 55000;
	let serverPriceArr = []
	for (let ramLvl = 1; ramLvl < 21; ramLvl++) {
		let moneyNeed = serverPricePerRam * Math.pow(2, ramLvl);
		serverPriceArr.push(moneyNeed);
	}
	return serverPriceArr;
}

function printUsageGuide(ns) {
	let arr = generateServerPriceArr();
	let rowString = arr.map((it) => { return " " + trimBigNumber(it) });
	ns.tprint("Price for servers 1-10: " + rowString.slice(0, 10));
	ns.tprint("Price for servers 11-20:" + rowString.slice(10));
}

function trimBigNumber(realPrice) {
	if (realPrice > Math.pow(10, 12))
		return (realPrice / Math.pow(10, 12)).toFixed(2) + "T";
	else if (realPrice > Math.pow(10, 9))
		return (realPrice / Math.pow(10, 9)).toFixed(2) + "B";
	else if (realPrice > Math.pow(10, 6))
		return (realPrice / Math.pow(10, 6)).toFixed(2) + "M";
	else if (realPrice > Math.pow(10, 3))
		return (realPrice / Math.pow(10, 3)).toFixed(2) + "K";
	else
		return (realPrice / Math.pow(10, 0)).toFixed(2) + "";
}
