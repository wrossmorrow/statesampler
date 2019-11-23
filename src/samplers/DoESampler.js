/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const SamplerBase = require( __dirname + "/SamplerBase.js" );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

class DoESampler extends SamplerBase {
    
    constructor( dataset , options ) {

        super( dataset , options );

        // locally relevant options: over , plan

        // "oversample" parameter... 
        this.over      = { resp : "none" , obsv : "none" }
        if( "over" in options ) {
            over.resp = ( options.over.resp ? options.over.resp : "none" );
            over.obsv = ( options.over.obsv ? options.over.obsv : "none" );
        }

        // the "plan"
        this.plan      = []; // Array of arrays, the actual draws to take
        if( "plan" in options ) { this.define(options.plan); } // let define handle checks

        this.rows      = {}; // the response id - plan row mappings
        this.ptrs      = {}; // the current rid indices, in the plan rows
        this.rids      = new Array( this.plan.length ); // quick inverse map
        this.rcount    = 0;

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
        this.ptrs      = {}; // the current rid indices, in the plan rows
        this.rids      = new Array( this.plan.length ); // quick inverse map
        super.clear();
    }

    // get next response for a certain respondent id
    sample( rid , qid ) {

        // if we __haven't__ seen this rid before...
        if( typeof this.rows[rid] === "undefined" ) {

            if( this.rcount < this.plan.length ) {

                this.rows[rid] = this.rcount;
                this.rids[this.rcount] = rid // quick inverse map
                this.rcount += 1;
                this.ptrs[rid] = 0;

            } else { 

                // __respondent__ oversampling...

                if( /random/.test( this.over.resp ) ) { 

                    // __random__ row from the plan
                    this.rows[rid] = Math.floor( Math.random() * this.plan.length );

                } else if( /biased/.test( this.over.resp ) ) { 

                    // bias using counts towards __least__ finished rows... 
                    // we need some mechanism to "replace" finished entries with unfinished ones
                    var s = 0;
                    var p = this.plan.map( (l,r) => {
                        var ptr = this.ptrs[ this.rids[r] ]; 
                        if( ptr == l.length ) { return 0; } // if row is complete, set prob to zero
                        else { var q = 1.0 / ( ptr + 1 ); s += q; return q; } // o/w, bias towards fewer samples
                    } ); // 

                    var u = Math.random(); // random number
                    if( s == 0 ) { // if __all__ rows in the plan have been completed, just randomly sample
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

module.exports = {
    class : DoESampler , 
    nicknames : [ 'doe' , 'DOE' , "DoE" ] , 
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