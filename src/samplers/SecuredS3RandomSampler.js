/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const AWS = require( 'aws-sdk' );

const _crypto = require( 'crypto' );

const EphemeralSet = require( 'ephemeral-set' );

const RandomSampler = require( __dirname + "/RandomSampler.js" ).class; // NOTE THE EXTRA STEP

const getRandomKey = () => ( _crypto.randomBytes(24).toString('hex') );

const s3URLFormat = /https:\/{2}(([^\.]+)\.){0,1}s3(-([^\.]+)){0,1}\.amazonaws\.com\/(.*)/;

const decodeS3URL = {

    'parts' : ( url ) => ( url ) , 

    's3obj' : ( url ) => ( url.bucket + '/' + url.key ) , 

    's3url' : ( url ) => {

        // parse S3 URL components, and exit if that fails
        let match = s3URLFormat.exec( url ); if( ! match ) { return null; }

        // decoding s3 urls...
        // bucket-format: match[2], match[4], match[5] are the bucket, region, and key
        // path-format: if match[2] is undefined, then match[5] starts with the bucket name
        let result = { bucket : match[2] , region : match[4] , key : match[5] };
        if( ! result.bucket ) {
            match  = /([^\/]+)\/(.*)/.exec( result.key );
            result.bucket = match[1]; 
            result.key = match[2];
        }

        // return the parsed result
        return result;
    } ,
    
};

const defaultLifeSecs = 60.0;

const floatRegex = /^[0-9]+(\.[0-9]+){0,1}$/;

// P[n]Y[n]M[n]DT[n]H[n]M[n]S
const iso8601dur = /^(P([0-9]+[YMWD]){0,4}){0,1}(T([0-9]+[HMS]){0,3}){0,1}$/i;

// conversions for each time unit into seconds
var units = { TS : 1.0 };
units.TM = units.TS * 60.0;
units.TH = units.TM * 60.0;
units.PD = units.TH * 24.0;
units.PW = units.PD * 7.0;
units.PY = units.PD * 365.0;
units.PM = units.PY / 12.0; // approximate

