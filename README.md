# bitburnderscripts

Get all files.

``` run hack-manager.js ``` This run at home and utilize all controlled server resources to perform action on target (auto find best target)

``` run newScript.js [target] ``` This run on home to max all threads (RAM) against the target as args[0]. If no args[0], select the best target with the same logic in hack-manager.

``` run buyServer.js [ramLvl] ``` This run on home to buy servers with ram=Math.pow(2,args[0]). ramLvl is number between [1,20]. Show a small reference guild if no args received.

``` run contractSolver.js ``` This run on home to check any contract files (.cct) on all servers and attempt to solve them.

``` Demo ```
