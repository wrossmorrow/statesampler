
const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

class CSVSource extends DataSourceBase.RowDataSourceBase {

    constructor( options ) {
        super( options );

    }

}

module.exports = {
	class : CSVSource , 
	nicknames : [ 'csv' , 'CSV' ] , 
}