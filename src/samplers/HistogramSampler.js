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

class HistogramSampler extends SamplerBase {

    constructor( dataset , options ) {

        super( dataset , options );

        this.noRepeats = true;

        this.reset(); // this isn't called by super, right? have to exxplicitly invoke?

    }
    
    // "reset", by clearing samples, counts (super), sampled, and the look-ahead queue
    reset(  ) { 
        super.reset( );
        this.sampled = {};
        this.histogram = [ {
            c : 0 , // count value is initially just zero
            N : this.dataset.rows.length , // this "bin" has all the data
            f : 1.0 , // f value is initially irrelevant
            p : 1.0 , // p value (count class choice probability) is unity
            B : ( new Array( this.dataset.rows.length ).fill(0) ).map( (x,i) => (i) )
        } ];
    }

    // 
    drawFromHistogram( ) {

        // first draw a value from the histogram
        let U = Math.random();

        // if no nontrivial histogram, just draw at random
        if( this.histogram.length == 1 ) {
            return [ 0 , Math.floor( U * this.dataset.rows.length ) ];
        }

        // otherwise, walk through histogram values to choose a count
        let b = 0;
        while( U > this.histogram[b].p ) {
            U -= this.histogram[b].p; b += 1;
        }
        // ok, b now has a draw of a histogram bin

        // draw a random entry... 
        if( this.histogram[b].N == 1 ) { 
            return [ b , this.histogram[b].B[0] ];
        }

        let R = Math.floor( Math.random() * this.histogram[b].B.length );
        return [ b , this.histogram[b].B[R] ];

        // NOTE: we update later

    }

    // update the histogram given sample R from bin b
    updateHistogram( b , R ) {

        // change the number of and bin indices for this chosen bin
        this.histogram[b].N -= 1;
        if( this.histogram[b].N > 0 ) { 
            this.histogram[b].B = this.histogram[b].B.filter( r => ( r != R ) );
        } // if N == 0, we'll just remove that entry anyway...

        // so the count value chosen was this.histogram[b].c
        // R now has this.histogram[b].c + 1 samples
        // does _that_ object exist? 

        // importantly, if we store histogram objects in order of INCREASING counts
        // we can limit our search to b+1 , ... , this.histogram.length-1
        let cp = this.histogram[b].c + 1;
        while( cp > this.histogram[b].c ) { 
            b += 1; 
            if( b >= this.histogram.length ) { break; }
        }
        // either b >= this.histogram.length or cp <= this.histogram[b].c
        if( b >= this.histogram.length ) { // we've should ADD AT THE END
            this.histogram.push( { c : cp , N : 1 , f : 0.0 , p : 0.0 , B : [ R ] } );
        } else if( cp == this.histogram[b].c ) { // we can add to an EXISTING bin
            this.histogram[b].N += 1;
            this.histogram[b].B.push( R );
        } else { // this.histogram[b-1].c < cp < this.histogram[b].c, we need to INSERT a bin
            let B = this.histogram.length;
            this.histogram.push({});
            while( B > b ) {
                this.histogram[B] = this.histogram[B-1];
                B -= 1;
            }
            this.histogram[b] = { c : cp , N : 1 , f : 0.0 , p : 0.0 , B : [ R ] };
        }

        // HACKISH
        this.histogram = this.histogram.filter( B => ( B.N > 0 ) );

        // compute "f" values; this is where a MODEL comes in... 
        if( this.histogram.length == 1 ) {
            this.histogram[0].f = 1.0;
            this.histogram[0].p = 1.0;
        } else {
            let maxc = this.histogram[this.histogram.length-1].c;
            let minc = this.histogram[0].c;
            let delc = maxc - minc;
            this.histogram.forEach( B => { B.f = (maxc-B.c)/delc; } );

            // compute "p" values from f
            let Psum = 0.0;
            this.histogram.forEach( B => { Psum += B.f; } );
            this.histogram.forEach( B => { B.p = B.f / Psum; } );

        }

    }

    // sample for this rid/qid
    sample( rid , qid ) {

        let b , R , result;

        // draw a record from the histogram
        result = this.drawFromHistogram(); b = result[0]; R = result[1];

        if( ( rid !== null ) && this.noRepeats ) {

            if( this.sampled[ rid ] ) {

                // we have to make sure that this can't pathologically fail and loop indefinitely
                var resamples = 1;
                while( this.sampled[ rid ].indexOf( R ) >= 0 ) { 
                    result = this.drawFromHistogram(); b = result[0]; R = result[1];
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

        // update histogram
        //
        // ** Should this be async like through a promise response? ** That is, 
        // respond to the caller with the sample, THEN update? 
        //
        this.updateHistogram( b , R );

        return this.dataset.get( R );

    }

};


module.exports = {
    class : HistogramSampler , 
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