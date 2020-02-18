
const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

class QueueSource extends DataSourceBase.DLLDataSourceBase {

    constructor( source , options ) {

        super( options );

    }

    // anything to "load"? 
    // load()... 

}

module.exports = {
	class : QueueSource , 
	nicknames : [ 'q' , 'Q' , 'queue' , 'Queue' ] , 
}