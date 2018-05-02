# statesampler

A simple `node.js` server to sample from a rows of data in a Google Sheet to provide data for Qualtrics questions. There are four sampling methods: 

* standard-uniformly, 
* "balanced-uniformly" relative to some max,
* exponentially-weighted samples away from large counts, 
* and reciprocally-weighted samples away from large counts

The first is trivial to implement within standard `javascript`, although this is plausibly more efficient because the server pre-loads all reviews. This server was _really_ written to enable question generation when the _count_ of times a row was sampled is important. If so, we have to maintain a "global state" across questions served requiring a central server. 

## Use

This server is setup to allow you to make (hopefully simple) API calls. Before you launch an experiment, you need to

1. Initialize a Google Sheets API object with an API key you get from enabling the sheets API in your google account
2. Load a particular sheet by specifying a `spreadsheetId` and `range` 
3. Optionally load a header, from the same spreadsheet or a different one, used to encode responses
3. Specify a sampling method, the default being the "balanced-uniform" strategy

During an experiment, you can

1. Sample reviews one-by-one, returning data that can be used to construct questions in Qualtrics (_during_ experiment)
2. Report client-side errors during question loads back to the experimenter (_during_ experiment)

### curl Examples

You can use [`curl`](https://curl.haxx.se/) from the command line to play around: 

1. Initialize a Google Sheets API object with an API key: 

```
$ curl https://my.server.com/statesampler/api/sheets/init -XPOST -H "Content-type: application/json" -d '{ "apikey" : "..." }'
```

2. Load a particular sheet by specifying a `spreadsheetId` and `range`: 

```
$ curl https://my.server.com/statesampler/api/sheet/load -XPOST -H "Content-type: application/json" -d '{ "spreadsheetId" : "...-7KRloOBe3-4qUQ" , "range" : "..." }'
```

3. Specify a sampling method, e.g. _uniform_ sampling: 

```
$ curl https://my.server.com/statesampler/api/strategy/u -XPOST
```

4. Sample reviews one-by-one, returning data that can be used to construct questions in Qualtrics: 

```
$ curl https://my.server.com/statesampler/api/sample
```

### Qualtrics/javscript Fetch Example

I would only use `javascript` to get sampled reviews within Qualtrics questions. That is, I wouldn't use it to setup the data for the experiment, although you could within `node.js`. 

For that use case, a sample call might look like 

```
Qualtrics.SurveyEngine.addOnload( function()
{
	// question index. change this in different questions, so we don't have to make multiple changes below. 
	// (it would be nice if this was more automated...)
	var questionIndex = 1;

	// get place to store custom HTML for rows sampled...
	var container = this.getQuestionTextContainer();

	// call sampler API's main routine
	fetch( "https://my.server.com/statesampler/api/sample" )
		.then( data => {
			// process data recieved as JSON data
			data.json().then( json => {

					// Replace question's text container with a custom format of the response 
					container.innerHTML = ...

					// store the Row number as embedded data so we have it later for response analysis
					Qualtrics.SurveyEngine.setEmbeddedData( 'R' + questionIndex , json.Row );

				} )
			} , error => {

				// Dump error, if we can, to the server. Otherwise we have no window into client-side errors. 
				var postOpt = { method : 'post', body : JSON.stringify( error ) };
				fetch( "https://my.server.com/statesampler/api/error" , postOpt );

			} );
} );
```
This example is provided in `qualtrics.js`. 

## Setup

### node Server

You need `node.js` and `npm` to install this server. 

With `node.js` and `npm` you can install this package by running
```
npm install
```
in the repo directory. I run with
```
$ ./statesampler.start
... do other stuff, until we need to stop with:
$ ./statesampler.stop
```

Or, in production, use [`systemd`](https://www.freedesktop.org/wiki/Software/systemd/). Make sure `statesampler.service` is correct for your deployment, copy into place with
```
$ sudo cp statesampler.service /etc/systemd/system
```
and reload/launch/enable: 
```
$ sudo systemd daemon-reload
$ sudo systemd enable statesampler.service
$ sudo systemd start statesampler.service
$ sudo systemd status statesampler.service
```
Hopefully you don't hit errors. 

### HTTPS and SSL Certificates

Qualtrics uses `HTTPS` and thus so must you to not generate mixed-content requests, which most browsers won't allow without client-side customization. I used [Let'sEncrypt](https://letsencrypt.org/)'s free [`certbot`](https://certbot.eff.org/) tool to generate SSL certs that can be used for `HTTPS`. It is fairly easy to just follow the instructions. 

### Apache

To run with `apache`, modify the `vhost.conf` and `vhost_ssl.conf` files by entering your DNS name in place of `my.server.com` as well as the webmaster email address (if desired). These need to be placed in `/etc/apache/sites-available` and enabled with 

```
$ sudo a2ensite vhost vhost_ssl
```
Or you can just replace the content in the default sites enabled for `HTTP` and `HTTPS`. 

You also need to make sure the right modules are enabled with, e.g., 
```
$ sudo a2enmod ssl proxy proxy_http
```
restart `apache`
```
$ sudo systemctl restart apache2.service
```
and check for errors
```
$ sudo systemctl status apache2.service
```

## Contact

morrowwr@gmail.com

wrossmorrow.com

web.stanford.edu/~morrowwr

www.linkedin.com/in/wrossmorrow
