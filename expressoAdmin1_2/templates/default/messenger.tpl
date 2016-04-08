<!-- BEGIN body -->

<form class="ajax">
	<div class="fpanel ui-dialog ui-widget ui-widget-content ui-corner-all">
		<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">
			<span class="ui-dialog-title">{lang_title}</span>
			<img class="loadgif" src="./prototype/plugins/messenger/images/ajax-loader.gif">
		</div>
		<div class="ui-dialog-content ui-widget-content">
			
			<div class="hline bmargin ui-state-default ui-corner-all">
				<label class="cell">{lang_messenger_enabled}:</label>
				<div class="cell input-right ui-corner-right onoffswitch">
					<div class="onoffswitch">
						<input type="checkbox" name="{input_name_enabled}" class="onoffswitch-checkbox" id="enabled_id" {input_value_enabled}>
						<label class="onoffswitch-label" for="enabled_id">
							<span class="onoffswitch-inner" before="{lang_enabled}" after="{lang_disabled}"></span>
							<span class="onoffswitch-switch"></span>
						</label>
					</div>
				</div>
			</div>
			
			<div class="hline bmargin ui-state-default ui-corner-all">
				<label class="cell">{lang_jabber_domain}:</label>
				<div class="cell input-right ui-corner-right">
					<input class="transparent" name="{input_name_domain}" value="{input_value_domain}">
				</div>
			</div>
			
			<div class="hline bmargin ui-state-default ui-corner-all">
				<label class="cell nowrap">{lang_url}:</label>
				<span class="cell description">{lang_url_ex}</span>
				<div class="cell input-right ui-corner-right">
					<input class="transparent middle" name="{input_name_url}" value="{input_value_url}">
				</div>
			</div>
			
			<div class="hline bmargin ui-state-default ui-corner-all">
				<label class="cell nowrap">{lang_pubkey}:</label>
				<span class="cell description">{lang_pubkey_ex}</span>
				<div class="cell input-right ui-corner-right">
					<textarea class="pubkey transparent" name="{input_name_pubkey}" spellcheck="false">{input_value_pubkey}</textarea>
				</div>
			</div>
			
			<div class="hline bmargin ui-state-default ui-corner-all">
				<label class="cell">{lang_group_enabled}:</label>
				<div class="cell input-right ui-corner-right onoffswitch">
					<div class="onoffswitch">
						<input type="checkbox" name="{input_name_group_enabled}" class="onoffswitch-checkbox" id="group_enabled_id" {input_value_group_enabled}>
						<label class="onoffswitch-label" for="group_enabled_id">
							<span class="onoffswitch-inner" before="{lang_enabled}" after="{lang_disabled}"></span>
							<span class="onoffswitch-switch"></span>
						</label>
					</div>
				</div>
			</div>
			
			<div id="group_options_id" class="ui-dialog ui-widget ui-widget-content ui-corner-all {input_class_group_options}">
				<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">
					<span class="ui-dialog-title">{lang_group_options}</span>
				</div>
				<div class="ui-dialog-content ui-widget-content">
					
					<div class="hline bmargin ui-state-default ui-corner-all">
						<label class="cell">{lang_group_base}:</label>
						<div class="cell input-right ui-corner-right">
							<select name="{input_name_group_base}" class="transparent">
								{opts_groupbase}
							</select>
						</div>
					</div>
					
					<div class="hline bmargin ui-state-default ui-corner-all">
						<label class="cell">{lang_group_filter}:</label>
						<span class="cell description">{lang_group_filter_ex}</span>
						<div class="cell input-right ui-corner-right">
							<textarea class="transparent" name="{input_name_group_filter}" spellcheck="false">{input_value_group_filter}</textarea>
						</div>
					</div>
					
				</div>
			</div>
			
			<div class="center-buttons always-on-screen">
				<input type="submit" value="{lang_save}" name="save" class="ui-button ui-widget ui-state-disabled ui-corner-all" disabled="disabled">
				<input type="submit" value="{lang_cancel}" name="cancel" class="ui-button ui-widget ui-state-disabled ui-corner-all" disabled="disabled">
			</div>
		</div>
	</div>
	<div class="hidden">
		<div id="tpl-dialog-save" title="{lang_save}: {lang_title}"></div>
	</div>
</form>
<!-- END body -->

<!-- BEGIN row_opts -->
<option value="{option_value}"{option_enabled}>{option_text}</option>
<!-- END row_opts -->
