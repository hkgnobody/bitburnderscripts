/** @param {JS} js **/
// Singularity (BN4) needed.
export async function main(ns) {
	let crimeSuccessThreshold = 0.7;// chance of success eg: 1=100%,
	ns.tail();
	let time = 30e3; // sleep 30 sec if user is busy
	let i = 0;
	let crimes = ["Heist", "Assassinate", "Kidnap and Ransom", "Grand theft Auto",
		"Homicide", "Traffick illegal Arms","Bond Forgery", "Deal Drugs", "Larceny", "Mug someone", "Rob store", "Shoplift"];
	while (true) {
		while (!ns.isBusy()) {
			let crime = crimes[i];
			if (i > crimes.length)
				i = 0;
			if (ns.getCrimeChance(crime) >= crimeSuccessThreshold) {
				i = 0;
				time = ns.commitCrime(crime);
			}
			else
				i++;
		}
		await ns.sleep(time);
	}
}
