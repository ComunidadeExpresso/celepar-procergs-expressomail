(function( $ ){
	$.fn.im = function( options ) {
	    var defaults = {
	    	contactClass: "chat-contact",
		    onlineClass : "online",
		    awayClass : "away",
		    offlineClass : "offline",
		    busyClass : "busy",
		    overColor: "#DEE8F0",
		    /* if div is hidden will show after load */
		    jid: "",
		    password: "",
		    url:"localhost",
		    resource:"Chat",
		    beforeConnect : undefined,
		    afterConnect: undefined,
		    errorFunction: undefined,
		    chatClass: "chat-container",
		    chatListClass: "chat-list",
		    loadClass : "loading-chat",
		    defaultStatus: null,
		    /* helps to debug some error's */
		    debug: false,
		    contactList: [],
		    contactNameIndex: "from",
		    title: "## " + messages.pt_br.NEW_MESSAGE + " ##",
		    defaultTitle: document.title,
		    /* save the messages sent and received */
		    afterMessage : undefined,
		    afterIq : undefined,
		    soundPath: "",
		    soundName: "pop",
		    minimizeZone: undefined,
		    autoStatusTime: ( 60000 * 2 ),
		    autoStatusMessenger: null,
		    emotions: [
		    	{
		    		emotion: /:\)/g,
		    		emotionClass: "smile"
		    	},
		    	{
		    		emotion: /:D/ig,
		    		emotionClass: "happy"
		    	},
		    	{
		    		emotion: /:p/ig,
		    		emotionClass: "tongue"
		    	},
		    	{
		    		emotion: /:\(/g,
		    		emotionClass: "sad"
		    	},
		    	{
		    		emotion: /:o/ig,
		    		emotionClass: "surprised"
		    	},
				{
		    		emotion: /\(l\)/ig,
		    		emotionClass: "heart"
		    	},	    			    
		    	{
		    		emotion: /\(y\)/ig,
		    		emotionClass: "thumb_up"
		    	},
		    	{
		    		emotion: /;\)/g,
		    		emotionClass: "wink"
		    	},
		    	{
		    		emotion: /\(n\)/ig,
		    		emotionClass: "thumb_down"
		    	}
		    ],
		    addContact : true
	  	};

  		var settings = {},
		connection_options = {};

	  	settings = $.extend( {}, defaults, options );	  	

	  	var $container = this,
  		$parent = $(this).parent(),
  		$container_body = $("<div/>"),
  		statusClasses = settings.onlineClass + " " + settings.awayClass + " " + settings.busyClass + " " + settings.offlineClass,
		t = null,
		user = settings.username;//settings.jid.split("@")[0],
		var contacts = [];
		
  		prepare($container, user);

		var $container_list = $container.find("ul:first").addClass(settings.chatListClass);
		var alfabetic = function(){};

		if( settings.height && settings.height > 0 )
		{
			$container_list.css("height", "200px" )
			.css("overflow-x","hidden")
			.css("overflow-y","scroll");
		}

		generateContacts($container_list);

		$.contextMenu({
	        selector: '.chat-title.chat-me .chat-status.'+settings.onlineClass+
	        ",.chat-title.chat-me .chat-status."+settings.busyClass+
	        ",.chat-title.chat-me .chat-status."+settings.awayClass+
	        ",.chat-title.chat-me .chat-status."+settings.offlineClass,
	        className	: 'chat-status-context-menu',
	        trigger		: 'left',
	        autoHide	: true,
	        events		: 
	        {
	        	show : function(opt)
	        	{
	        		$('.chat-status-context-menu').css({'list-style': 'none', 'list-style-image':'none' });
	        	}
	        },
	        items: {
	            "online": { name: messages.pt_br.ONLINE , icon: settings.onlineClass, callback: function(key, opt){ 
	            	$.xmpp.setPresence({show:null}); 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.onlineClass); 
	            }},
	            "busy": { name: messages.pt_br.BUSY , icon: settings.busyClass, callback: function(key, opt){ 
	            	$.xmpp.setPresence({show:"dnd"}); 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.busyClass); 
	            }},
	            "away": { name: messages.pt_br.AWAY , icon: settings.awayClass, callback: function(key, opt){
	            	$.xmpp.setPresence({show: "away"}); 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.awayClass); 
	            }},
	            "offline": { name: messages.pt_br.OFFLINE , icon: settings.offlineClass, callback: function(key, opt){
	            	$.xmpp.disconnect();
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.offlineClass); 
	            }}
	            /*"sep1": "---------",
	            "quit": {name: messages.pt_br.QUIT , icon: "quit", callback: function(key, opt){
	            	$.xmpp.disconnect();
	            }}*/
	        }
	    });


		$.contextMenu({
	        selector: '.'+settings.chatListClass+' .'+settings.contactClass,
	        className	: 'chat-contact-context-menu',
	        autoHide	: true,
	        events		:
	        {
	        	show : function(opt)
	        	{
	        		$('.chat-contact-context-menu').css({'list-style': 'none', 'list-style-image':'none' });
	        	}
	        },
	        items: {
	            "authorize": {name: messages.pt_br.AUTHORIZE , icon: "question", callback: function(key, opt){ 
	            	//contacts[$(this).attr('id')] = user data
	            	authorize(contacts[$(this).attr('id')], null);
	            }},
	            "block": {name: messages.pt_br.BLOCK , icon: "block", callback: function(key, opt){ 
	            	//contacts[$(this).attr('id')] = user data
	            	authorize(contacts[$(this).attr('id')], "unavailable");	            	
	            }},
	            "update": {name: messages.pt_br.UPDATE, icon: "edit", callback: function(key, opt){ 
	            	//contacts[$(this).attr('id')] = user data
	            	addContact(null, contacts[$(this).attr('id')],$(this));
	            }},
	            "delete": {name: messages.pt_br.DELETE , icon: "delete", callback: function(key, opt){ 
	            	$.xmpp.deleteContact({to:contacts[$(this).attr('id')]['jid']});
	            	$(this).remove();
	            }}
	        }
	    });

		if(settings.debug)
			debug("Executing beforeConnect()");
		/* if need to do something before connect */
		if(typeof(settings.beforeConnect) === "function")
			settings.beforeConnect();

		if(settings.debug)
			debug("Executed beforeConnect()");

		/* Conection with xmpp */
		if($.xmpp){
			if(settings.debug)
				debug("Connecting to xmpp");
			connection_options = {
				"resource":settings.resource, "username":settings.username, "password":settings.auth, "url":settings.url, "domain" : settings.domain,				
				onDisconnect:function(){
					destroy($container_list,$container);
					if(settings.debug)
						debug("Disconnected");
					
					// IM Icon Disabled
					closeMessenger();

					$("#content_messenger").find("div#_menu img")
						.attr("src","templates/default/images/chat-icon-disabled.png")
						.attr("title",get_lang("Expresso Messenger disabled"))
						.attr("alt",get_lang("Expresso Messenger disabled"));
					
					$("#content_messenger").find("div#_menu").on("click", openMessenger );

				},
				onConnect: function(eas){
					if(settings.debug)
						debug("Connected to xmpp");

					$.xmpp.getRoster();
					$.xmpp.setPresence(settings.defaultStatus);
					$container.find("."+settings.loadClass).removeClass(settings.loadClass);					

					// IM Icon Enabled
					$("#content_messenger").find("div#_menu img")
						.attr("src","templates/default/images/chat-icon-enabled.png")
						.attr("title",get_lang("Expresso Messenger enabled"))
						.attr("alt",get_lang("Expresso Messenger enabled"))
						.off("click");

					var statusClass = 
						settings.defaultStatus ? 
							( settings.defaultStatus === "offline" ? 
								settings.offlineClass : (settings.defaultStatus === "dnd" ? 
									settings.busyClass : settings.awayClass)) 
						: settings.onlineClass;

					$(".chat-conversation-dialog textarea").removeAttr("disabled");
					$container.find(".chat-status").addClass(statusClass);

					/* if need to do something after connect */ 
					if(settings.debug)
						debug("Executing afterConnect()");
					if(typeof(settings.afterConnect) === "function")
						settings.afterConnect();
					if(settings.debug)
						debug("Executed afterConnect()");

					// Auto Status Way
					settings.autoStatusMessenger = setTimeout( function(){ autoStatus(); }, settings.autoStatusTime );

					$(document).on('mousemove', function()
					{
						if( $.xmpp.getMyPresence() == "away" )
						{
							$.xmpp.setPresence( { show: "null" } ); 

							$("span.chat-status").removeClass(statusClasses).addClass(settings.onlineClass); 
				        }
					});
					
					$(document).on('keypress', function()
					{ 
						if( $.xmpp.getMyPresence() == "away" )
						{
							$.xmpp.setPresence( { show: "null" } ); 

							$("span.chat-status").removeClass(statusClasses).addClass(settings.onlineClass); 
				        }
					});
				},
				onIq: function(iq){
					if(settings.debug)
						debug("onIQ : " + iq);
					var from = $(iq).find("own-message").attr("to");
					from = from.match(/^[\w\W][^\/]+[^\/]/g)[0];
					var id = MD5.hexdigest(from);
					var conversation = $("#"+id+"_chat");
					if(conversation.length == 0){
						conversation = openChat({title: contacts[id]['from'], from:from, id: id+"_chat", md5_id:id});
						conversation.parent().find(".ui-dialog-titlebar").prepend($("#"+id).find(".chat-status").clone().removeClass("chatting"));
					}else{
						conversation.wijdialog("open");
					}
					var conversation_box = conversation.find(".chat-conversation-box");
					var date = "<span style='font-size:9px;'>("+(new Date().toString("HH:mm"))+")</span>";

					$("<div/>")
					.addClass("chat-conversation-box-me")
					.html(date+"<strong> Me: </strong>"+formatters($(iq).find("div").html()))
					.appendTo(conversation_box);
					conversation_box.scrollTo("div:last");
					conversation_box.next().html("");
				},
				onMessage: function(message){
					if(settings.debug)
						debug("onMessage : " + message);
					message.from = message.from.match(/^[\w\W][^\/]+[^\/]/g)[0];
					var jid = message.from.split("/");
					var id = MD5.hexdigest(message.from);
					var conversation = $("#"+id+"_chat");
					if(message.body){
						if(conversation.length == 0){
							conversation = openChat({title: (contacts[id] ? contacts[id]['from']:message.from) , from:message.from, id: id+"_chat", md5_id:id});

							var status = $("#"+id).find(".chat-status").clone().removeClass("chatting");

							if(!status.length){
								status = $("<div/>")
								.addClass("chat-status")
								.addClass(settings.offlineClass);
							}

							conversation.parent().find(".ui-dialog-titlebar").prepend(status);
						}else{
							conversation.wijdialog("open");
						}
					}
					var conversation_box = conversation.find(".chat-conversation-box");
					var date = "<span style='font-size:9px;'>("+(new Date().toString("HH:mm"))+")</span>";

					if( message.body )
					{
						$("<div/>")
						.addClass("chat-conversation-box-you")
						.html(date+"<strong> "+(contacts[id] ? contacts[id]['from']:message.from)+": </strong>"+formatters(message.body))
						.appendTo(conversation_box);
						conversation_box.scrollTo("div:last").next().html("");
						conversation.parent().find(".ui-dialog-titlebar").css({"background":"#DF7401","border-color":"#DF7401"});
						document.title = settings.title;
						document.getElementById("new_message_sound").play();

						noty({
							text: '<strong>'+contacts[id]['from']+' say:</strong><br/>'+(message.body.length > 20 ? message.body.substr(0,17)+"..." : message.body), 
							type: 'warning',
							timeout: 3000,
							layout: 'bottomRight',
							callback: {
								onCloseClick: function(e) {
									$("#"+id).click();
								}
							}
						});
					}
					if(settings.afterMessage)
						afterMessage(message);		
				},
				onPresence: function(presence){
					if(settings.debug)
						debug("onPresence : " + presence);

					presence.from = presence.from.match(/^[\w\W][^\/]+[^\/]/g)[0];
					var md5_contact = MD5.hexdigest(presence.from);
					var select = $("#"+md5_contact);
					var statusClass = 
						presence['show'] !== "available" ? 
							( presence['show'] === "unavailable" ? 
								settings.offlineClass : (presence['show'] === "dnd" ? 
									settings.busyClass : (presence['show'] === "away"?
									settings.awayClass : settings.onlineClass))) 
						: settings.onlineClass;
					var from = presence.from.split("@")[0];
					var dialogs = $("#"+md5_contact+"_chat");
					if(select.length){
						select.find('.chat-contact-description')
						.html(presence['status'] ? " (...) " : "")
						.attr("title", presence['status'] )
						.attr("alt", presence['status']);

						select.find("div.chat-status")
						.removeClass(statusClasses)
						.addClass(statusClass);
						if(dialogs.length){
							$("#"+md5_contact).addClass("chatting");
							dialogs.parent().find("div.chat-status")
							.removeClass(statusClasses)
							.addClass(statusClass);
						}
					}
					if(statusClass == settings.onlineClass){
						noty({
							text: '<strong>'+contacts[md5_contact]['from']+'</strong><br/>is online now', 
							type: 'success',
							timeout: 3000,
							layout: 'bottomRight',
							callback: {
								onCloseClick: function(e) {
									console.log(e);
									$(select).click();
								}
							}
						});
					}
					clearTimeout(alfabetic);
					alfabetic = setTimeout(function(){
						$container_list.find("li").tsort("."+settings.onlineClass, "span.chat-contact-name",{charOrder:"a[����]c[�]e[����]i[����]o[����]u[����]"});
						$container_list.find("li").tsort("."+settings.busyClass, "span.chat-contact-name",{charOrder:"a[����]c[�]e[����]i[����]o[����]u[����]"});
						$container_list.find("li").tsort("."+settings.awayClass, "span.chat-contact-name",{charOrder:"a[����]c[�]e[����]i[����]o[����]u[����]"});
						$container_list.find("li").tsort("."+settings.offlineClass, "span.chat-contact-name",{charOrder:"a[����]c[�]e[����]i[����]o[����]u[����]"});
					},1000);
				},
				onError: function(error){
					if(settings.debug)
						debug("onError :" + error);
					if(settings.errorFunction)
						settings.errorFunction(error);

					destroy($container_list,$container);
				},
   				onComposing: function(message)
   				{
   					message.from = message.from.match(/^[\w\W][^\/]+[^\/]/g)[0];
					var id = MD5.hexdigest(message.from);
					var conversation = $("#"+id+"_chat");
					if(conversation.length){
						var conversation_box = conversation.find(".chat-conversation-box").next();
						var date = (new Date().toString("HH:mm"));
						switch(message.state){
							case 'active':
								conversation_box.html("").html("<span class='read-icon'></span> "+messages.pt_br.SEEN+" "+date);
								break;
							case 'composing':
								conversation_box.html("").html("<span class='composing'></span> "+contacts[id]['from']+" "+messages.pt_br.IS_TYPING+"...");
								break;
							case 'gone':
								conversation_box.html("").html("<span class='active'></span> "+messages.pt_br.GONE+" "+date);
								break;
							case 'paused':
								conversation_box.html("").html("<span class='paused'></span> "+contacts[id]['from']+" "+messages.pt_br.STOPPED_TYPING+"...");
								break;
							default:
								conversation_box.html("");
						}
					}
   					if(settings.debug)
						debug("onComposing : " + message);
   				},
   				onRoster: function( roster)
   				{  			
   					if(settings.debug)
						debug("onRoster : " + roster);		

					var _rosterJid = roster.jid;
					_rosterJid = _rosterJid.match(/^[\w\W][^\/]+[^\/]/g)[0]; 
   					
   					var md5_contact = MD5.hexdigest(_rosterJid);
					var select = $("#"+md5_contact);
					var from = roster['name'] ? roster['name'] : _rosterJid;

					contacts[md5_contact] = roster;
					contacts[md5_contact]['from'] = from;

					if(!select.length){
						//select.find(".chat-contact-name").html(from);
	   					var contact = $("<li/>")
						.attr("title", messages.pt_br.CLICK_TO_START_A_CONVERSATION_WITH + " " + from )
						.attr("id", md5_contact)
						.addClass(settings.contactClass);
						
						var status = $("<div/>")
						.addClass("chat-status")
						.addClass(settings.offlineClass)
						.appendTo(contact);

						$("<span/>")
						.addClass("chat-contact-name")
						.html(from)
						.appendTo(contact);

						$("<span/>")
						.addClass("chat-contact-description")
						//.html(from)
						.appendTo(contact);

						contact.click(function(){
							var id = md5_contact+"_chat";
							var conversation = $("#"+id);
							if(conversation.length == 0){
								conversationDialog = openChat({"title":from, "from": _rosterJid, "id": id, "md5_id":md5_contact});
								conversationDialog.parent().find(".ui-dialog-titlebar").prepend(status.clone().removeClass("chatting"));
							}
							else{
								conversation.wijdialog("restore");
								conversation.wijdialog("open");
							}
						});
						$container_list.append(contact);	

						// Presence automatic
						if( $.trim(roster.subscription) == "from" ){
							authorize(contacts[md5_contact], null);
						}

					}else{
						select.find(".chat-contact-name").html(from);
					}
   				}
		    };

		  	$.xmpp.connect(connection_options);
		}else{
			if(settings.debug)
				debug("xmpp plugin not found");
		}

		/* Auto Status */
		function autoStatus()
		{
			if( settings.autoStatusMessenger )
			{
				clearTimeout( settings.autoStatusMessenger );
			}

			if( $.xmpp.getMyPresence() == "available" || $.xmpp.getMyPresence() == "null" )
			{
				$.xmpp.setPresence( { show: "away" } ); 
				
				$("span.chat-status").removeClass(statusClasses).addClass(settings.awayClass);
	        }

			settings.autoStatusMessenger = setTimeout( function(){ autoStatus();}, settings.autoStatusTime );
		}

		/* if the list of the users are pre-defined */
	  	function prepare(container, user){
	  		if( settings.debug )
				debug("Preparing");

			var div = $("<div/>")
			.addClass("chat-title chat-me")
			.appendTo(container);

			// First Div - status, name
			var _divFirst = $("<div/>")
			.css({"vertical-align":"top", "height":"25px", "width":"95%", "border-bottom":"1px dashed #cecece"})
			.appendTo(div);

			$("<span/>")
			.addClass("chat-status")
			.attr("title", messages.pt_br.CHANGE_YOUR_STATUS )
			.attr("alt", messages.pt_br.CHANGE_YOUR_STATUS )
			.addClass(settings.loadClass)
			.appendTo(_divFirst);

			$("<span/>")
			.addClass("chat-name")
			.css({"padding-left":"10px","vertical-align":"top"})
			.appendTo(_divFirst);

			// Second Div - Msg status, addContact
			var _divSecond = $("<div/>")
			.css({"vertical-align":"top","height":"20px !important"})			
			.appendTo(div);

			// Add Button Contact
			if( settings.addContact )
			{
				$("<span>")
				.addClass("ui-icon ui-icon-circle-plus")
				.attr("title", messages.pt_br.ADD_CONTACT )
				.attr("alt", messages.pt_br.ADD_CONTACT )
				.appendTo(_divSecond)
				.button()
				.click(addContact);
			}			

			var text = "";
			$("<input/>")
			.addClass('chat-description-input')
			.attr({type: 'text', /*placeholder*/value: messages.pt_br.YOUR_MESSAGE_TODAY , readonly: "readonly", title: messages.pt_br.DOUBLE_CLICK_TO_EDIT, alt: messages.pt_br.DOUBLE_CLICK_TO_EDIT })
			.wijtextbox()
			.dblclick(function(){
				if( $.xmpp.isConnected() ){
					text = $(this).val();
					$(this).removeAttr("readonly");
				}
			})
			.keydown(function(e){
				if(e.which == $.ui.keyCode.ENTER && !e.shiftKey)
				{
					if($.trim($(this).val()) != "")
					{
						$.xmpp.setPresence({status: $(this).val()});
						text = $(this).val();
					}
					$(this).attr("readonly", "readonly");
				}else if(e.which == $.ui.keyCode.ESCAPE){
					$(this).val(text);					
					$(this).attr("readonly", "readonly");
				}
			})
			.focusout(function(){
				$(this).focus();
				$(this).val(text);
				$(this).attr("readonly", "readonly");		
			})
			.appendTo(_divSecond);

			$("<div/>")
			.addClass("chat-list-title")
			.html( messages.pt_br.CONTACT_LIST )
			.appendTo(container);

			var search_box = $("<input/>")
			.addClass("chat-search-input")
			.attr("placeholder", "Type your search")
			.keydown(function(e){
				if(e.which == $.ui.keyCode.ENTER && !e.shiftKey){
					$(this).parent().find("ul").toggle();
				}
			});

			$("<div/>")
			.addClass("chat-list")
			.addClass(settings.chatClass)
			.addClass(settings.loadClass)
			.append()
			.append("<ul/>")
			.append("<ul class='chat-search-result' style='display:none;'/>")
			.appendTo(container);

			if (!settings.minimizeZone){
				$("<div/>")
				.addClass("footer-conversation-bar ui-widget-header ui-corner-tl ui-corner-tr")
				.attr("id", "conversation-bar-container")
				//.appendTo("body");
				.appendTo("#messenger-conversation-bar-container");
			}
			
	  		if( settings.debug )
				debug("Prepared");
	  	}

		function addContact( e, data, select ) {
			if( !$.xmpp.isConnected() ) return false;
			var hasCatalogSearch = typeof Catalog == 'object' && typeof Catalog.search == 'function';
			return hasCatalogSearch && !data? drawAddContactFromCatalog( this ) : drawAddContact( this, data, select );
		}
		
		function drawAddContactFromCatalog( obj ) {
			var img_empty = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
			var div = $('<div>').addClass( 'chat-add-contact' )
				.append( $('<div>').css( { 'display': 'table' } )
					.append( $('<div>').css( { 'display': 'table-cell', 'width': '100%', 'float': 'left', 'position': 'relative' } )
						.append( $('<span>').html( messages.pt_br.SEARCH + ':' ) )
						.append( $('<img>')
							.attr( { 'id': 'img_cc_loader', 'src': '../prototype/plugins/messenger/images/ajax-loader.gif' } )
							.css( { 'display': 'none', 'position': 'absolute', 'right': '0px', 'top': '-3px' } )
						)
						.append( $('<input>').attr( { 'type': 'text' } ).css( { 'margin': '2px 0 4px'} )
							.bind( 'keyup.srccc input.srccc paste.srccc', function( e ) {
								Catalog.search( 'search', $(e.currentTarget).val(), function( data ) {
									console.log( data );
									$('#img_cc_loader').hide();
									if ( !data ) return false;
									$('#msg_cc_error').html(
										( data.status && data.status != 'SUCCESS' )? (
											(messages.pt_br[data.status])? messages.pt_br[data.status] : messages.pt_br.ERROR
										) + ' ' : ''
									);
									if ( data.user ) {
										$('#jid_inpt_txt').val( data.user.uid+'@'+settings.domain );
										$('#nick_inpt_txt').attr( { 'disabled': null } ).wijtextbox( { 'disabled': false } ).val( data.user.cn );
										if ( data.user.img ) $('#im_photo_img').attr( { 'src': data.user.img } );
									} else if ( data.users ) {
										$('#nick_inpt_sel').append( $('<option>').html( 'Select' ) );
										for ( key in data.users ) $('#nick_inpt_sel').append(
											$('<option>').val( key ).html( data.users[key] + ' (' + key + ')' )
										);
										$('#nick_inpt_sel').show();
										$('#nick_inpt_txt').hide();
									} else $('#msg_cc_error').append( messages.pt_br.NO_RESULTS_FOUND );
								}, function() {
									$('#img_cc_loader').show();
									$('#msg_cc_error').html('');
									$('#jid_inpt_txt').val('');
									$('#nick_inpt_txt').attr( { 'disabled': 'disabled' } ).wijtextbox( { 'disabled': true } ).val('').show();
									$('#nick_inpt_sel').html('').hide();
									$('#im_photo_img').attr( { 'src': img_empty } );
								}, ( e.type == 'keyup' && ( e.keyCode || e.which ) == KeyEvent.DOM_VK_RETURN )? 0 : 1500 );
							} )
						)
						.append( $('<span>').html( messages.pt_br.NICK + ':' ) )
						.append( $('<input>').attr( { 'id': 'nick_inpt_txt', 'type': 'text', 'disabled': 'disabled' } ).css( { 'margin': '2px 0 4px' } ) )
						.append( $('<select>')
							.attr( { 'id': 'nick_inpt_sel', 'type': 'text', 'class': 'ui-widget ui-state-default ui-corner-all wijmo-wijtextbox' } )
							.css( { 'margin': '2px 0 4px', 'width': '100%', 'display': 'none', 'padding': '4px' } )
							.hover( function() { $(this).addClass('ui-state-hover'); }, function() { $(this).removeClass('ui-state-hover'); } )
							.change( function() {
								Catalog.search( 'get', $('#nick_inpt_sel').val(), function( data ) {
									console.log( data );
									$('#img_cc_loader').hide();
									if ( !data ) return false;
									if ( data.user ) {
										$('#nick_inpt_sel').hide();
										$('#jid_inpt_txt').val( data.user.uid+'@'+settings.domain );
										$('#nick_inpt_txt').show().attr( { 'disabled': null } ).wijtextbox( { 'disabled': false } ).val( data.user.cn );
										if ( data.user.img ) $('#im_photo_img').attr( { 'src': data.user.img } );
									}
								}, function() {
									$('#img_cc_loader').show();
									$('#msg_cc_error').html('');
								}, 0 );
							} )
						)
						.append( $('<span>').html( messages.pt_br.IDENTIFICATION + ':' ) )
						.append( $('<input>').attr( { 'id': 'jid_inpt_txt', 'type': 'text', 'disabled': 'disabled' } ).css( { 'margin': '2px 0 4px'} ) )
					)
					.append( $('<div>').css( { 'display': 'table-cell', 'padding-left': '10px' } )
						.append( $('<div>').css( { 'border': '1px solid #79b7e7', 'padding': '2px' } )
							.append( $('<div>').css( { 'width': '90px', 'height': '120px', 'position': 'relative', 'overflow': 'hidden' } )
								.append( $('<div>').css( { 'width': '270px', 'position': 'absolute', 'left': '-90px' } )
									.append( $('<img>')
										.attr( { 'id': 'im_photo_img', 'src': img_empty } )
										.css( { 'height': '120px', 'position': 'absolute', 'margin': '0 auto', 'left': '0', 'right': '0', 'background': 'url("./templates/default/images/photo.jpg") no-repeat scroll center center' } )
									)
								)
							)
						)
					)
				).append(
					$('<div>').css( { 'margin': '4px 0 -5px', 'min-height': '14px' } ).append(
						$('<span>').attr( { 'id': 'msg_cc_error'} ).css( { 'font-weight': 'lighter', 'color': 'red' } )
					)
				);
			
			$(div).find( 'input' ).wijtextbox();
			
			
			var offset = $(obj).offset();
			$(div).wijdialog( {
				autoOpen: true,
				title: messages.pt_br.ADD_CONTACT,
				draggable: true,
				width: 400,
				dialogClass: 'add-contact-dialog',
				captionButtons: {
					pin: { visible: false },
					refresh: { visible: false },
					toggle: { visible: false },
					minimize: { visible: false },
					maximize: { visible: false }
				},
				resizable: false,
				position: [ offset.left, offset.top ],
				buttons: [
					{
						text: messages.pt_br.ADD,
						click: function() {
							var data = {
								'type': 'subscribe',
								'name': $('#nick_inpt_txt').val(),
								'to': $('#jid_inpt_txt').val()
							}
							$.xmpp.addContact( data );
							$.xmpp.subscription( data );
							$(this).wijdialog( 'destroy' );
						}
					},
					{
						text: messages.pt_br.CANCEL,
						click: function(){
							$(this).wijdialog( 'destroy' );
						}
					}
				],
				close: function(){
					$(this).wijdialog( 'destroy' );
				}
			} );
			$('#jid_inpt_txt').removeClass('ui-state-disabled');
		}
		
		function drawAddContact(obj, data, select){
			if( !$.xmpp.isConnected() ) return false;
			
			var div = $("<div/>")
			.addClass("chat-add-contact");

			$("<span>")
			.html( messages.pt_br.NICK + ": " )
			.appendTo(div);

			$("<input type='text'>")
			.attr({name: 'name', placeholder: messages.pt_br.ENTER_A_NAME })
			.appendTo(div)
			.val(data ? data.name : "");

			$("<br/>")
			.appendTo(div);

			$("<span>")
			.html( messages.pt_br.IDENTIFICATION + ": ")
			.appendTo(div);

			var emailAttrs = { name: 'to', placeholder: messages.pt_br.ENTER_A_JID };
			if(data){
				emailAttrs['disabled'] = "disabled";
			}

			$("<input type='text'>")
			.attr(emailAttrs)
			.appendTo(div)
			.val(data ? data.jid : "");

			$(div).find("input").wijtextbox();

			var offset = $(select? select : obj).offset();
			var _data = data;
			div.wijdialog({
				autoOpen: true,
				title: data ? messages.pt_br.EDIT_CONTACT : messages.pt_br.ADD_CONTACT,
				draggable: true,
				dialogClass: "add-contact-dialog",
				captionButtons: {
	                pin: { visible: false },
	                refresh: { visible: false },
	                toggle: { visible: false },
	                minimize: { visible: false },
	                maximize: { visible: false }
			    },
			    resizable: false,
				position: [offset.left,offset.top],
				buttons: [
					{
						text: data ? messages.pt_br.EDIT : messages.pt_br.ADD , 
						click: function(){
							if(!_data){
								var data = {};
								$.each($(this).find("input"), function(e, q){
									data[$(q).attr("name")] = $(q).val();
								});
								data['type'] = "subscribe";
								$.xmpp.addContact(data);
								$.xmpp.subscription(data);
							}else{
								_data = $.extend( {}, _data, {name: $(this).find("input:first").val()} );
								$.xmpp.updateContact(_data);
							}
							$(this).wijdialog("destroy");
						}
					},
					{
						text: messages.pt_br.CANCEL, 
						click: function(){
							$(this).wijdialog("destroy");
						}	
					}
				],
				close: function(){
					$(this).wijdialog ("destroy");
				}
			});
			//.appendTo("body");
	  	}

		function authorize(data, subscription){
	  		var _subscription = ""
	  		
	  		if( subscription == "unavailable"){
	  			_subscription = subscription;
	  		}else{
		  		if( data.subscription = "none" ){
		  			_subscription = "subscribe";
		  		}
		
		  		if( data.subscription == "from" ){
		  			_subscription = "subscribe";
		  		}
	  		}
	  		$.xmpp.subscription({"to":data.jid, "type":_subscription});
	  	}

	  	function generateContacts(container_list){
	  		if(settings.contactList.length){
	  			for(var contact in settings.contactList)
					contactListChanges(contact,container_list);
	  		}
	  	}

	  	function contactListChanges(presence, selector){

	  		if(settings.debug)
				debug("Generating contact in the list");
			var md5_contact = MD5.hexdigest(presence[settings.contactNameIndex]);
			var select = $("#"+md5_contact);
			var statusClass = settings.offlineClass;
			var from = presence[settings.contactNameIndex].split("@")[0];

			if(!select.length){
				var contact = $("<li/>")
				.attr("title", messages.pt_br.CLICK_TO_START_A_CONVERSATION_WITH + " " + from)
				.attr("id", md5_contact)
				.addClass(settings.contactClass)
				
				$("<div/>")
				.addClass("chat-status")
				.addClass(statusClass).appendTo(contact);

				$("<span/>")
				.addClass("chat-contact-name")
				.html(from)
				.appendTo(contact);

				contact.click(function(){
					var id = md5_contact+"_chat";
					var conversation = $("#"+id);
					if(conversation.length == 0){
						conversationDialog = openChat({title:from, from: presence[settings.contactNameIndex], id: id, md5_id:md5_contact});
						conversationDialog.parent().find(".ui-dialog-titlebar").prepend(status.clone().removeClass("chatting"));
					}
					else{
						conversation.wijdialog("restore");
						conversation.wijdialog("show");
					}
				});
				selector.append(contact);
			}
			if(settings.debug)
				debug("Generated contact in the list");
	  	}
		
		function htmlEntities( str ) {
			return String(str)
				.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

	  	function openChat(options){
	  		if($.fn.wijdialog){
	  			if(settings.debug)
					debug("Generating Dialog to "+ options.title);
	  			var div = $("<div/>")
	  			.addClass("chat-conversation")
	  			.attr({"id" : options.id, title: options.title})
	  			.append("<div class='chat-conversation-box'/>")
	  			.append("<div class='chat-composing-box'/>");

	  			var pauseTimeOut;
	  			var composingTimeOut = true;

	  			var textarea = $("<textarea/>")
	  			.attr("placeholder", messages.pt_br.WRITE_YOUR_MESSAGE_HERE + "...")
	  			.addClass("chat-conversation-textarea")
	  			.appendTo(div)
	  			.keydown(function(e){
	  				//set a timer
					$(this).parents(".ui-dialog").find(".ui-dialog-titlebar").css({"background":"#5C9CCC", "border-color":"#5C9CCC"});
					document.title = settings.defaultTitle;

	  				if(composingTimeOut){
	  					$.xmpp.isWriting({isWriting : 'composing', to:options.from});
	  					composingTimeOut = false;
	  				}
	  				if(e.which == $.ui.keyCode.ENTER && !e.shiftKey){
	  					var message = textarea.val();
	  					textarea.val("");
	  					e.preventDefault();
	  					if(settings.debug)
							debug("Sending message: "+message+"\nfrom: "+options.from);
	  					$.xmpp.sendMessage({body: htmlEntities(message), to:options.from, resource:"Chat", otherAttr:"value"},
	   						"<error>"+messages.pt_br.AN_ERROR_HAS_OCURRED+"</error>");

	  					var conversation_box = div.find(".chat-conversation-box");
						var date = "<span style='font-size:9px;'>("+(new Date().toString("HH:mm"))+")</span>";

						$("<div/>")
						.addClass("chat-conversation-box-me")
						.html( date + "<strong> " + messages.pt_br.ME + ": </strong>" + htmlEntities( message ) )
						.appendTo(conversation_box);
						conversation_box.scrollTo("div:last");
						conversation_box.next().html("");
						composingTimeOut = true;
						clearTimeout(pauseTimeOut);
						return;	
	  				}
	  				clearTimeout(pauseTimeOut);
	  				pauseTimeOut = setTimeout(function(){
	  					if(textarea.val() != "")
	  						$.xmpp.isWriting({isWriting : 'paused', to:options.from});
	  					else
	  						$.xmpp.isWriting({isWriting : 'inactive', to:options.from});
	  					composingTimeOut = true;
	  				},5000);

	  			});

	  			$(div).append('<audio controls id="new_message_sound" style="display:none;"><source src="'+settings.soundPath+settings.soundName+'.mp3" type="audio/mpeg"/><source src="'+settings.soundPath+settings.soundName+'.ogg" type="audio/ogg"/></audio>');
	  			var status = $("#"+options.md5_id).find(".chat-status");

	  			if(settings.debug)
					debug("Generated Dialog to "+ options.title);

	  			return div.wijdialog({ 
	                autoOpen: true, 
	                captionButtons: { 
	                    refresh: { visible: false },
	                    maximize: {visible: false}
	                },
	                dialogClass: "chat-conversation-dialog",
	                resizable:false,
	                minimizeZoneElementId: (!settings.minimizeZone ? "conversation-bar-container" : settings.minimizeZone),
	                open: function (e) {
	                	status
	                	.addClass("chatting");

	                	$(this).parent().find(".ui-dialog-titlebar").off("click").on("click", function()
	                	{
							$(this).parent().find(".ui-dialog-titlebar").css({"background":"#5C9CCC", "border-color":"#5C9CCC"});
							document.title = settings.defaultTitle;
						});
	                },
	                close: function (e) {
	                	status
	                	.removeClass("chatting");
	                	$.xmpp.isWriting({isWriting : 'gone', to:options.from});
	                	document.title = settings.defaultTitle;
	                	resizeWindow();
	                },
	                focus: function(e){
	                	$(this).find("textarea").focus().click();
	                	document.title = settings.defaultTitle;
						$(this).parent().find(".ui-dialog-titlebar").css({"background":"#5C9CCC", "border-color":"#5C9CCC"});
						document.title = settings.defaultTitle;
						clearTimeout(pauseTimeOut);
		  				$.xmpp.isWriting({isWriting : 'active', to:options.from});
	                },
	                blur: function(e){
	                	pauseTimeOut = setTimeout(function(){
		  					$.xmpp.isWriting({isWriting : 'inactive', to:options.from});
	  					},3000);
	                },
	                stateChanged : function(e){ resizeWindow(); }
	            }); 
	  		}else{
	  			if(settings.debug)
	  				debug("wijmo not found");
	  		}
	  	}

	  	function destroy(containerList, container){
	  		var reconnectButton = container.find(".chat-status");
	  		statusClasses = settings.onlineClass + " " + settings.awayClass + " " + settings.busyClass + " " + settings.offlineClass;
	  		containerList.empty();
	  		var reconnect = function(e){
	  			reconnectButton.unbind('click', reconnect).addClass("chat-status loading-chat");
	  			e.preventDefault();
	  			$.xmpp.connect(connection_options);
	  		}
	  		reconnectButton.removeClass(statusClasses).removeClass("chat-status loading-chat").addClass("retry").click(reconnect);
	  		$(".chat-conversation-dialog textarea").attr("disabled", "disabled");
	  	}

		function debug( $obj ) {
		    if ( window.console && window.console.log ) {
		      window.console.log( $obj );
		    }
	  	};

	  	function formatters(text){
	  		var copy=text;
	  		copy = linkify(copy,{callback: function(text,href){
	  			return href ? '<a style="color:blue;" href="' + href + '" title="' + href + '" target="_blank">' + text + '</a>' : text;
	  		}});
	  		if(settings.emotions){
		  		for(var i in settings.emotions){
		  			copy = copy.replace(settings.emotions[i].emotion, "<span class='emotion "+settings.emotions[i].emotionClass+"'/>");	
		  		}
	  		}
	  		return copy;
	  	}

	  	return this.each(function() {
			if(settings.debug)
				debug(this);
	  	});
  	};

  	

}( jQuery ));
