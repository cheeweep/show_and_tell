//Author: Michael Folkerts (mmfolkerts@gmail)
//May 2013
//TA example for Phys 242, UCSD

//Globals
var WARM_UP = 10000;	//sweeps to warm up
var BigN = 10000;		//number of sampled sweeps
var SAMP_PERIOD = 100;  //sweeps between samples
var LEN = 1000;         //number of points in path
var DELTA = 3.0;		//range of MC update for given x[i]
var OMEGA = 0.15;		//frequency

var FIRST_TAU = 5;		//Offset to begin C(tau) calculations
var LAST_TAU = 15;		//Final offest for C(tau) calculations

//computed globals
var OMEGA_SQ = Math.pow(OMEGA,2);
var W = 1.0 + OMEGA_SQ/2.0; //a value used in optimized calculation


function main(){

	var i; //reused counter

	//the Feynman path sample
	var x = [];//new Array();
	x.length = LEN+1; //adding placeholder for ring element

	//the correlator array C(tau)
	var corrs = [];
	corrs.length = LAST_TAU-FIRST_TAU+1;

	//variable to hold energy
	E = 0.0;
	E_sq = 0.0;

	//initialize path the array
	for(i=0; i<LEN+1; i++){
		x[i] = 0.0;
	}
	
	//initialize correlator array
	for(i=0; i < corrs.length; i++){
		corrs[i] = 0.0;
	}

	//here we warm up the Feynman Paths
	MCMC_Update(x,WARM_UP);

	var N = BigN;
	while(N--){ //this is an optimized 'for' loop
		//run 100 sweeps
		MCMC_Update(x,SAMP_PERIOD);
		
		//calc Correlators
		CORR_Update(x,corrs,FIRST_TAU,LAST_TAU);
		
		//calc E
		n = LEN;
		while(--n){
			E += Math.pow(x[n],2);
			E_sq += Math.pow(x[n],4);
		}
		
		//update display every 10 samples 
		if(N%10 === 0){
			//compute values of interest
			E_ave = E/LEN*OMEGA_SQ/(BigN - N);
			Esq_ave = E_sq/LEN*Math.pow(OMEGA,4)/(BigN - N);
			E_error = Math.sqrt((Esq_ave - E_ave*E_ave)/(BigN - N - 1));
			delta_E1 = CORR_delta_Ave(corrs); //E1-E0
			
			//send to display
			postMessage({'string':"E_0 = " + String(E_ave).slice(0,7) + " +/- " + String(E_error).slice(0,7) + " <br />" +
								"E_1 - E_0 = " + String(delta_E1).slice(0,7) + "<br />",'hist':x,'corrs':corrs});
		}
	}
}

function calcE (x0,x1,x2) {
	return Math.pow(x0 - x1,2) + Math.pow(x2 - x0,2) + OMEGA_SQ*Math.pow(x0,2);
}

function calcR (d,x0,x1,x2){
	//return Math.exp( W*( Math.pow(x0,2) - Math.pow(xt,2) ) + (xt-x0)*(x1+x2) )
	return Math.exp( d*( (x1+x2) - W*(d + 2.0*x0) ) ); //found after some algebra simplifications

}

function CORR_delta_Ave(corrs){
	//Here we calculate the average E1-E0 values using the correlator approach
	var i;
	var N = corrs.length-1;
	var sum = 0.0;
	for(i=0; i<N;i++){
		sum += -Math.log(corrs[i+1]/corrs[i]); //notice that all averaging calcs cancel here
	}
	return sum/N;
}

function CORR_Update(x,corrs,first,last){
	var c=0; //corrs index
	var i;   //counter
	var N;   //counter
	for(var tau=first; tau<=last; tau++){
		N = LEN-tau; //don't let 'i' go overshoot corrs length
		for(i=0; i<N; i++){
			corrs[c] += x[i]*x[i+tau];
		}
		//for now we ignore ring condition
		c++; //move to next correlator index
	}
}

function MCMC_Update (x,itr) {
	//this code has been highly optimized to increase performance
	
	//var E_current;	//current energy
	//var E_trial;		//trial energy
	var x_trial;		//trial position
	var r;				//trans probability
	
	while(itr--){ //optimized for loop
		for(var i=1; i<LEN; i++){
			//E_current = calcE(x[i],x[i-1],x[i+1]);
			x_trial = DELTA*(Math.random() - 0.5);
			//E_trial = calcE(x_trial,x[i-1],x[i+1]);
			r = calcR(x_trial,x[i],x[i-1],x[i+1]);//Math.exp(0.5*(E_current - E_trial));
			if( r >= 1.0){
				x[i] = x[i] + x_trial;
			}else if (Math.random() < r){
				x[i] = x[i] + x_trial;
			}
		}

		//evaluate ring element @ x[LEN]
		x_trial = DELTA*(Math.random() - 0.5);
		r = calcR(x_trial,x[LEN],x[LEN-1],x[1]);
		if( r >= 1.0){
			x[LEN] = x[LEN] + x_trial;
		}else if (Math.random() < r){
			x[LEN] = x[LEN] + x_trial;
		}

		//set ring condition
		x[0] = x[LEN];
	}
}

//this catches the message from the desplay to start!
self.addEventListener('message', function(e) {
	var data = e.data; //ignored for now
	setTimeout(main,0);//data.init.interval);
});
