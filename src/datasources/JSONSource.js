
const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

class JSONSource extends DataSourceBase.RowDataSourceBase {

    constructor( options ) {
        super( options );

    }

}

module.exports = {
	class : JSONSource , 
	nicknames : [ 'json' , 'JSON' ] , 
}