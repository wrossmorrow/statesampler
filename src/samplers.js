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
        
        constructor( dataset , survey , over ) {

            super();

            this.key       = ( survey ? survey : getHash() );
            this.dataset   = dataset;
            this.over      = ( over
                                ? { resp : ( over.resp ? over.resp : "none" ) , 
                                    obsv : ( over.obsv ? over.obsv : "none" ) }
                                : { resp : "none" , obsv : "none" }
                            );

            this.plan      = []; // Array of arrays, the actual draws to take
            this.rows      = {}; // the response id - plan row mappings
            this.ptrs      = {}; // the current rid indices, in the plan
            this.rcount    = 0;

            this.samples   = 0; // count of samples

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

            // if we __haven't__ seen this rid before...
            if( typeof this.rows[rid] === "undefined" ) {

                if( this.rcount < this.plan.length ) {

                    this.rows[rid] = this.rcount;
                    // this.rids[this.rcount] = rid // inverse map
                    this.rcount += 1;
                    this.ptrs[rid] = 0;

                } else { 

                    // __respondent__ oversampling...

                    if( /random/.test( this.over.resp ) ) { 

                        // __random__ row from the plan
                        this.rows[rid] = Math.floor( Math.random() * this.plan.length );

                    } else if( /biased/.test( this.over.resp ) ) { 

                        // bias using counts towards __least__ finished rows
                        var s = 0;
                        var p = this.plan.map( (l,r) => {
                            var ptr = this.ptrs[ this.rids[r] ];
                            if( ptr == l.length ) { return 0; } // if row is complete, set prob to zero
                            else { var q = 1.0 / ( ptr + 1 ); s += q; return q; } // o/w, bias towards fewer samples
                        } ); // 

                        var u = Math.random(); // random number
                        if( s == 0 ) { // if all rows in the plan were completed, just randomly sample
                            this.rows[rid] = Math.floor( u * this.plan.length );
                        } else { 
                            // if there are some incompletes, sample with a bias towards most incomplete rows
                            u *= s; // (same as dividing p by s, but with a single operation instead)
                            for( var r = 0 ; r < this.plan.length ; r++ ) {
                                if( u <= p[r] ) { break; } else { u -= p[r]; }
                            }
                            this.rows[rid] = r;
                        }

                    } else { return null; } // none, so don't respond

                    // we always set this if responding
                    this.ptrs[rid] = 0;

                }

            }

            // row sampling

            var R = null;

            if( this.ptrs[rid] < this.plan[ this.rows[rid] ].length ) { 

                R = this.plan[ this.rows[rid] ][ this.ptrs[rid] ];
                this.ptrs[rid] += 1;

            } else {

                // __observation__ oversampling... options: 
                // 
                //    uniformly not in respondent's plan
                //    biased sampling from "underviewed" alternatives
                // 

                if( /random/.test( this.over.obsv ) ) { 

                    // random sample __not__ from the plan for this respondent
                    var p = ( new Array( this.dataset.rows.length ) ).fill(1);
                    this.plan[ this.rows[rid] ].forEach( s => { p[s] = 0; } );
                    var u = Math.random(); // random number
                    u *= ( this.dataset.rows.length - this.plan[this.rows[rid]].length );
                    for( R = 0 ; R < this.dataset.rows.length ; R++ ) {
                        if( u <= p[R] ) { break; } else { u -= p[R]; }
                    }

                } // none? don't act. R stays null

            }

            if( R === null ) { return null; }
            else { 
                this.samples += 1;
                this.counts[R] += 1;
                return this.dataset.getRow( R ); 
            }

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