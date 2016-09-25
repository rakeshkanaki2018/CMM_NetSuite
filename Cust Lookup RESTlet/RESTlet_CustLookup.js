/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/error', 'N/log', 'N/https', 'N/search', 'N/runtime'],
	function(record, error, log, https, search, runtime) {
		function doValidation(args, argNames, methodName) {
			for (var i = 0; i < args.length; i++)
				if (!args[i] && args[i] !== 0)
					throw error.create({
						name: 'MISSING_REQ_ARG',
						message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
					});
		}

		function _post(context) {
			if (context.internalid) {
				doValidation(context.internalid, 'internalid', 'POST');
				log.debug('POST', 'Internal ID ' + context.internalid);
				try {
					var internalid = {};

					var searchResults = search.create({
						"type": "entity",
						"columns": [search.createColumn({
							"name": "internalid"
						}), search.createColumn({
							"name": "entityid"
						})],
						"filters": [search.createFilter({
							"name": "internalid",
							"operator": "is",
							"values": context.internalid
						})]
					});
					searchResults.run().each(function(result) {
						log.debug('Results', result);
						if (result === null) {
							internalid = {};
						} else {
							internalid = {
								'internalid': result.id,
								'name': result.getValue({
									'name': 'entityid'
								})
							};
						}
					});
					return internalid;

				} catch (e) {
					log.error(e.name);
					throw error.create({
						name: 'FAILURE_POST_RETURN',
						message: 'Failure to return Obj' + e
					});
				}
			} else if (context.email) {
				doValidation(context.email, 'email', 'POST');
				log.debug('POST', 'Customer ' + context.email);

				try {
					var email = {};
					var emails = [];

					var searchResults = search.create({
						"type": context.type,
						"columns": [search.createColumn({
							"name": "internalid"
						}),
						search.createColumn({
							"name": "entityid"
						})],
						"filters": [search.createFilter({
							"name": "email",
							"operator": "is",
							"values": context.email
						})]
					});
					searchResults.run().each(function(result) {
						log.debug('Results', result);
						if (result === null) {
							email = {};

						} else {
							email = {
								'internalid': result.getValue({
									'name': 'internalid'
								}),
								'name': result.getValue({
									'name': 'entityid'
								})
							};
							emails.push(email);
						}
						return true;
					});
					log.debug('Emails',email);
					return emails;

				} catch (e) {
					log.error(e.name);
					throw error.create({
						name: 'FAILURE_POST_RETURN',
						message: 'Failure to return Obj' + e
					});
				}
			}
		}

		return {
			post: _post
		};
	});