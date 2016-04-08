$( document ).on('GlangLoaded',function() {
	
	function updateTips( t ) {
		$('#tpl-dialog-add .err-msg').find('label').html( t )
		$('#tpl-dialog-add .err-msg').animate({ opacity: 1 }, 500);
		setTimeout(function() { $('#tpl-dialog-add .err-msg').animate({opacity: 0}, 1000 ); }, 3000 );
	};
	
	function addMessage( target, msg, type, prefix ) {
		if ( typeof msg === 'object' ) {
			for ( var i in msg ) addMessage( target, msg[i], type, ((!i.match(/^[0-9]+$/))||prefix)? ((prefix?prefix+': ':'')+((!i.match(/^[0-9]+$/))?i:'')) : undefined );
		} else {
			$(target).append(
				$('<div>').addClass('hline bmargin ui-state-'+type+' ui-corner-all').append(
					$('<label>').addClass('cell').html((prefix?prefix+': ':'')+msg+'.')));
		}
	};
	
	function checkLength( o, min, max, n ) {
		if ( o.find('input').val().trim().length > max || o.find('input').val().trim().length < min ) {
			o.addClass( "ui-state-error" );
			updateTips( n );
			return false;
		}
		return true;
	};
	
	function checkRegexp( o, expr, n ) {
		o.removeClass( "ui-state-error" );
		if ( !( expr.test( o.find('input').val().trim() ) ) ) {
			o.addClass( "ui-state-error" );
			updateTips( n );
			return false;
		}
		return true;
	};
	
	function offsetTopParent( el ) {
		return el == null? 0 : el.offsetTop + offsetTopParent( el.offsetParent );
	}
	
	function offsetLeftParent( el ) {
		return el == null? 0 : el.offsetLeft + offsetLeftParent( el.offsetParent );
	}
	
	jQuery.expr.filters.offscreen = function(el) {
		var x = offsetTopParent( el );
		var y = offsetLeftParent( el );
		return (
			( y + el.offsetWidth ) < window.scrollX ||
			( x + el.offsetHeight ) < window.scrollY ||
			y > ( window.innerWidth + window.scrollX ) ||
			x > ( window.innerHeight + window.scrollY )
		);
	};
	
	function redrawFixMenu() {
		var wrp = $('#always-on-screen-wrapper');
		if ( !wrp.length )
			wrp = $('.always-on-screen').clone(true,true)
				.attr({id: 'always-on-screen-wrapper','class': null})
				.appendTo($('.always-on-screen').parent());
		if ( $('.always-on-screen').is(':offscreen') ) $(wrp).addClass('show');
		else $(wrp).removeClass('show');
	};
	
	function center_viewport( obj ) {
		$(obj).css({
			top: ( ( window.innerHeight - obj.outerHeight() ) / 2 ),
			left: ( ( window.innerWidth - obj.outerWidth() ) / 2 )
		});
	};
	
	$('input#group_enabled_id').on('change',function(){
		if ( $('input#group_enabled_id').is(':checked') ) $('div#group_options_id').removeClass('ui-state-disabled');
		else $('div#group_options_id').addClass('ui-state-disabled');
	});
	
	$('form.ajax').submit(function( event ) {
		if ( $(this).data('inputHandlerEvent') == 'save' ) {
			
			$('#tpl-dialog-save').dialog( "open" );
			
			var data = $(this).serialize();
			$.post( '/index.php?menuaction=expressoAdmin1_2.uimessenger.save', data )
			.done(function( response, message ) {
				
				$('#tpl-dialog-save').data({status:'success'});
				if ( response ) addMessage( $('#tpl-dialog-save'), response, 'highlight' );
				
			}).fail(function( response, h, x, y ) {
				
				$('#tpl-dialog-save').data({status:'error'});
				addMessage( $('#tpl-dialog-save'), response? (( response.responseJSON )? response.responseJSON : response.statusText ) : Glang.get('unknown'), 'error' ); 
				
			}).always(function() {
				var top = $('#tpl-dialog-save').parents('.ui-dialog');
				$(top).find('.loadgif').hide();
				$(top).find('.ui-dialog-buttonset button').prop('disabled', false).removeClass("ui-state-disabled");
			});
		} else if ( $(this).data('inputHandlerEvent') == 'cancel' ) {
			
			window.location = '/admin/index.php';
			
		}
		$(this).data({'inputHandlerEvent': 'none'});
		event.preventDefault();
	}).find('input[type=submit]').prop('disabled', false).button().click(function() {
		
		$('form.ajax').data({'inputHandlerEvent': this.name});
		
	});
	/*$.ui.dialog.prototype._oldinit = $.ui.dialog.prototype._init;
	$.ui.dialog.prototype._init = function() {
	    $(this.element).parent().css('position', 'fixed');
	    $(this.element).dialog("option",{
	        resizeStop: function(event,ui) {
	            var position = [(Math.floor(ui.position.left) - $(window).scrollLeft()),
	                            (Math.floor(ui.position.top) - $(window).scrollTop())];
	            $(event.target).parent().css('position', 'fixed');
	            // $(event.target).parent().dialog('option','position',position);
	            // removed parent() according to hai's comment (I didn't test it)
	            $(event.target).dialog('option','position',position);
	            return true;
	        }
	    });
	    this._oldinit();
	};*/
	
	$('#tpl-dialog-save').dialog({
		width: 500,
		modal: true,
		autoOpen: false,
		draggable: false,
		resizable: false,
		closeOnEscape: false,
		create: function(event) {
			$(this).parent().css({ 'position': 'fixed' });
		},
		open: function(event) {
			var dialog = $(this).parent();
			$(dialog).find('.ui-dialog-titlebar-close').hide();
			$(dialog).find('.loadgif').show();
			$(dialog).find('.ui-dialog-buttonset button').prop('disabled', true).addClass("ui-state-disabled");
			$(window).on('resize.dialog_center_viewport', { target:dialog  }, (function(e) {
				center_viewport( e.data.target );
			}));
			center_viewport( dialog );
		},
		close: function(event) {
			$(window).off('resize.dialog_center_viewport');
			if ($(this).data().status == 'success' ) window.location = '/admin/index.php';
			else $(this).html('');
		},
		buttons: [
			{
				text: Glang.get('Close'),
				click: function() {
					$( this ).dialog( "close" );
				}
			}
		]
	}).parents('.ui-dialog').find('.ui-dialog-titlebar').append('<img class="loadgif" src="./prototype/plugins/messenger/images/ajax-loader.gif">');
	
	redrawFixMenu();
	$(window).scroll(redrawFixMenu).resize(redrawFixMenu);
	
	$('form.ajax .loadgif').hide();
});