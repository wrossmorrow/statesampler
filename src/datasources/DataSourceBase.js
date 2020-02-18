/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * IMPORTS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const SharedBaseClass = require( __dirname + "/../SharedBaseClass.js" );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * EXPORTS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

class DataSourceBase extends SharedBaseClass {

	constructor( source , options ) {

		super( options );

        // create key and secret; idea is that secret is provided once and only once
        if( options ) {
            this.key = ( "key" in options && options.key ? options.key : this.getHash() );
            this.secret = ( "secret" in options && options.secret ? options.secret : this.getSecret() );
        } else {
            this.key = this.getHash();
            this.secret = this.getSecret();
        }

        this.rows = [];
        this.recs = {};
        this.type = "none";

        // a list of samplers attached to this dataset/source
        this.samplers = {};

	}

    // 
    info() {
        return {
            name    : this.name , 
            key     : this.key , 
            type    : this.type , 
            created : this.created , 
            description : this.desc , 
            samplers : Object.keys( this.samplers ) , 
        };
    }

    // TRACKING WITH ATTACHED SAMPLERS

    // TEMPLATE-ISH FUNCTIONS

    // overload to "update" data... whatever that means
    update( ) { }

    // overload if there is any actual "loading" action to do
    load( ) { return new Promise( (s,f) => { s(); } ); }

    // get size
    size( ) { return Math.max( this.rows.length , Object.keys( this.recs ).length ); }

    // get a record('s data)
    get( k ) { return null; }

    // get a record('s data) and remove it
    pop( k ) { return null; }

    // a simple draw function
    draw( accept ) { return null; }
	
}

// a row-based store
class RowDataSourceBase extends DataSourceBase {

    // 
    constructor( options ) {
        super( options );
        this.rows = [];
        this.type = "rows";
    }

    // get size
    size( ) { return this.rows.length; }

    // basic row return function, in row-based data sources?
    get( r ) { return this.rows[r]; }

    // should we really implement "pop" for row-based data sources? 
    pop( r ) { return this.get(r); }

    // a simple draw function, returning first acceptable key found
    draw( accept ) {
        this.rows.forEach( (r,i) => {
            if( accept( this.rows[i] ) ) { return i; }
        } );
    }

}

// a key-value store
class KeyDataSourceBase extends DataSourceBase {

    // 
    constructor( options ) {
        super( options );
        this.recs = {};
        this.type = "records";
    }

    // get size
    size( ) { return Object.keys( this.recs ).length; }

    // basic row return function, in row-based data sources
    get( k ) { 
        if( k in this.recs ) { return this.recs[k]; }
        return null;
    }

    // pop is easy here
    pop( k ) {
        if( k in this.recs ) { 
            let d = this.recs[k];
            delete this.recs[k];
            return d;
        }
        return null;
    }

    // a simple draw function, returning first acceptable key found
    draw( accept ) {
        Object.keys( this.recs ).forEach( k => {
            if( accept( this.recs[k] ) ) { return k; }
        } );
    }

}

// a singly linked list data source, based on key-value store
class SLLDataSourceBase extends KeyDataSourceBase {

    constructor( options ) {

        super( options );

        // start "empty"
        this.first = null;
        this.last  = null;

    }

}

// a doubly linked list data source, based on key-value store
class DLLDataSourceBase extends KeyDataSourceBase {

    constructor( options ) {

        super( options );

        // start "empty"
        this.first = null;
        this.last  = null;

    }

    // expect "rows" to be an array of data... but what if an object? ignore that? 
    update( data ) {
        if( /a(ppend){0,1}/i.test( data.type ) ) { this.append( data.rows ); }
        else if( /p(repend){0,1}/i.test( data.type ) ) { this.prepend( data.rows ); }
        else if( /i(nsert){0,1}/i.test( data.type ) ) { this.insert( data.rows ); }
        else {

        }
    }

    // prepend data (as opposed to append, or insert)
    prepend( rows ) {

        if( ! Array.isArray( rows ) ) { rows = [ rows ]; }

        let i = rows.length - 1; // start at the end of the passed array for "prepend"

        if( ! this.first ) { // no first? no last either
            let key = this.getHash();
            this.recs[key] = { data : rows[i] };
            this.first = key;
            this.last  = key;
            i += 1;
        }

        for( i ; i >= 0 ; i-- ) {
            let key = this.getHash();
            // check to make sure this isn't a duplicate? idea is should be impossibly unlikely
            this.recs[key] = { next : this.first , data : rows[i] };
            this.recs[this.first].prev = key; // the previous "first" element succeeds key
            this.first = key; // current appending key is the new "first" element
        }

    }

    // append data (as opposed to prepend, or insert)
    append( rows ) {

        if( ! Array.isArray( rows ) ) { rows = [ rows ]; }

        let i = 0; // start at the beginning of the array for "append"

        if( ! this.last ) { // no last? no first either
            let key = this.getHash();
            this.recs[key] = { data : rows[i] };
            this.first = key;
            this.last  = key;
            i += 1;
        }

        for( i ; i < rows.length ; i++ ) {
            let key = this.getHash();
            // check to make sure this isn't a duplicate? idea is should be impossibly unlikely
            this.recs[key] = { prev : this.last , data : rows[i] };
            this.recs[this.last].next = key; // the previous "last" element preceeds key
            this.last = key; // current appending key is the new "last" element
        }

    }

    // insert rows after a certain key
    insert( rows , after ) {

    }

    // sort the linked list, using passed comparator function
    sort( compare ) {

    }

    // "get" element by key is the same as in the superclass
    // get( k ) ... 

    // "pop" element by key, meaning return and remove from the list
    pop( k ) {

        // only if actually a stored record
        if( ! ( k in this.recs ) ) { return null; }

        // store this items next and previous elements
        let n = this.recs[k].next , p = this.recs[k].prev;

        // logic to rearrange the linked list
        if( n ) { // there IS a next item
            if( p ) {
                this.recs[p].next = n; // n now succeeds k's predecessor item
                this.recs[n].prev = p; // p now preceeds k's successor item
            } else { // NO previous item; k is first item
                this.first = n; // next item is now first
                this.recs[n].prev = null; // and thus the next item has no previous item
            }
        } else { // NO next item... k is last item
            if( p ) {
                this.last = p; // there is a predecessor, which now must be last
                this.recs[p].next = null; // and thus has no next item
            } else {
                this.first = null;
                this.last  = null;
            }
        }

        // now that things have been rearranged we can delete the 
        // item and return the data
        let d = this.recs[k].data;
        delete this.recs[k];
        return d;

    }

    // override draw function to take first acceptable draw in the order of the linked list
    draw( accept ) {
        if( ! this.first ) { return null; }
        let f = this.first; 
        while( ! accept( this.recs[f].data ) ) {
            f = this.recs[f].next; if( ! f ) { return null; }
        }
        return f;
    }

    // reverse-order draw function
    ward( accept ) {
        if( ! this.last ) { return null; }
        let f = this.last; 
        while( ! accept( this.recs[f].data ) ) {
            f = this.recs[f].prev; if( ! f ) { return null; }
        }
        return f;

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

module.exports = {
    DataSourceBase    : DataSourceBase , 
    RowDataSourceBase : RowDataSourceBase , 
    KeyDataSourceBase : KeyDataSourceBase , 
    DLLDataSourceBase : DLLDataSourceBase , 
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