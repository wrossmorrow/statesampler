/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * IMPORTS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const SharedBaseClass = require( __dirname + "/../SharedBaseClass.js" );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * LOCAL METHODS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// sample _uniformly_... 
function sampleRow_u( counts , samples ) { 
    return Math.floor( Math.random() * counts.length );
}
/*
var R = 0 , maxS = -1.0 , tmp = 0.0;
counts.forEach( (c,i) => {
    tmp = Math.random();
    if( tmp > maxS ) { maxS = tmp; R = i; }
} );
return R;
*/

// sample _balanced_ uniformly... if we keep a histogram we could do this more efficiently
// by first sampling a "bin" and then a random element from that "bin"... should be equivalent
function sampleRow_b( counts , samples ) { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.random() * ( 1.0 - Math.min( 1.0 , c/samples ) );
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

// sample _exponentially_ weighting away from previous sample counts
function sampleRow_e( counts , samples ) { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.exp( - Math.random() * c );
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

// sample _reciprocally_ weighting away from previous sample counts
function sampleRow_r( counts , samples ) { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.random() / c;
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * EXPORTS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

module.exports = class SamplerBase extends SharedBaseClass {

    constructor( dataset , options ) {

    	// initialize superclass
    	super( options );

    	// create or store key
    	if( options ) {
	    	if( "key" in options && options.key ) { 
	    		this.key = options.key; 
	    	} else if( "survey" in options && options.survey ) { 
	    		this.key = options.survey; 
	    	} else {
	    		this.key = this.getHash();
	    	}
    	} else {
    		this.key = this.getHash();
    	}

    	// store dataset (reference)
        this.dataset = dataset;

        // initialize the samples and counts
        this.reset();

    }

    info() {
    	return {
    		type    : this.type , 
    		created : this.created , 
    		name    : this.name , 
    		description : this.desc , 
    		samples : this.samples , 
    	};
    }

    reset() {
        this.samples = 0; // total count of samples
        this.counts  = ( new Array( this.dataset.rows.length ) ).fill( 0 );
    }

	// simple sampling function wrappers
	sampleRow_u() { return sampleRow_u( this.counts , this.samples ); }
	sampleRow_b() { return sampleRow_b( this.counts , this.samples ); }
	sampleRow_e() { return sampleRow_e( this.counts , this.samples ); }
	sampleRow_r() { return sampleRow_r( this.counts , this.samples ); }

}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */