/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const { google } = require( 'googleapis' );

const DataSourceBase = require( __dirname + "/DataSourceBase.js" );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function extendedLexLessThan( s1 , s2 ) {
    if( s1.length < s2.length ) { return true; }
    if( s1.length > s2.length ) { return false; }
    return s1 < s2;
}

function listRange( start , finish ) {
    var istart = 0 , ifinish = 0;
    var nstart = getNameFromNumber( istart );
    while( extendedLexLessThan( nstart , start ) ) { 
        istart += 1; 
        nstart = getNameFromNumber( istart ); 
    }
    ifinish = istart; 
    nfinish = getNameFromNumber( ifinish );
    while( extendedLexLessThan( nfinish , finish ) ) { 
        ifinish += 1; 
        nfinish = getNameFromNumber( ifinish ); 
    }
    return [istart,ifinish];
}

function getNameFromNumber( n ) {
    var nmod = n % 26;
    var chr = String.fromCharCode( 65 + nmod );
    var nfr = Math.floor( n / 26.0 );
    return ( nfr > 0 ? getNameFromNumber( nfr - 1 ) + chr : chr );
}


const parseGSheetSpec = ( spec ) => {

    var result = {
        id : "" , 
        name : "" , 
        cols : [] , 
        rows : [] , 
    }
    
    if( ! ( "id" in spec ) && ! spec.id ) {
        throw new Error( `Sourcing from gsheets requires a sheet identifier` );
    }

    if( "range" in spec ) {

        var match = /(.*)!([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/.exec( spec.range );
        if( match ) {
            if( ! ( "name" in spec ) && ! spec ) {
                result.name = match[1]; 
            }
            result.cols = [ match[2] , match[4] ];
            result.rows = [ parseInt( match[3] ) , parseInt( match[5] ) ];
        } else {
            match = /([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/.exec( spec.range );
            if( ! match ) {
                throw new Error( `If a range is specified, it must be Excel-like.` );
            }
            result.cols = [ match[1] , match[3] ];
            result.rows = [ parseInt( match[2] ) , parseInt( match[4] ) ];
        }

    } else { // if range isn't passed, must have from/to

        if( ! ( "from" in spec ) || ! ( "to" in spec ) ) {
            throw new Error( `Both "from" and "to" are required if a range is not specified.` );
        }

        // parse from/to either as strings or as objects with row/col fields


    }

    return result;

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

/* input: 
 * 
 *  apikey : 
 *  sheet : { id : , name : , ( range | from/to ) :  }
 * 
 * 
 */

class GSheetSource extends DataSourceBase {

    constructor( options ) {

        super( options );

        if( ! options ) {
            this.throwNewError( 400 , `Some "options" for gsheets are required.` );
        }

        if( ! ( "apikey" in options ) && ! options.apikey ) {
            this.throwNewError( 400 , `Sourcing from gsheets requires an apikey.` );
        }

        if( ! ( "sheet" in options ) && ! options.sheet ) {
            this.throwNewError( 400 , `Sourcing from gsheets requires a sheet identifier.` );
        } 

        let sheet;

        // parse will throw an error if not well-formed
        try {
            sheet = parseGSheetSpec( options.sheet ); // id, name, cols, and rows
        } catch( err ) {
            this.throwNewError( 400 , err.message );
        }

        this.colRange = sheet.cols;
        this.rowRange = sheet.rows;

        // header could be a relative row index, a CSV list, or a sheet specification
        if( "header" in options.sheet ) {
            let header = parseGSheetSpec( options.sheet.header ); // id, name, cols, and rows
        }

        // define a default name
        if( ! ( "name" in options.sheet ) && ! options.sheet.name ) {
            options.sheet.name = "Sheet1";
        }

        // sheets API
        this.gsheets   = google.sheets( { version : 'v4' , auth : options.apikey } );

        // convenience
        this.sheetId   = options.sheet.id;
        this.sheetName = options.sheet.name;

        // header (labels)
        this.header    = [];

    }

    loadHeader( spec ) {

        return new Promise( ( resolve , reject ) => {

            if( ! this.gsheets ) { 
                return reject( "ValueError: No Google Sheets object initialized." );
            }

            var request = { 
                spreadsheetId : spec.spreadsheetId , 
                range : `${spec.sheet}!${spec.sheet.from}${spec.sheet.row}:${spec.sheet.to}${spec.sheet.row}` , 
            };

            this.gsheets.spreadsheets.values.get( request , ( err , res ) => {
                if( err ) { return reject( err ); }
                resolve();
                this.header = Object.assign( [] , res.data.values[0] );
            } );

        } );

    }

    load() {

        // create actual spec for google sheet API
        let range = `${this.colRange[0]}${this.rowRange[0]}:${this.colRange[1]}${this.rowRange[1]}`;

        let spec = {
            spreadsheetId : this.sheetId , 
            range : `${this.sheetName}!${range}` , 
        };

        return new Promise( ( resolve , reject ) => {

            if( ! this.gsheets ) { 
                return reject( "ValueError: No Google Sheets object initialized." );
            }

            this.gsheets.spreadsheets.values.get( spec , ( err , res ) => {
                
                // respond to caller based on status
                if( err ) { return reject( err ); }

                // actually load rows and set counts vector 
                this.rows = Object.assign( [] , res.data.values );
                // this.rows = JSON.parse( JSON.stringify (response.data.values ) ); // (deep copy hack)

                var iColRange = listRange( this.colRange[0] , this.colRange[1] );
                this.header = [];
                for( var i = iColRange[0] ; i <= iColRange[1] ; i++ ) {
                    this.header.push( getNameFromNumber( i ) );
                }

                // respond if we should
                resolve();

            });

        } );

    }

    getRow( R ) {
        var response = { Row : R + this.rowRange[0] };
        this.header.forEach( (k,i) => { response[k] = this.rows[R][i]; } );
        return response;
    }

};


module.exports = {
    class : GSheetSource , 
    nicknames : [ 'gsheet' , 'GSHEET' ] , 
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