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

const axios = require( 'axios' );

const _crypto = require( 'crypto' );

const EphemeralSet = require( 'ephemeral-set' );

const RandomSampler = require( __dirname + "/RandomSampler.js" ).class; // NOTE THE EXTRA STEP

const getRandomKey = () => ( _crypto.randomBytes(24).toString('hex') );

const s3URLFormat = /https:\/{2}(([^\.]+)\.){0,1}s3(-([^\.]+)){0,1}\.amazonaws\.com\/(.*)/;

// a function to "decode" S3 urls by "type", presuming we get a spec of the "parts"
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

        // set "deleteAfter" option (lifetime) for objects
        if( "deleteAfter" in options && options.deleteAfter ) {
            let secs = iso8601Secs( options.deleteAfter );
            if( secs ) { options.deleteAfter = secs; }
            else { options.deleteAfter = 60; } 
        } else { options.deleteAfter = 60; }

        // set "checkEvery" option (check loop delay) for objects
        if( "checkEvery" in options && options.checkEvery ) {
            let secs = iso8601Secs( options.checkEvery );
            if( secs ) { options.checkEvery = secs; }
            else { options.checkEvery = 10; } 
        } else { options.checkEvery = 10; }

        // maintain a data structure (linked list?) ** that makes deletion efficient **
        // delete after 10 seconds and check every second
        this.expirer = new EphemeralSet( 
                            k => { this.expirePublicS3Object(k); } , 
                            options.deleteAfter , 
                            options.checkEvery );
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
        let OptionalS3LifecycleDays = parseInt( options.aws.public.lifecycleDays );
        var params = {
            Bucket : this.publicBucket , 
            LifecycleConfiguration : {
                Rules : [ {
                    Expiration : { Days : OptionalS3LifecycleDays ? OptionalS3LifecycleDays : 1 } , 
                    Filter     : { Prefix : this.publicPrefix + '/' } , 
                    ID         : "TestOnly" , 
                    Status     : "Enabled" , 
                } ]
            }
        };

        this.s3.getBucketLifecycleConfiguration( { Bucket : this.publicBucket } ).promise()
            .then( data => {
                let updateLifecycleConfiguration = true;
                data.Rules.forEach( r => {
                    if( "Expiration" in r ) {
                        if( "Days" in r.Expiration ) {
                            if( parseInt( r.Expiration.Days ) <= params.LifecycleConfiguration.Rules[0].Expiration.Days ) {
                                updateLifecycleConfiguration = false;
                            }
                        }
                    }
                } );
                if( updateLifecycleConfiguration ) {
                    this.s3.putBucketLifecycleConfiguration( params ).promise();
                }
            } ).catch( err => {
                console.log( err , err.stack ); 
            } );
        /*
        
        */

        // initialize the buffers of copies, so we aren't waiting for copies to be made
        // requires bucket to exist (and be write-accessible under the credentials)
        // 
        // NOTE: async and, depending on the objects, could be time consuming
        // 
        // BECAUSE "LOADING" IS ASYNC... HOW DOES EXTERNAL CODE KNOW WHEN IT IS DONE? 
        // a "buffered" method we can check by returning generic data
        // about the sampler? 
        // 
        // We could also allow "optional" "onLoaded" and "onLoadError" methods to be passed, 
        // which we could call in the promise resolution above if passed. However, a 
        // long-running HTTP request may not be what callers want. 
        // 
        this.temps = {};
        this.ready = false;
        let todos = []; // we'll fill up an array of promises to act on collectively
        for( var i = 0 ; i < this.counts.length ; i++ ) {

            // get the i'th dataset row
            let row = this.dataset.get( i );

            // row has a "url" field? or we set that in constructor as a header? 
            let data = this.decodeS3URL( this.urlField ? row[this.urlField] : row );

            // process further only if the URL is a decodable S3 URL
            if( data ) {  // make minCopies copies of each item
                this.temps[ data.bucket + '/' + data.key ] = []; // initialize
                todos.push( this.rebuffer( data.bucket , data.key ) ); // rebuffer
            }

        }

        // act on resolved complete set of rebuffering promises
        Promise.all( todos )
            .then( () => { this.ready = true; } )
            .catch( err => {
                // a "rebuffer" promise will reject if any of the underlying copies
                // rejects... then this collective will reject if any of the underlying
                // copies rejects. Is that what we want? 
            } )
            .finally( () => {
                // do we do anything here, like attempt to rebuffer _again_ if there 
                // are any errors. 
            } );

    }

    // get general info about the sampler
    info(  ) {
        let data = super.info();
        data.ready = this.ready;
        return data;
    }

    // define reset? clear? Only if we need to "flush" the temporary copies object or 
    // public bucket or something. This object isn't formally storing any data relevant
    // to the sampling process, that happens in a sub-class. (So "this object" does it, 
    // just with code defined elsewhere.)
    
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
    copyS3Object( bucket , key , noadd ) {

        return new Promise( ( resolve , reject ) => {

            // get a random identifier
            let pubkey = getRandomKey();
            
            // define parameters for copy
            var params = {
                CopySource : `/${bucket}/${key}` , 
                Bucket     : this.publicBucket , 
                Key        : ( this.publicPrefix ? this.publicPrefix + "/" : "" ) + pubkey , 
            };

            // copy operation
            this.s3.copyObject( params ).promise()
                .then( data => {

                    if( noadd ) { resolve( pubkey ); }
                    else {

                        // create a new S3 object reference
                        let s3obj = bucket + '/' + key;

                        // add the public key to the temps array for this object
                        if( s3obj in this.temps ) {
                            this.temps[ s3obj ].push( pubkey );
                        } else {
                            this.temps[ s3obj ] = [ pubkey ];
                        }

                        // resolve the promise we're returning
                        resolve( pubkey );

                    }

                } ).catch( reject );

        } );

    }

    // "rebuffer" the store of temporary public objects, which means 
    // copy the actual objects until there are minCopies (registered)
    // copies for the bucket and key associated with the private object
    rebuffer( bucket , key ) {
        let tempKeys = this.temps[ bucket + '/' + key ];
        if( tempKeys.length < this.minCopies ) { 
            let ps = [ this.copyS3Object( bucket , key ) ];
            // NOTE: can't use "while" here because operations are async. 
            for( var i = 1 ; i < this.minCopies - tempKeys.length ; i++ ) {
                ps.push( this.copyS3Object( bucket , key ) );
            }
            return Promise.all( ps );
        }
    }

    // get a NEW public resource URL
    newPublicURL( bucket , key ) {
        return new Promise( ( resolve , reject ) => {
            this.copyS3Object( bucket , key , true )
                .then( pubkey => { resolve( this.formatPublicS3URL( pubkey ) ); } )
                .catch( reject );
        } );
    }

    // get the next temporary, public URL for a particular bucket and key
    nextPublicURL( bucket , key ) {

        // look for this object in the temporary object store, using full s3obj style key
        let s3obj = bucket + '/' + key;

        // is the object even listed in temps collection? 
        if( ! ( s3obj in this.temps ) ) {
            return this.newPublicURL( bucket , key );
        }

        // so there are temp keys for this object... 
        let tempKeys = this.temps[ s3obj ];

        // are there any temp copies registered? 
        if( tempKeys.length == 0 ) {
            return this.newPublicURL( bucket , key );
        } 

        // try to get a temp URL and...
        let puburl = this.formatPublicS3URL( tempKeys.pop() );
        return new Promise( ( resolve , reject ) => { 

            // check that this URL actually exists before returning

            // If there is a lifecycle policy on the S3 bucket things can disappear. 
            // And if we aren't checking that copies succeed, we might not have copies. 
            axios.head( puburl )
                .then( () => { resolve( puburl ) } )
                .catch( err => {
                    if( err.response ) {
                        if( err.response.status == 403 || err.response.status == 404 ) {
                            // here we "recurse"... if there isn't the object we thought we
                            // could ask for, we "call" this method again but really 
                            // just get another promise and _forward_ resolve/reject to that
                            // (Is this some form of "Promise Chaining" we can write more 
                            // simply?)
                            this.nextPublicURL( bucket , key ).then( resolve ).catch( reject );
                        } else { reject( err ); }
                    }
                } );

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
        let data = this.decodeS3URL( this.urlField ? row[this.urlField] : row );

        // if we couldn't identify the S3 URL data, just return
        if( ! data ) { return row; } // good luck...

        // "data.bucket" should match "privateBucket" if that has been stored... 

        // return a Promise not a sample itself... this promise resolves by finding
        // (or creating) a "next" public URL to pass back for the sampled object
        return new Promise( ( resolve , reject ) => {

            this.nextPublicURL( data.bucket , data.key )
                .then( puburl => {

                    // now we can "return" the data
                    if( this.urlField ) { 
                        row[this.urlField] = puburl; 
                    } else {
                        row = { url : puburl , iid : data.key };
                    }
                    resolve( row );

                    // actions after resolution should be ok in an async setting... 

                    // store IP address that requested the particular temporary URL?
                    // requires that the sampler passes the request object along with
                    // any sample request (which isn't awful)



                    // set the expiration time for this replacement object, because it has now been 
                    // requested (we "register" with the expirer only after returning)
                    this.expirer.add( /\/([^\/]+)$/.exec(puburl)[1] );

                    // attempt to fill queue back up after a sample, but forget about 
                    // whether this succeeds or fails _here_
                    this.rebuffer( data.bucket , data.key );

                } ).catch( reject )

        } );

    }

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

// export, no aliasing 
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