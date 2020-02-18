# statesampler

A simple-ish `node.js` server to sample to provide data for survey questions. The code was constructed to inform custom question scripts in [Qualtrics](https://www.qualtrics.com/) surveys, although this code is itself independent of Qualtrics. 

You can see a live demo [here](https://www.wrossmorrow.org/statesampler/demo.html). 

# Overview

The broad architecture is as follows: There are `datasource`s that link to and import datasets and `sampler`s that sample over datasources. You use these constructs to make API calls that return rows/records from the datasets to clients running a survey according to the rules spelled out in a `sampler`. 

Right now, you can specify data from

* `CSV` or `JSON`
* Google Sheets
* An `S3` Bucket

We're also working on a queue `datasource`, where data may be coming in or out during the sampling process. The code is Object-Oriented and it should be relatively easy to define new `datasource`s. See below. 

You can define a `sampler` over any dataset type. Included `sampler`s are 

* random sampling (although see below), 
* planned of "Design of Experiments" (DoE) sampling, 
* "secured" sampling via `S3`. 

As with `datasource`s, constructing a new `sampler` is probably made easier by Object-Oriented code. See below. 

Ok, *so what's the big deal?* Random sampling is easy! Just load all your data and... sample randomly. 

Here's the catch: `statesampler` isn't meant for _pure_ random sampling, although it includes a `PureRandomSampler` that does that. `statesampler` is _really_ meant for sampling randomly in structured ways that require information from _all_ survey responses. Not the actual question responses per se, but at least which items have been sent out and how many times. This server was _really_ written to enable question generation when the _number_ of times a row was sampled is important. If this is so, we _have_ to maintain a "global state" across rows served, requiring a central server. 

Allright, this "central server" could be your datasource itself, like your Google Sheet, if you can write back to it _from the client code drawing the samples_. We found this hard to do, as Google Sheets require valid user OAuth tokens to write even to public sheets, meaning all your survey respondents would have to log into Google to take your survey. Probably not cool. This is not to mention that _you_ would have to write client code that keeps each client's counts of samples up-to-date as other clients change the count values, which doesn't sound fun or efficient. Other sources of data are likely to have similar authorization and tracking problems. 

`statesampler`s model is different: _You_ (a survey administrator) provide credentials to load your data before your survey is deployed, not survey clients during a survey. That way you aren't distributing credentials or askinng for them during a survey. _They_ (the survey clients) get to sample from the data, just by asking `statesampler` for values. _It_ (`statesampler`) tracks which things were sampled in what surveys for you, so all your survey clients have to do is ask for the data for any given question. Done. 

# Usage/Workflow

Let's say everything is installed and running. What do you need to do? 

## Create a Dataset

First you need to create a dataset. Let's say you want to create one from `JSON` data. Supposing your `statesampler` server's address is in a variable `SERVER`, you can do this wil the call

```
$ curl -s -X POST "${SERVER}/data" -H 'Content-Type: application/json' -d "@data.json" > results
```

*Note* however that `data.json` _isn't just your actual data_. Rather, this might be something like

```
{
	"type" : "json" ,
	"source" : [
		{"A":"1","B":"some","C":"the","D":"over"} , 
		{"A":"2","B":"thing","C":"quick","D":"the"} ,
		{"A":"3","B":"here","C":"brown","D":"pretty"} , 
		{"A":"4","B":"is","C":"fox","D":"lazy"} ,
		{"A":"5","B":"weird","C":"jumped","D":"dog"} 
	]
}
```

That is, you have to tell the `statesampler` what type of data to load too, and can include the `json` data in the `source` field. You can also use a URL as the source field, 

```
{
	"type" : "json" , 
	"source" : "https://wrossmorrow-public-stuff.s3-us-west-2.amazonaws.com/statesampler-example-data.json"
}
```

and `statesampler` will go get the data. 

Suppose your data is in a Google sheet. Then your `json` request body will look like 

```
{
	"type"  : "gsheet" , 
	"options" : {
		"apikey": "yourcomplicatedapikeyfromgdevconsole" , 
		"sheet" : {
			"id"   : "1mkZV-HqNhW3jIprvaO6rMSlMswyqFdGng7qbtqhQj1Y" , 
			"name" : "Sheet1" , 
			"range": "A2:D6"
		}
	}
}
```

or something similar. The `apikey` you have to get from your Google Developer console, the sheet `id` you can read from the URL of the sheet you want to read. 

Any of these calls will return a `result` like 

```
{ key : 6903e195482f384ec3064548dda8eb28e61d9ce0 , secret : e0471... }
```

The `key` you use to further identify the particular dataset in later calls, as a route parameter. The `secret` should be set aside and reserved for calls that change the dataset (like deleting it). This `secret` you provide in a request body as required; we couldn't have you submit the secret in the URL or a URL query parameter for then it wouldn't be secret. 

## Samplers

Once you have a dataset, you can define a sampler on top of it. You can define multiple samplers per dataset; each dataset will maintain a list of the samplers drawing data from it. 

Let's say you stored your dataset's key in a variable `DATA_ID`, say by doing

```
DATA_ID=$( jq .key result | tr -d '"' )
```

Then

```
$ curl -s -X POST "${SERVER}/sampler/${DATA_ID}" -H 'Content-Type: application/json' -d "@data/balancedSampler.json" > results 
```

will create a sampler over this data. Here the request body looks like 

```
{
	"type" : "random" , 
	"options" : {
		"strategy" : "balanced"
	}
}
```

This tells `statesampler` what `type` of sampler to create, and also what options to use. In this case we define what sampling strategy to use. The results returned will be similar: we'll get a `json` object like 

```
{ key : 7c5631dc7536a695ed67162fd9e4f13b66581a88 , secret : 0e7928a... }
```

As before, the `key` is a general identifier and the `secret` is something to hold onto to make important, "administrative" calls to `statesampler`. 

## Getting Data

Now that you've constructed a dataset and a sampler over it, you can get data. Say you've stored your sampler's `key` in `SAMPLER_KEY`. Then 

```
$ curl -s -X GET "${SERVER}/sample/${SAMPLER_KEY}" 
```

would return a sample from the dataset, such as 

```
{"A":"1","B":"some","C":"the","D":"over"} 
```

Running this repeatedly would allow you to see the sampling properties. You can also access the counts, so if you're more interested in that for testing purposes try this: 

```
$ curl -s -X GET "${SERVER}/sample/${SAMPLER_KEY}" > /dev/null && curl -X GET "${SERVER}/counts/${SAMPLER_KEY}" && echo " "
```

If you loop this, you can see the difference between samplers. In the "table" below we list the difference between the most and least sampled records, for our silly 5-record example, every 25 samples over 250 total samples for uniformly drawn records (`u`), balanced-uniformly drawn records (`b`), and records drawn with a distribution exponentially weighted away from high-sample-count records (`e`): 

```
u	b	e
4	2	3
10	4	4
13	5	2
13	4	5
11	4	8
15	9	6
16	6	6
18	6	6
20	5	8
18	5	11
```

You can see that, at least in this case, the `b` and `e` methods are much better at not permitting "oversampling" of any one record relative to another. Indeed that is the purpose of these samplers, and `statesampler` as a whole. 

# Installing, Configuring, and Running statesampler

## Easy Setup

You can run the interactive `bash` script `scripts/serversetup.sh` from a command line to make the calls associated with server setup (1-4 above). 

There is also a `python` version, `scripts/serversetup.py`, under construction. 

## node Server

You need `node.js` and `npm` to install this server. Instructions are available [here](https://www.npmjs.com/get-npm). 

With `node.js` and `npm` you can install this package by running
```
npm install
```
in the repo directory. I run with
```
$ npm start
... do other stuff, until we need to stop with:
$ npm stop
```
To check for startup errors, you can run the following script: 
```
$ ls -tlh log/error* | head -1 | awk '{ print $NF" size: "$5 }'
```
If everything is ok, you should see something like
```
log/error-2018-05-03T06-34-36.log size: 0B
```

In production, use a deployment tool like [PM2](http://pm2.keymetrics.io/) or [`systemd`](https://www.freedesktop.org/wiki/Software/systemd/). I prefer the latter, and thus have provided templates for that. Make sure `service/statesampler.service` is correct for your deployment, copy into place with
```
$ sudo cp service/statesampler.service /etc/systemd/system
```
and reload/launch/enable: 
```
$ sudo systemd daemon-reload
$ sudo systemd enable statesampler.service
$ sudo systemd start statesampler.service
$ sudo systemd status statesampler.service
```
Those steps (presuming `service/statesampler.service` is correct) are packaged in a script `service/statesampler.deploy` that can be executed by running
```
$ npm run-script deploy
```
or, if you like, run directly (but watch out for where you run it from). 

Hopefully you don't hit errors. [Create an issue](https://github.com/wrossmorrow/statesampler/issues) if you do. 

## HTTPS and SSL Certificates

Qualtrics uses `HTTPS` and thus so must you to not generate mixed-content requests, which most browsers won't allow without client-side customization. I used [Let'sEncrypt](https://letsencrypt.org/)'s free [`certbot`](https://certbot.eff.org/) tool to generate SSL certs that can be used for `HTTPS`. It is fairly easy to just follow the instructions. 

## Apache Setup

To run with `apache`, modify the `apache/vhost.conf` and `apache/vhost_ssl.conf` files by entering your DNS name in place of `my.server.com` as well as the webmaster email address (if desired). These need to be placed in `/etc/apache/sites-available` and enabled with 

```
$ sudo a2ensite vhost vhost_ssl
```
Or you can just replace the content in the default sites enabled for `HTTP` and `HTTPS`. 

You also need to make sure the right modules are enabled with, e.g., 
```
$ sudo a2enmod ssl proxy proxy_http rewrite
```
restart `apache`
```
$ sudo systemctl restart apache2.service
```
and check for errors
```
$ sudo systemctl status apache2.service
```
You can run the script `apache/setup.sh` with your DNS name and webmaster email, like 
```
$ ./apache/setup.sh an.address.com someone@gmail.com
``` 
to make the default changes to `apache`. Note, though, that these `.conf` files presume some defaults you should make sure are appropriate for your environment. 


# API Overview

In what follows we give a brief overview of the API calls `statesampler` uses. 

## Datasources

`GET /data`: Get summary information about the datasets currently installed. 

`PUT/POST /data`: Load data as a new dataset using the request body. Returns an ID `did` to refer to this dataset. 

`GET /data/:did`: Get the full content of the dataset with ID `did`. This could be permissioned, but if you're handing back data to survey participants anyway, how secret can this data be? 

`GET /header/:did`: Get the header (column/field labels) being used in this dataset. 

`DELETE /data/:did`: Delete the dataset with ID `did`. Requires passing the `secret` in a request body. 

## Samplers

`GET /samplers`: get summary data about samplers currently running on the instance. 

`PUT/POST /sampler/:did`: create a sampler for a dataset (referenced by it's ID `did`). Returns an ID `sid` you can use to refer to this sampler. 

`GET /sampler/:sid': get summary information about a sampler. 

`DELETE /sampler/:sid`: delete a sampler from the server. Requires passing the `secret` in a request body. 

`GET /sample/:sid`: get a sample from a particular sampler. 

`GET /counts/:sid`: get the vector of counts being used for sampler `sid`. 

`POST /reset/:sid`: Reset a sampler `sid`'s count vector, or other "clearing" activities. Requires passing the `secret` in a request body. 

# Datasources

## CSV/JSON

## Google Sheets

Let's say you want to hook up `statesampler` to a Google Sheet. Before you launch an experiment, you need to

1. Initialize a Google Sheets API object with an API key you get from enabling the sheets API in your google account
2. Load a particular sheet by specifying a `spreadsheetId` and `range` 
3. Optionally load a header, from the same spreadsheet or a different one, used to encode responses
4. Specify a sampling method, the default being the "balanced-uniform" strategy

During an experiment, you can

5. Sample reviews one-by-one, returning data that can be used to construct questions in Qualtrics (_during_ experiment)
6. Report client-side errors during question loads back to the experimenter (_during_ experiment)

## AWS S3


# Samplers

## PureRandomSampler

## RandomSampler

Our `RandomSampler` currently comes with four basic random sampling methods: 

* standard-uniformly, 
* "balanced-uniformly" relative to some max count per item,
* exponentially-weighted samples away from large counts, 
* and reciprocally-weighted samples away from large counts

As we've hinted, the first (uniformly sampling) is trivial to implement within standard `javascript`, although this is plausibly more efficient here because the server pre-loads all data in the sheet instead of every client loading it all. A client needs only ask for one row at a time, and thus loads only those relevant to it. 

## DoESampler


## QueueSampler



# Interaction 

## Qualtrics/javscript Fetch Example

I would only use `javascript` to get sampled reviews within Qualtrics questions. That is, I wouldn't use it to setup the data for the experiment, although you could within `node.js` with either other scripts or the interactive mode. 

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
					Qualtrics.SurveyEngine.setEmbeddedData( 'R1' , json.Row );

				} )
			} , error => {

				// Dump error, if we can, to the server. Otherwise we have no window into client-side errors. 
				var postOpt = { method : 'post', body : JSON.stringify( error ) };
				fetch( "https://my.server.com/statesampler/api/error" , postOpt );

			} );
} );
```

This example is provided in `scripts/qualtrics.js`. 

# License

Apache 2.0 with modifications. You are welcome to use this software under the normal Apache 2.0 conditions for non-commercial purposes. Contact the author for licensing for commercial purposes. See LICENSE.md. 

# Contact

[morrowwr@gmail.com](mailtomorrowwr@gmail.com)

[wrossmorrow.com](https://wrossmorrow.com)

[web.stanford.edu/~morrowwr](https://web.stanford.edu/~morrowwr)

[www.linkedin.com/in/wrossmorrow](https://www.linkedin.com/in/wrossmorrow)
