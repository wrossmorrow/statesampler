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

class RandomSampler extends SamplerBase {

    constructor( dataset , options ) {

        super( dataset , options );

        this.smplfcn = this.sampleRow_u;
        if( options ) {
            if( "strategy" in options && options.strategy ) {
                this.define( options.strategy );
            }
        }

        this.noRepeats = true;

        this.sampled   = {};

    }

    // actually define a sampler
    define( strategy ) {
        switch( strategy.charAt(0) ) { 
            case 'u' : this.smplfcn = this.sampleRow_u; break;
            case 'b' : this.smplfcn = this.sampleRow_b; break;
            case 'e' : this.smplfcn = this.sampleRow_e; break;
            case 'r' : this.smplfcn = this.sampleRow_r; break;
            default  : return;
        }
    }
    
    reset(  ) { 
    	this.clear(); 
    }

    clear(  ) {
        this.sampled = {};
        super.clear();
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
        return this.dataset.getRow( R );

    }

};


module.exports = {
    class : RandomSampler , 
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