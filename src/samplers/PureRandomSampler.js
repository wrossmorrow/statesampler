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

class PureRandomSampler extends SamplerBase {

    constructor( dataset , options ) {
        if( "strategy" in options ) { delete options.strategy; }
        super( dataset , options );
        this.smplfcn = this.sampleRow_u;
        this.noRepeats = true;
        this.reset(); // this isn't called by super, right? have to explicitly invoke?
    }
    
    // "reset", by clearing samples, counts (super), sampled, and the look-ahead queue
    reset(  ) { 
        super.reset( );
        this.sampled = {};
    }

    // sample for this rid/qid
    sample( rid , qid ) {

        var R = this.smplfcn( this.counts , this.samples ); 

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

        this.samples += 1;
        this.counts[R]++;
        return this.dataset.get( R );

    }

};


module.exports = {
    class : PureRandomSampler , 
    nicknames : [ "uniform" ] , 
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