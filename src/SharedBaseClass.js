/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * IMPORTS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const _crypto = require( 'crypto' );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * EXPORTS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

module.exports = class SharedBaseClass {

    constructor( options ) {
        this.created = ( new Date( Date.now() ) ).toISOString();
        this.name = "";
        this.desc = "";
    	if( options ) {
            // name and options fields
	        if( "name" in options ) { this.name = options.name ? options.name : "" ; }
	        if( "desc" in options ) { this.desc = options.desc ? options.desc : "" ; }
            // create key and secret; idea is that secret is provided once and only once
            this.key = ( "key" in options && options.key ? options.key : this.getHash() );
            this.secret = ( "secret" in options && options.secret ? options.secret : this.getSecret() );
        } else {
            this.key = this.getHash();
            this.secret = this.getSecret();
        }
    }

    setName( name ) { this.name = name; }
    setDesc( desc ) { this.desc = desc; }

    // an error wrapper, to make throwing errors (in constructors, particularly) a bit easier
    throwNewError( code , message ) {
        let err = new Error( message );
        err.code = code;
        throw err;
    }

    // uniform time
    getTime() { return ( new Date( Date.now() ).toISOString() ); }
    
    // a basic logger
    logger( s ) { console.log( ( new Date( Date.now() ).toISOString() ) + " | " + s ); }
    
    // get a random hash
    getHash() {
        var current_date = ( new Date() ).valueOf().toString();
        var random = Math.random().toString();
        return String( _crypto.createHash( 'sha1' ).update( current_date + random ).digest('hex') );
    }

    // get a "secret" hex code
    getSecret() {
        return _crypto.randomBytes( 48 ).toString('hex');
    }

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