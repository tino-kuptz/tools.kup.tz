# tools.kup.tz

A serverless website with various tools, hosted on Cloudflare.

## Motivation

Every now and then there are some things that I do manually, which would be much faster with a program. An example: finding out which provider a website is hosted with.

Since such things accumulate, I decided to build a tools website for this. When I need a tool that fits here, it goes in here.

## Contributing

If someone has nice tools, I'm happy to include them. Just create a merge request.

I'd like to point out now that I don't have the time to take care of everything immediately. So you may have to wait a bit until I get back to you.

## Initial Project Phase

I'm not taking this project 100% seriously. Please bear with me if I (especially in the beginning) commit 30 changed files with <code>fdsajkhfdsakf</code> as the description.

## Technical Details

Info to quickly understand the project.

### Hosting

Hosting is on Cloudflare Pages. 

A D1 database is connected in the background.

The schema for this can be found in `db.sql`.

### Tokens

Since some tools require server code, and I'm the idiot whose name is at the top of the bill, this tool uses anonymized IP addresses to track usage.

Each IP subnet (IPv4: /28, IPv6: /104) has 1,000 "tokens" per day that can be used.<br>Individual API endpoints consume different amounts of tokens.

If someone wants to host this themselves and wants to play around with the logic: In `server/utils/usage.js` is the logic for collecting and evaluating the points.<br>
In `utils/toolList.js` is the primary tool list (from which the sidebar and homepage are also generated) - the tokens are also taken from this server-side when tracking.

### External Projects

This project also includes the project [tino-kuptz/397625878.xyz](https://github.com/tino-kuptz/397625878.xyz). This is used in the HTTP-Log-Tool and logs HTTP requests to `*.397625878.xyz`.

### CT-Logs

Information about the logs can be found in `/utils/ctLogList.json`.  
The file was simply downloaded from `https://www.gstatic.com/ct/log_list/v3/log_list.json`.

## Template

The following template is used for this project:<br>
https://github.com/themeselection/sneat-vuetify-nuxtjs-admin-template-free
