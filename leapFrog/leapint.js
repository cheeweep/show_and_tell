//PLANET CLASS (OBJECT)

function Planet(in_perihelion,in_eccentricity,in_name,in_size,in_color) {
	//constructor

	/* private members */
	var G = 1.0;
	var perihelion = in_perihelion; //velocity at aphelion units of m/s??
	var eccentricity = in_eccentricity; //eccentricity
	this.acceleration_factor = function(){
		return -Math.pow(this.rx*this.rx + this.ry*this.ry,-1.5); //multiply this by rx or ry
	}

	/* public vars & constructor */
	this.name = in_name;
	this.size = in_size;
	this.color = in_color;

	// Note: there are many ways to proceed, but choosing
	// perihelion distance and eccentricity as input
	// and G=M=1
	// we can do the following...

	//initialize (x,v) at perihelion (x-axis)
	this.vx = 0.0;
	this.vy = Math.sqrt((1+eccentricity)/perihelion);
	this.rx = perihelion;
	this.ry = 0.0;
	
	this.af = this.acceleration_factor();

	this.leapfrog = function(DT){
		//this.af = this.acceleration_factor();
		this.vx += this.af*this.rx*DT/2.0;
		this.vy += this.af*this.ry*DT/2.0;
		//update position using new velocity
		this.rx += this.vx*DT;
		this.ry += this.vy*DT;
		//update acceleration based on new position
		this.af = this.acceleration_factor();

		//complete velocity step using final acceleration
		this.vx += this.af*this.rx*DT/2.0;
		this.vy += this.af*this.ry*DT/2.0;
	}

	this.data = function(){
		return {'name':this.name, 'X':this.rx, 'Y':this.ry, 'size':this.size, 'color':this.color};
	}

}


//GLOBAL VARIABLES
var planets;

//Planet(name,perihelion,eccentricity)
//planets[0] = new Planet('earth',0.98329134,0.01671123);

var DT; //time step

//the leapfrog stepping function
function leapFrog(){
	var data = [];

	for(var i=0; i<planets.length; i++){
		data[i] = planets[i].data();
	}
	postMessage(data); //send message to main JS
	
	for(var c=0; c<REPORT; c++){
		for(var i=0; i<planets.length; i++){
			planets[i].leapfrog(DT);
		}
	}

}

//this catches the message to start!
self.addEventListener('message', function(e) {
	var data = e.data;

	//point_masses = data.masses;
	DT = data.init.time_step;
	REPORT = data.init.report;
	var Ps = data.planets;

	planets = [];
	//load initial conditions into planet objects
	for(var i=0; i<Ps.length; i++){
		planets[i] = new Planet(Ps[i].perihelion,Ps[i].eccentricity,Ps[i].name,Ps[i].size,Ps[i].color);
	}

	setInterval("leapFrog();",data.init.interval);
})

