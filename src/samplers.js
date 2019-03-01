/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const _crypto = require( 'crypto' );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// logging style
const logger = ( s ) => { console.log( ( new Date( Date.now() ).toISOString() ) + " | " + s ); }

// uniform time
const getTime = () => ( new Date( Date.now() ).toISOString() );

// get a random hash
const getHash = () => {
    var current_date = ( new Date() ).valueOf().toString();
    var random = Math.random().toString();
    return String( _crypto.createHash('sha1').update( current_date + random ).digest('hex') );
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

const sampleRow_u = function( counts , samples ) { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.random();
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

const sampleRow_b = function( counts , samples ) { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.random() * ( 1.0 - Math.min( 1.0 , c/samples ) );
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

const sampleRow_e = function( counts , samples ) { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.exp( - Math.random() * c );
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

const sampleRow_r = function( counts , samples ) { 
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
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

class NameableDescribeable {

    constructor() {
        this.name     = "";
        this.desc     = "";
    }

    setName( name ) { this.name = name; }
    setDesc( desc ) { this.desc = desc; }

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

module.exports = {

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * RANDOM SAMPLERS
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    RandomSampler : class RandomSampler extends NameableDescribeable {

        constructor( dataset , survey ) {

            super();

            this.key       = ( survey ? survey : getHash() );
            this.dataset   = dataset;
            this.smplfcn   = sampleRow_u;
            this.noRepeats = true;

            this.sampled   = {};
            this.samples   = 0;

            this.counts    = new Array( this.dataset.rows.length );
            for( var i = 0 ; i < this.dataset.rows.length ; i++ ) { 
                this.counts[i] = 0.0; 
            }

        }

        // actually define a sampler
        define( strategy ) {
            switch( strategy.charAt(0) ) { 
                case 'u' : this.smplfcn = sampleRow_u; break;
                case 'b' : this.smplfcn = sampleRow_b; break;
                case 'e' : this.smplfcn = sampleRow_e; break;
                case 'r' : this.smplfcn = sampleRow_r; break;
                default  : return;
            }
        }

        reset(  ) { this.clear(); }

        clear(  ) {
            this.sampled = {};
            this.counts = new Array( this.dataset.rows.length );
            for( var i = 0 ; i < this.dataset.rows.length ; i++ ) { 
                this.counts[i] = 0.0; 
            }
            this.samples = 0;
        }

        // sample for this rid/qid
        sample( rid , qid ) {

            var R = this.smplfcn( this.counts , this.samples ); 

            if( ( rid !== null ) && this.noRepeats ) {

                if( this.sampled[ rid ] ) {

                    // we have to make sure that this can't pathologically fail and loop indefinitely
                    resamples = 1;
                    while( this.sampled[ rid ].indexOf( R ) >= 0 ) { 
                        R = this.smplfcn( this.counts , this.samples ); 
                        if( resamples >= 10 ) { break; }
                        resamples += 1;
                    } 

                    this.sampled[ rid ].push( R );

                    // ok, so this retry loop seems annoying. But can't we use smarter strategies, 
                    // like sampling from the remaining options? We __could__ filter the counts, 
                    // track the indices, pass the filtered counts to the sample function, and then
                    // sample from that. This places a condition on the sampling function? 

                } else { this.sampled[ rid ] = [ R ]; }

            }

            this.samples += 1;
            logger( "GET  /sample request " + this.samples + " sampled row " + R );
            this.counts[R]++;
            return this.dataset.getRow( R );

        }

    } , 

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * DESIGN OF EXPERIMENT SAMPLERS
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    DoESampler : class DoESampler extends NameableDescribeable {
        
        constructor( dataset , survey ) {

            super();

            this.key       = ( survey ? survey : getHash() );
            this.dataset   = dataset;

            this.plan      = []; // Array of arrays, the actual draws to take
            this.rows      = {}; // the response id - plan row mappings
            this.ptrs      = {}; // the current rid indices, in the plan
            this.rcount    = 0;

            this.samples   = 0; // 

            this.counts    = new Array( this.dataset.rows.length );
            for( var i = 0 ; i < this.dataset.rows.length ; i++ ) { 
                this.counts[i] = 0.0; 
            }

        }

        // actually define a "plan", which should be a "list of lists" for sampling
        define( plan ) {
            this.plan = JSON.parse( JSON.stringify( plan ) ); // deep copy hack
        }

        reset(  ) {
            this.plan      = []; // Array of arrays, the actual draws to take
            this.rcount    = 0;
            this.clear();
        }

        clear(  ) {
            this.rows      = {}; // the response id - plan row mappings
            this.ptrs      = {}; // the current rid indices, in the plan
            this.samples   = 0; // 
            this.counts    = new Array( this.dataset.rows.length );
            for( var i = 0 ; i < this.dataset.rows.length ; i++ ) { 
                this.counts[i] = 0.0; 
            }
        }

        // get next response for a certain respondent id
        sample( rid , qid ) {

            if( typeof this.rows[rid] === "undefined" ) {
                if( this.rcount < this.plan.length ) {
                    this.rows[rid] = this.rcount;
                    this.rcount += 1;
                    this.ptrs[rid] = 0;
                } else { return null; }
            }

            if( this.ptrs[rid] >= this.plan[ this.rows[rid] ].length ) { return null; }
            var R = this.plan[ this.rows[rid] ][ this.ptrs[rid] ];
            this.ptrs[rid] += 1;
            this.samples += 1;
            this.counts[R] += 1;

            if( R === null ) { return null; }
            else { return this.dataset.getRow( R ); }

        }

    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * 
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */