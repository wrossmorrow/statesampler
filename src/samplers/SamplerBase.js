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

        // initialize things we always include
        this.samples = 0; // total count of samples
        this.counts  = ( new Array( this.dataset.rows.length ) ).fill( 0 );

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

    clear() {
        this.samples = 0; // total count of samples
        this.counts  = ( new Array( this.dataset.rows.length ) ).fill( 0 );
    }

	// simple sampling functions

	sampleRow_u( counts , samples ) { 
	    var R = 0 , maxS = -1.0 , tmp = 0.0;
	    counts.forEach( (c,i) => {
	        tmp = Math.random();
	        if( tmp > maxS ) { maxS = tmp; R = i; }
	    } );
	    return R;
	}

	sampleRow_b( counts , samples ) { 
	    var R = 0 , maxS = -1.0 , tmp = 0.0;
	    counts.forEach( (c,i) => {
	        tmp = Math.random() * ( 1.0 - Math.min( 1.0 , c/samples ) );
	        if( tmp > maxS ) { maxS = tmp; R = i; }
	    } );
	    return R;
	}

	sampleRow_e( counts , samples ) { 
	    var R = 0 , maxS = -1.0 , tmp = 0.0;
	    counts.forEach( (c,i) => {
	        tmp = Math.exp( - Math.random() * c );
	        if( tmp > maxS ) { maxS = tmp; R = i; }
	    } );
	    return R;
	}

	sampleRow_r( counts , samples ) { 
	    var R = 0 , maxS = -1.0 , tmp = 0.0;
	    counts.forEach( (c,i) => {
	        tmp = Math.random() / c;
	        if( tmp > maxS ) { maxS = tmp; R = i; }
	    } );
	    return R;
	}

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