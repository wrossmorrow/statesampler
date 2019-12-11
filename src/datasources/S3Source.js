
const AWS = require( 'aws-sdk' );

const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

const returnURLExe = {
	's3url' : ( s ) => ( `https://${s.bucket}.s3.amazonaws.com/${s.key}` ) , 
	's3obj' : ( s ) => ( s.bucket + '/' + s.key ) , 
	'parts' : ( s ) => ( s ) , 
}

class S3Source extends DataSourceBase.RowDataSourceBase {

    constructor( options ) {

        super( options );

        // no required options? THERE ARE: AWS credentials...
        if( ! options ) { 
            this.throwNewError( 400 , `S3Source requires some "options".` );
        }

        // have to have AWS credentials
        if( ! ( "aws" in options ) && ! options.aws ) {
            this.throwNewError( 400 , `S3Source requires AWS credentials.` );
        } 
        if( ! ( "accessKey" in options.aws ) && ! options.aws.accessKey ) {
            this.throwNewError( 400 , `S3Source requires an AWS access key id.` );
        }
        if( ! ( "secretKey" in options.aws ) && ! options.aws.secretKey ) {
            this.throwNewError( 400 , `S3Source requires an AWS secret access key.` );
        }

        // have to have bucket, at least (prefix actually "optional")
        if( ! ( "bucket" in options.aws ) && ! options.aws.bucket ) {
            this.throwNewError( 400 , `S3Source requires an S3 bucket.` );
        }

        // 
        this.bucket = options.aws.bucket;
        this.s3key  = options.aws.key;
        this.prefix = options.aws.prefix;

        // do we return "objects" or URLs?
        if( "returnURLs" in options && options.returnURLs ) { 
        	if( ! /s3url|s3obj|parts/.test(options.returnURLs) ) {
        		this.throwNewError( 400 , `Invalid returnURLs setting.` );
        	}
        	this.returnURLs = options.returnURLs; 
        } else { 
        	this.returnURLs = false; 
        }

        // create S3 client with passed credentials (which we MUST pass)
        // (but what if the bucket is totally public?)
        this.s3 = new AWS.S3( {
            apiVersion      : '2006-03-01' , 
            accessKeyId     : options.aws.accessKey , 
            secretAccessKey : options.aws.secretKey , 
        } );

    }

    load() {

        return new Promise( ( resolve , reject ) => {

	        // if a key is provided, load the associated file as the data. 
	        // we should use the file extension as a sign to the type (csv, json)
	        // 
	        // otherwise, list the bucket/prefix and use the urls as the rows; we'll 
	        // "get" objects for the rows, if settings suggest such. o/w urls. 
	        if( this.s3key ) {

				var params = { Bucket : this.bucket , Key : this.s3key };
				this.s3.getObject( params ).promise()
					.then( data => {

						console.log( data ); // successful response

						// data.body is a Buffer object... interpret how?
						// 
						//		let ext = /.*\.([^\.+])$/.exec( options.aws.key )[1]
						// 
						// ext = undefined? csv? json?
						resolve();

					} ).catch( reject );


	        } else {

				var params = {
					Bucket : this.bucket , 
					Prefix : ( this.prefix ? this.prefix + "/" : "" ) ,
				};

				this.rows = [];
				this.s3.listObjects( params ).promise()
					.then( data => {

						let newRows = data.Contents
										.map( i => i.Key )
										.filter( i => ( i !== data.Prefix ) )
										.map( i => ( { bucket : this.bucket , key : i } ) );

						this.rows = this.rows.concat( newRows );

						// if( data.IsTruncated ) -> call again... starting where? end of previous?

						resolve();

					} ).catch( reject );

	        }

    	} );

    }

    // the "get" method
    get( R ) {
    	if( this.returnURLs ) { 
    		return returnURLExe[this.returnURLs]( this.rows[R] ); 
    	} else { // load and return data _at_ the URL... requires access of course

    	}
    }

    // do we implement "pop"? 

}

module.exports = {
	class : S3Source , 
	nicknames : [ 's3' , 'S3' ] , 
}