
const _axios = require( 'axios' );

const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

class JSONSource extends DataSourceBase.RowDataSourceBase {

    constructor( source , options ) {

        super( options );

        // parse source field. either an address or actual data? 
        this.source = undefined;
        if( source === source.toString() ) {
        	if( /^http[s]{0,1}:\/{2}/.test( source ) ) {
        		this.source = source;
        	} else {
        		try {
        			let temp = JSON.parse( source );
		        	if( Array.isArray( source ) ) {
		        		this.rows = Object.assign( [] , temp );
		        	}
        		} catch( err ) {

        		}
        	}
        } else { // source is data? rows or records?
        	if( Array.isArray( source ) ) {
        		this.rows = Object.assign( [] , source );
        	}
        }

    }

    load( ) {
    	return new Promise( ( resolve , reject ) => {
	    	if( this.source ) {
	    		_axios.get( this.source )
	    			.then( response => { this.rows = response.data; resolve(); } )
	    			.catch( reject )
	    	} else { resolve(); }
    	} )
    }

}

module.exports = {
	class : JSONSource , 
	nicknames : [ 'json' , 'JSON' ] , 
}