// convert an ISO8601 duration string to seconds
const iso8601Secs = ( s ) => {

    let match = iso8601dur.exec( s );
    if( ! match ) { return null; }

    let p = match[1] , t = match[4] , secs = 0.0;

    if( p ) {
        let pre = /([0-9]+)([YMWD])/ig , m;
        while( ( m = pre.exec( p ) ) !== null ) {
            secs += parseInt( m[1] ) * units[ 'P' + m[2].toUpperCase() ];
        }
    }

    if( t ) {
        let tre = /([0-9]+)([HMS])/ig , m;
        while( ( m = tre.exec( t ) ) !== null ) {
            secs += parseInt( m[1] ) * units[ 'T' + m[2].toUpperCase() ];
        }
    }

    return secs;

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

class SecuredS3RandomSampler extends RandomSampler {

    constructor( dataset , options ) {

        // make sure we initialize the super class, RandomSampler
        super( dataset , options );

        // no required options? THERE ARE: AWS credentials...
        if( ! options ) { 
            this.throwNewError( 400 , `SecuredS3RandomSampler requires some "options".` );
        }

        // have to have AWS credentials
        if( ! ( "aws" in options ) && ! options.aws ) {
            this.throwNewError( 400 , `SecuredS3RandomSampler requires AWS credentials.` );
        } 
        if( ! ( "accessKey" in options.aws ) && ! options.aws.accessKey ) {
            this.throwNewError( 400 , `SecuredS3RandomSampler requires an AWS access key id.` );
        }
        if( ! ( "secretKey" in options.aws ) && ! options.aws.secretKey ) {
            this.throwNewError( 400 , `SecuredS3RandomSampler requires an AWS secret access key.` );
        }

        // have to have public bucket, at least (prefix actually "optional")
        if( ! ( "public" in options.aws ) && ! options.aws.public ) {
            this.throwNewError( 400 , `SecuredS3RandomSampler requires a public S3 bucket.` );
        }
        if( ! ( "bucket" in options.aws.public ) && ! options.aws.public.bucket ) {
            this.throwNewError( 400 , `SecuredS3RandomSampler requires a public S3 bucket.` );
        }

        // minimum "buffer size" (actually optional)
        this.minCopies = ( options.minCopies ? options.minCopies : 1 ); 

        // url formatting
        if( "urlFormat" in options && options.urlFormat ) {
            if( ! /s3url|s3obj|parts/.test( options.urlFormat ) ) {
                this.throwNewError( 400 , `Invalid URL Format setting.` );
            }
            this.urlFormat = options.urlFormat; 
        } else {
            this.urlFormat = 's3obj';
        }

        // url field
        if( "urlField" in options && options.urlField ) {
            // you can check with the dataset's "header", to make sure this exists.
            this.urlField = options.urlField; 
        } else {
            this.urlField = null;
        }

        // maintain a data structure (linked list?) ** that makes deletion efficient **
        // delete after 10 seconds and check every second
        this.expirer = new EphemeralSet( k => { this.expirePublicS3Object(k); } , 'T10S' , 'T1S' );
        this.expirer.start();

        // create S3 client with passed credentials (which we must pass)
        this.s3 = new AWS.S3( {
            apiVersion      : '2006-03-01' , 
            accessKeyId     : options.aws.accessKey , 
            secretAccessKey : options.aws.secretKey , 
        } );

        // define the bucket that should be public access (but don't change permissions)
        this.publicBucket = options.aws.public.bucket.replace(/\/$/,''); // no trailing slash

        // we could use the sampler key (from super) by default as a prefix
        this.publicPrefix = this.key;
        if( "prefix" in options.aws.public && options.aws.public.prefix ) {
            this.publicPrefix = options.aws.public.prefix.replace(/\/$/,''); // no trailing slash
        }

        // do we need to _create_ the public bucket? at least check that it exists? 


        // does the prefix given exist already in the public bucket? is that a problem if it does?


        // we can implement public-bucket object expiration with lifecycle policies
        // if our expiration timeline is __long__ (measured in days). That's a 
        // reasonable backstop, in any case, so worth setting overall I think. 
        var params = {
            Bucket : this.publicBucket , 
            LifecycleConfiguration : {
                Rules : [ {
                    Expiration : { Days : 1 } , 
                    Filter     : { Prefix : this.publicPrefix + '/' } , 
                    ID         : "TestOnly" , 
                    Status     : "Enabled" , 
                } ]
            }
        };
        this.s3.putBucketLifecycleConfiguration( params ).promise()
            .catch( err => { 
                console.log( err , err.stack ); 
            } );

        // initialize the buffers of copies, so we aren't waiting for copies to be made
        // requires bucket to exist (and be write-accessible under the credentials)
        // 
        // NOTE: async and, depending on the objects, could be time consuming
        // 
        this.temps = {};
        this.ready = false;
        let copies = 0 , 
            total = this.counts.length * this.minCopies;
        for( var i = 0 ; i < this.counts.length ; i++ ) {

            // get bucket, s3key for the i'th dataset row
            let row = this.dataset.getRow( i );

            // row has a "url" field? or we set that in constructor as a header? 
            let data = this.decodeS3URL( row );

            // process further only if the URL is an S3 URL
            if( data ) {  // make minCopies copies of each item
                for( var j = 0 ; j < this.minCopies ; j++ ) {
                    this.copyS3Object( data.bucket , data.key , () => { 
                        copies += 1;
                        this.ready = ( copies == total );
                    } );
                }
            }

        }

        // THIS "LOADING" IS ASYNC... HOW DO WE KNOW WHEN IT IS DONE? 
        // a "buffered" method we can check by returning generic data
        // about the sampler? 

    }

    info() {
        let data = super.info();
        data.ready = this.ready;
        return data;
    }

    // reset? 

    // clear? 


    // define an instance-specific decoder given a format and field
    decodeS3URL( obj ) {
        if( this.urlField ) {
            return decodeS3URL[this.urlFormat](obj[this.urlField]);
        }
        return decodeS3URL[this.urlFormat](obj);
    } 

    // create a public URL from a key
    formatPublicS3URL( key ) {
        return "https://" + this.publicBucket 
                    + ".s3.amazonaws.com/"
                    + ( this.publicPrefix ? this.publicPrefix + "/" : "" ) 
                    + key;
    }

    // a delete S3 object wrapper
    expirePublicS3Object( key ) {
        this.logger( `deleting object ${key}...` )
        this.s3.deleteObject( { 
            Bucket : this.publicBucket , 
            Key    : ( this.publicPrefix ? this.publicPrefix + "/" : "" ) + key
        } ).promise()
            .catch( err => {
                console.log( err , err.stack ); 
            } );
    }

    // a copy S3 object wrapper
    copyS3Object( bucket , key , onDone ) {

        // get a random identifier
        let pubkey = getRandomKey();

        // this.logger( `copying ${bucket}/${key} -> ${pubkey}` )
        
        // define parameters for copy
        var params = {
            CopySource : `/${bucket}/${key}` , 
            Bucket     : this.publicBucket , 
            Key        : ( this.publicPrefix ? this.publicPrefix + "/" : "" ) + pubkey , 
        };

        // copy operation
        this.s3.copyObject( params ).promise()
            .then( data => {

                // create a new S3 object reference
                let s3obj = bucket + '/' + key;

                // add the public key to the temps array for this object
                if( s3obj in this.temps ) {
                    this.temps[ s3obj ].push( pubkey );
                } else {
                    this.temps[ s3obj ] = [ pubkey ];
                }

                if( onDone ) { onDone(); }

                // this.logger( `completed copy ${bucket}/${key} -> ${pubkey}` );

            } ).catch( err => {
                console.log( err , err.stack );
            } );

    }

    // sample for this rid/qid ... the idea is to maintain ephemeral (expiring), public 
    // copies of the underlying data and send back URLs to copies instead of "originals"
    // that we keep private
    sample( rid , qid ) {

        // get a "normal" random sample
        let row = super.sample( rid , qid );

        // decode the URL data into S3 parts, based on formatter
        // urlField defined and used only for "field" type formats
        let data = this.decodeS3URL( row );

        // if we couldn't identify the S3 URL data, just return
        if( ! data ) { return row; } // good luck...

        // "data.bucket" should match "privateBucket" if that has been stored... 

        // look for this object in the temporary object store, using full s3obj style key
        let s3obj = data.bucket + '/' + data.key;
        if( ! ( s3obj in this.temps ) ) { // the object is not listed in temps collection...

            console.log( `no temp for ${s3obj}` );

            // DO WE INITIALIZE HERE? Initializing is async, which is ok 
            // if we return promises. 
            return row; 

        } 

        let tempKeys = this.temps[ s3obj ];
        if( tempKeys.length < this.minCopies ) { // are there too few copies? 

            // create a copy first... create two copies? create enough to 
            // fill up the "buffer". these copies are async, we can't use 
            // them right away. we won't store them right away though. 
            for( var i = 0 ; i < this.minCopies - tempKeys.length ; i++ ) {
                this.copyS3Object( data.bucket , data.s3key );
            }

        }

        // overwrite the "private" URL with a "public" one for return, and
        // remove the object used from the list of objects usable
        let pubkey = tempKeys.pop();
        if( this.urlField ) {
            row[this.urlField] = this.formatPublicS3URL( pubkey );
        } else {
            row = this.formatPublicS3URL( pubkey );
        }

        // store IP address that requested the particular temporary URL?
        // requires that the sampler passes the request object along with
        // any sample request (which isn't awful)



        // set the expiration time for this replacement object, because it has now been 
        // requested (we "register" with the expirer only after returning)
        this.expirer.add( pubkey ); // using default lifetime

        // _initiate_ creation of a replacement copy...  copy routines stores the 
        // key created in the temporary objects data structure
        this.copyS3Object( data.bucket , data.key );

        // __NOW__ we can return the url or row
        return row;

    }

};

// export, no 
module.exports = {
    class : SecuredS3RandomSampler , 
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