
const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

class CSVSource extends DataSourceBase {

    constructor( options ) {
        super( options );

    }

    getRow( R ) {
    	
    }

}

module.exports = {
	class : CSVSource , 
	nicknames : [ 'csv' , 'CSV' ] , 
}