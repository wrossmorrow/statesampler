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

// A possible efficiency? If the server is just "sitting around", cache some samples for the
// sampling strategy (e.g., look-ahead samples). If you have a cache of those, you can just 
// return values when asked. You could execute that in a child process, or "this" process. 
// (Point would be to use compute in "this" process though.) Such LAS (Look-Ahead Sampling)
// wouldn't be able to account for non-overlapping samples (within respondents), and thus we 
// would need to have a smart array/object draw strategy. 
// 
// HOWEVER - samples depend on EVERY observation so we can only "look-ahead" one draw. Is that 
// worth it? Is there a variant that is efficient? 
// 
// If you track respondents, you could queue a sample _for each respondent_, as long as you 
// update those samples along with the counts (perhaps with some tolerance). 
// 
// How important is having the "right" counts? How dramatically do the counts have to change 
// to "sufficiently influence" the sampler properties? 
// 

class BalancedRandomSampler extends SamplerBase {

    constructor( dataset , options ) {

        super( dataset , options );

        this.smplfcn = this.sampleRow_u;
        if( options ) {
            if( "strategy" in options && options.strategy ) {
                this.define( options.strategy );
            }
        }

        this.noRepeats = true;

        this.reset(); // this isn't called by super, right? have to exxplicitly invoke?

    }
    
    // "reset", by clearing samples, counts (super), sampled, and the look-ahead queue
    reset(  ) { 
        super.reset( );
        this.sampled = {};
        this.maxc = 0; // max count, incremented
        this.avgc = 0.0; // average count, incremented
        this.countSums = ( new Array( this.dataset.rows.length ) ).fill( 0 ); // sequential count sums
    }

    // sample for this rid/qid
    sample( rid , qid ) {

        let Up = this.dataset.rows.length * ( this.maxc - this.avgc ) * Math.random();
        let R = 0;
        while( Up <= - this.countSums[R] ) { 
            R += 1; Up -= this.maxc;
        }
        // 
        // ok, so if we get here, R is our sample? At least, 
        // 
        //      - sum_{i<=R} c_i < Up - R maxc
        // 
        // so... 
        // 
        //      Up - R maxc <= maxc - sum_{i<=R+1} c_i
        //      Up - (R+1) maxc <= - sum_{i<=R+1} c_i
        // 
        // too?
        // 
        // Note at least that if this goes "all the way", 
        //
        //      Up - N maxc <=(?) - sum_i c_i ... sum_i c_i <= N maxc, - N maxc <= - sum_i c_i
        //      Up <=(?) N maxc - sum_i c_i >= 0
        //

        if( ( rid !== null ) && this.noRepeats ) {

            if( this.sampled[ rid ] ) {

                // we have to make sure that this can't pathologically fail and loop indefinitely
                var resamples = 1;
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

        // update maximum count and average count
        this.maxc += ( this.counts[R] == this.maxc ? 1 : 0 );
        this.avgc += 1.0 / this.dataset.rows.length;
        for( var i = R ; i < this.dataset.rows.length ; i++ ) { this.countSums += 1; }

        this.samples += 1;
        this.counts[R]++;

        return this.dataset.get( R );

    }

};


module.exports = {
    class : BalancedRandomSampler , 
    nicknames : [ "random" ] , 
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