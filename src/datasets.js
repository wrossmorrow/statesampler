
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
const _crypto = require( 'crypto' );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// logging style
const logger = ( s ) => { console.log( ( new Date( Date.now() ).toISOString() ) + " | " + s ); }

// uniform time
const getTime = () => ( new Date( Date.now() ).toISOString() );

// get a random hash
const getHash = () => {
    var current_date = ( new Date() ).valueOf().toString();
    var random = Math.random().toString();
    return String( _crypto.createHash('sha1').update( current_date + random ).digest('hex') );
}

function extendedLexLessThan( s1 , s2 ) {
    if( s1.length < s2.length ) { return true; }
    if( s1.length > s2.length ) { return false; }
    return s1 < s2;
}

function listRange( start , finish ) {
    var istart = 0 , ifinish = 0;
    var nstart = getNameFromNumber( istart );
    while( extendedLexLessThan( nstart , start ) ) { istart += 1; nstart = getNameFromNumber( istart ); }
    ifinish = istart; 
    nfinish = getNameFromNumber( ifinish );
    while( extendedLexLessThan( nfinish , finish ) ) { ifinish += 1; nfinish = getNameFromNumber( ifinish ); }
    return [istart,ifinish];
}

function getNameFromNumber( n ) {
    var nmod = n % 26;
    var chr = String.fromCharCode( 65 + nmod );
    var nfr = Math.floor( n / 26.0 );
    return ( nfr > 0 ? getNameFromNumber( nfr - 1 ) + chr : chr );
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

class NameableDescribeable {

    constructor() {
        this.name     = "";
        this.desc     = "";
    }

    setName( name ) { this.name = name; }
    setDesc( desc ) { this.desc = desc; }

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

module.exports = {

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * IMPORTING GOOGLE SHEETS
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    GoogleSheetData : class GoogleSheetData extends NameableDescribeable {

        constructor( apikey ) {
            super();
            this.key      = getHash();
            this.gsheets  = google.sheets( { version : 'v4' , auth : apikey } );
            this.header   = [];
            this.sheetName = null;
            this.rowRange = [1,1];
            this.colRange = ['A','A'];
            this.rows     = [];
        }

        loadSheet( spec , onLoad , onError ) {

            if( ! this.gsheets ) { 
                if( onError ) { onError( "ValueError: No Google Sheets object initialized." ); } 
                return; 
            }

            this.gsheets.spreadsheets.values.get( spec , ( error , response ) => {
                
                // respond to caller based on status
                if( error ) { if( onError ) { onError( error ); } return; }

                // respond if we should
                if( onLoad ) { onLoad(); }

                // actually load rows and set counts vector 
                this.rows = Object.assign( [] , response.data.values );
                // this.rows = JSON.parse( JSON.stringify (response.data.values ) ); // (deep copy hack)

                // initialize header by parsing range spec sent in
                var match = /(.*)!([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/.exec( spec.range );
                this.sheetName   = match[1];
                this.colRange[0] = match[2];
                this.colRange[1] = match[4];
                this.rowRange[0] = parseInt( match[3] );
                this.rowRange[1] = parseInt( match[5] );

                var iColRange = listRange( this.colRange[0] , this.colRange[1] );
                this.header = [];
                for( var i = iColRange[0] ; i <= iColRange[1] ; i++ ) {
                    this.header.push( getNameFromNumber( i ) );
                }

            });

        }

        loadHeader( spec , onLoad , onError ) {

            if( ! this.gsheets ) { 
                if( onError ) { onError( "ValueError: No Google Sheets object initialized." ); } 
                return; 
            }

            var request = { spreadsheetId : spec.spreadsheetId , 
                            range : spec.sheet + "!" 
                                        + sheet.from + "" + sheet.row 
                                        + ":" + sheet.to + "" + sheet.row }

            this.gsheets.spreadsheets.values.get( request , ( err , response ) => {
                if( error ) { if( onError ) { onError( error ); } return; }
                if( onLoad ) { onLoad(); }
                header = Object.assign( [] , response.data.values[0] );
            });

        }

        getRow( R ) {
            var response = { Row : R + this.rowRange[0] }
            this.header.forEach( (k,i) => { response[k] = this.rows[R][i]; } );
            return response;
        }

    } , 

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * 
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    CSVData : class CSVData extends NameableDescribeable {

        constructor( data ) {
            super();
            this.key      = getHash();
            this.header   = [];
            this.sheetName = null;
            this.rowRange = [1,1];
            this.colRange = ['A','A'];
            this.rows     = [];
        }

        getRow( R ) {
            var response = { Row : R + this.rowRange[0] }
            this.header.forEach( (k,i) => { response[k] = this.rows[R][i]; } );
            return response;
        }

    } , 

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * JSON DATA (various formats... [[],[],...], {?:[],?:[],...}, or [{},{},...] )
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    JSONData : class JSONData extends NameableDescribeable {

        constructor( data ) {
            super();
            this.key      = getHash();
            this.header   = [];
            this.sheetName = null;
            this.rowRange = [1,1];
            this.colRange = ['A','A'];
            this.rows     = [];
        }

        getRow( R ) {
            var response = { Row : R + this.rowRange[0] }
            this.header.forEach( (k,i) => { response[k] = this.rows[R][i]; } );
            return response;
        }

    } , 
    
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * 
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */