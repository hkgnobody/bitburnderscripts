/** @param {NS} ns **/
export async function main(ns) {
	const tmpFloor = Math.floor;
	Math.floor = (number) => { return 1 };
	while (ns.getServerMoneyAvailable('home') < 9.7e9) {
		await ns.sleep(1000);
	}
	Math.floor = tmpFloor;
}
