
const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

class JSONSource extends DataSourceBase {

    constructor( options ) {
        super( options );

    }

    getRow( R ) {
    	
    }

}

module.exports = {
	class : JSONSource , 
	nicknames : [ 'json' , 'JSON' ] , 
}