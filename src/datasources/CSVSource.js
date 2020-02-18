
const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

class CSVSource extends DataSourceBase.RowDataSourceBase {

	// 
	// FIGURE OUT SPECIFICATION OF HEADERS
	// 

    constructor( source , options ) {

        super( options );

        // parse source field. either an address or actual data? 
        this.source = undefined;
        if( source === source.toString() ) { // is the source variable passed a string? 
        	if( /^http[s]{0,1}:\/{2}/.test( source ) ) {
        		this.source = source;
        	} else {
        		this.rows = source.split( /([\r]{0,1}\n|\n[\r]{0,1}/ ).map( l => l.split(',') );
        	}
        } else { // source is data? rows or records?
        	if( Array.isArray( source ) ) {
        		// headers in row 1? 
        		this.rows = source.map( l => l.split(',') );
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
	class : CSVSource , 
	nicknames : [ 'csv' , 'CSV' ] , 
}